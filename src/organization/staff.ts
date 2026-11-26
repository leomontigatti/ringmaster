import { and, asc, eq, ne } from "drizzle-orm";

import type { Role } from "#/lib/access.ts";
import { changedFields } from "#/lib/audit-fields.ts";
import {
  fitsMaxPasswordBytes,
  minPasswordLength,
  passwordChangeSchema,
} from "#/lib/password-change.ts";
import { present } from "#/lib/present.ts";
import {
  memberActiveChangeSchema,
  memberUpdateSchema,
  staffInputSchema,
  startingPasswordSchema,
} from "#/lib/staff.ts";
import type {
  MemberActiveChange,
  MemberUpdate,
  StaffInput,
  StartingPasswordChange,
} from "#/lib/staff.ts";

import type {
  AccountMetadata,
  Accounts,
  NewUser,
  PasswordRefusal,
} from "#/organization/accounts.ts";
import { recordAudit } from "#/organization/audit.ts";
import type { Database, Writer } from "#/organization/database.ts";
import { insertMember, setUpOrganization } from "#/organization/members.ts";
import type { Acting } from "#/organization/members.ts";
import { member, organization } from "#/organization/schema.ts";

// The organization's staff: their accounts and roles.
// Who may call each is the object's concern (an admin, except a member's own
// password). Nothing is deleted: a deactivated member keeps their rows and can
// be reactivated.
//
// The member table is the truth the object authorizes from; the Clerk user
// mirrors it (`src/organization/accounts.ts`). A change commits here first, in
// one transaction with no `await` inside, and is then mirrored: a mirror that
// fails leaves the change in force, and repeating the change mirrors it again.

export interface StaffMember {
  /** The member's user id: what the staff screens' links carry. */
  memberId: string;
  userId: string;
  name: string;
  email: string;
  roles: Role[];
  active: boolean;
}

const invalidInput = { ok: false, reason: "invalidInput" } as const;
const notFound = { ok: false, reason: "notFound" } as const;
const lastAdmin = { ok: false, reason: "lastAdmin" } as const;

function passwordLengthRefusal(password: string): PasswordRefusal | undefined {
  if (password.length < minPasswordLength) {
    return "passwordTooShort";
  }
  if (!fitsMaxPasswordBytes(password)) {
    return "passwordTooLong";
  }
  return undefined;
}

function selectStaff(database: Writer, memberId?: string): StaffMember[] {
  return database
    .select({
      userId: member.userId,
      name: member.name,
      email: member.email,
      roles: member.roles,
      active: member.active,
    })
    .from(member)
    .where(memberId === undefined ? undefined : eq(member.userId, memberId))
    .orderBy(asc(member.name), asc(member.email))
    .all()
    .map((row) => ({ ...row, memberId: row.userId }));
}

function findStaffMember(database: Writer, memberId: string): StaffMember | undefined {
  return selectStaff(database, memberId)[0];
}

/** Whether `memberId` is the only active admin, so it must stay one. */
function isLastActiveAdmin(writer: Writer, memberId: string): boolean {
  const others = writer
    .select({ roles: member.roles })
    .from(member)
    .where(and(eq(member.active, true), ne(member.userId, memberId)))
    .all();
  return !others.some((row) => row.roles.includes("admin"));
}

function organizationIdOf(database: Writer): string {
  const row = database.select({ id: organization.id }).from(organization).get();
  if (!row) {
    throw new Error("the organization is not set up");
  }
  return row.id;
}

export function listStaff(database: Database) {
  return { ok: true as const, staff: selectStaff(database) };
}

export function getStaffMember(database: Database, input: { memberId: string }) {
  const found = findStaffMember(database, input.memberId);
  return found ? { ok: true as const, member: found } : notFound;
}

/**
 * Creates the member's Clerk user, with the organization, the roles and the
 * starting-password flag, then the member. A refusal creates neither. A create of an email another
 * call is still creating is refused (`emailsInFlight`).
 */
export async function createStaffMember(
  database: Database,
  accounts: Accounts,
  emailsInFlight: EmailsInFlight,
  acting: Acting,
  input: StaffInput,
) {
  const parsed = staffInputSchema.safeParse(input);
  if (!parsed.success) {
    return invalidInput;
  }
  const { roles, password, ...person } = parsed.data;
  const email = person.email.toLowerCase();
  const refusal = passwordLengthRefusal(password);
  if (refusal) {
    return { ok: false as const, reason: refusal };
  }
  if (
    emailsInFlight.has(email) ||
    database.select().from(member).where(eq(member.email, email)).get()
  ) {
    return { ok: false as const, reason: "emailTaken" as const };
  }
  return whileInFlight(emailsInFlight, email, async () => {
    const metadata: AccountMetadata = { organizationId: organizationIdOf(database), roles };
    const created = await createOrAdoptUser(database, accounts, {
      ...person,
      email,
      password,
      metadata,
    });
    if (!created.ok) {
      return created;
    }
    const added = database.transaction((tx) =>
      insertMember(tx, acting.userId, {
        userId: created.userId,
        ...person,
        email,
        roles,
        mustChangePassword: true,
      }),
    );
    if (!added.ok) {
      // Another call took the email while Clerk answered.
      await deleteUnclaimedUser(database, accounts, created.userId);
      return { ok: false as const, reason: "emailTaken" as const };
    }
    const member = findStaffMember(database, created.userId);
    return { ok: true as const, member: present(member, "A member just added is found") };
  });
}

/**
 * The emails whose Clerk user a call is creating or adopting right now, kept
 * on the object instance. The object takes other calls while Clerk answers,
 * so without it a second create of the same email would find the first one's
 * fresh user without a member, adopt it and overwrite its password.
 */
export type EmailsInFlight = Set<string>;

async function whileInFlight<T>(
  emailsInFlight: EmailsInFlight,
  email: string,
  work: () => Promise<T>,
) {
  emailsInFlight.add(email);
  try {
    return await work();
  } finally {
    emailsInFlight.delete(email);
  }
}

function isMember(database: Writer, userId: string): boolean {
  return Boolean(
    database.select({ userId: member.userId }).from(member).where(eq(member.userId, userId)).get(),
  );
}

/**
 * Creates the user in Clerk. When Clerk already holds the email for a user
 * this organization created but never made a member (an earlier create that
 * stopped before its insert committed), that user is adopted instead, with
 * the new password and roles, so a retry does not answer `emailTaken` forever.
 */
async function createOrAdoptUser(database: Database, accounts: Accounts, user: NewUser) {
  const created = await accounts.createUser(user);
  if (created.ok || created.reason !== "emailTaken") {
    return created;
  }
  const found = await accounts.findUserByEmail(user.email);
  if (
    !found ||
    found.metadata.organizationId !== user.metadata.organizationId ||
    isMember(database, found.userId)
  ) {
    return created;
  }
  const set = await accounts.setPassword(found.userId, user.password);
  if (!set.ok) {
    return set;
  }
  await accounts.updateMetadata(found.userId, user.metadata);
  return { ok: true as const, userId: found.userId };
}

/** Deletes a Clerk user no member row claims: what a refused insert leaves behind. */
async function deleteUnclaimedUser(database: Database, accounts: Accounts, userId: string) {
  if (!isMember(database, userId)) {
    await accounts.deleteUser(userId);
  }
}

/**
 * Replaces the member's roles, in one transaction. New roles take effect on
 * the member's next call, and are then mirrored to Clerk.
 */
export async function updateMember(
  database: Database,
  accounts: Accounts,
  acting: Acting,
  input: MemberUpdate,
) {
  const parsed = memberUpdateSchema.safeParse(input);
  if (!parsed.success) {
    return invalidInput;
  }
  const { memberId, roles } = parsed.data;
  const saved = database.transaction((tx) => {
    const target = findStaffMember(tx, memberId);
    if (!target) {
      return notFound;
    }
    if (!roles.includes("admin") && isLastActiveAdmin(tx, target.memberId)) {
      return lastAdmin;
    }
    saveRoles(tx, acting, target, roles);
    return { ok: true as const };
  });
  if (!saved.ok) {
    return saved;
  }
  await accounts.updateMetadata(memberId, { roles });
  const member = findStaffMember(database, memberId);
  return { ok: true as const, member: present(member, "A member just updated is found") };
}

function saveRoles(tx: Writer, acting: Acting, target: StaffMember, roles: Role[]) {
  tx.update(member).set({ roles }).where(eq(member.userId, target.memberId)).run();
  const changed = changedFields({ roles: target.roles.join(",") }, { roles: roles.join(",") });
  if (changed) {
    recordAudit(tx, acting.userId, {
      action: "update",
      entityType: "member",
      entityId: target.memberId,
      ...changed,
    });
  }
}

/**
 * Deactivates or reactivates a member. A deactivated member's next call is
 * refused by the object at once; the Clerk ban then ends their sessions, and
 * a reactivation lifts it.
 */
export async function setMemberActive(
  database: Database,
  accounts: Accounts,
  acting: Acting,
  input: MemberActiveChange,
) {
  const parsed = memberActiveChangeSchema.safeParse(input);
  if (!parsed.success) {
    return invalidInput;
  }
  const { memberId, active } = parsed.data;
  const saved = database.transaction((tx) => {
    const target = findStaffMember(tx, memberId);
    if (!target) {
      return notFound;
    }
    if (!active && isLastActiveAdmin(tx, memberId)) {
      return lastAdmin;
    }
    if (target.active !== active) {
      tx.update(member).set({ active }).where(eq(member.userId, memberId)).run();
      recordAudit(tx, acting.userId, {
        action: active ? "reactivate" : "deactivate",
        entityType: "member",
        entityId: memberId,
        before: { active: target.active },
        after: { active },
      });
    }
    return { ok: true as const };
  });
  if (!saved.ok) {
    return saved;
  }
  await mirrorActive(database, accounts, memberId, active);
  return saved;
}

/**
 * Bans or unbans the member's Clerk user to match `active`. Another admin's
 * change can commit while Clerk answers, so the flag is read again after the
 * call and mirrored once more when it moved.
 */
async function mirrorActive(
  database: Database,
  accounts: Accounts,
  memberId: string,
  active: boolean,
) {
  let mirrored = active;
  for (let call = 0; call < 2; call++) {
    await (mirrored ? accounts.unban(memberId) : accounts.ban(memberId));
    const current = database
      .select({ active: member.active })
      .from(member)
      .where(eq(member.userId, memberId))
      .get()?.active;
    if (current === undefined || current === mirrored) {
      return;
    }
    mirrored = current;
  }
}

/** Gives the member a new starting password, which they must replace again. */
export async function setStartingPassword(
  database: Database,
  accounts: Accounts,
  input: StartingPasswordChange,
) {
  const parsed = startingPasswordSchema.safeParse(input);
  if (!parsed.success) {
    return invalidInput;
  }
  const { memberId, password } = parsed.data;
  if (!findStaffMember(database, memberId)) {
    return notFound;
  }
  const refusal = passwordLengthRefusal(password);
  if (refusal) {
    return { ok: false as const, reason: refusal };
  }
  const set = await accounts.setPassword(memberId, password);
  if (!set.ok) {
    return set;
  }
  markPasswordChange(database, memberId, true);
  return { ok: true as const };
}

function markPasswordChange(database: Database, memberId: string, mustChangePassword: boolean) {
  database.transaction((tx) =>
    tx.update(member).set({ mustChangePassword }).where(eq(member.userId, memberId)).run(),
  );
}

/**
 * A signed-in member replaces their own password, through Clerk's password
 * update, which lifts the hold of a starting password.
 */
export async function changeOwnPassword(
  database: Database,
  accounts: Accounts,
  acting: Acting,
  input: { currentPassword: string; newPassword: string },
) {
  const parsed = passwordChangeSchema.safeParse(input);
  if (!parsed.success) {
    return invalidInput;
  }
  const { currentPassword, newPassword } = parsed.data;
  if (newPassword === currentPassword) {
    return { ok: false as const, reason: "samePassword" as const };
  }
  if (!(await accounts.verifyPassword(acting.userId, currentPassword))) {
    return { ok: false as const, reason: "wrongPassword" as const };
  }
  const set = await accounts.setPassword(acting.userId, newPassword);
  if (!set.ok) {
    return set;
  }
  markPasswordChange(database, acting.userId, false);
  return { ok: true as const };
}

/**
 * Sets the organization up with its first admin's Clerk user, who must replace
 * the starting password: what the setup script asks for. An organization
 * already set up is left as it is, and no user is created.
 */
export async function setUpWithAccount(
  database: Database,
  accounts: Accounts,
  emailsInFlight: EmailsInFlight,
  input: {
    organizationId: string;
    name: string;
    admin: { name: string; email: string; password: string };
  },
) {
  if (database.select({ id: organization.id }).from(organization).get()) {
    return { ok: false as const, reason: "alreadySetUp" as const };
  }
  const { password, ...person } = input.admin;
  const email = person.email.trim().toLowerCase();
  const refusal = passwordLengthRefusal(password);
  if (refusal) {
    return { ok: false as const, reason: refusal };
  }
  if (emailsInFlight.has(email)) {
    return { ok: false as const, reason: "emailTaken" as const };
  }
  return whileInFlight(emailsInFlight, email, async () => {
    const created = await createOrAdoptUser(database, accounts, {
      name: person.name.trim(),
      email,
      password,
      metadata: { organizationId: input.organizationId, roles: ["admin"] },
    });
    if (!created.ok) {
      return created;
    }
    const setUp = setUpOrganization(database, {
      organizationId: input.organizationId,
      name: input.name,
      admin: { userId: created.userId, ...person, email, mustChangePassword: true },
    });
    if (!setUp.ok) {
      await deleteUnclaimedUser(database, accounts, created.userId);
      return setUp;
    }
    return { ok: true as const, userId: created.userId };
  });
}
