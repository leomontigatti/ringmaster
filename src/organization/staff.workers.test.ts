import { beforeEach, describe, expect, it, vi } from "vite-plus/test";

import type { Role } from "#/lib/access.ts";

import {
  adminCaller,
  fakeAccounts,
  freshOrganization,
  inObject,
  inStorage,
  setUpTestOrganization,
} from "#/organization/organization.test-support.ts";
import type { OrganizationStub } from "#/organization/organization.test-support.ts";
import { auditLog } from "#/organization/schema.ts";

// The object reaches Clerk only through its accounts adapter, faked here: each
// test reads what the adapter was asked to do.
vi.mock(import("#/organization/accounts.ts"), async (original) => ({
  ...(await original()),
  accountsFor: () => fakeAccounts,
}));

const startingPassword = "starting-password";

let organization: OrganizationStub;
let organizationId: string;

beforeEach(async () => {
  fakeAccounts.reset();
  ({ organization, organizationId } = await setUpTestOrganization());
});

async function newMember(roles: Role[], email = `${roles.join("-")}@example.com`) {
  const result = await organization.createStaffMember(adminCaller, {
    name: "Juan Gómez",
    email,
    password: startingPassword,
    roles,
  });
  if (!result.ok) {
    throw new Error(`createStaffMember refused: ${result.reason}`);
  }
  return result.member;
}

/** Signs `memberId` past the starting password, as their own change would. */
async function replaceStartingPassword(memberId: string) {
  const changed = await organization.changePassword(
    { userId: memberId },
    { currentPassword: startingPassword, newPassword: "a-new-password" },
  );
  expect(changed).toEqual({ ok: true });
}

describe("creating a staff member", () => {
  it("asks Clerk for the user, with the organization and the roles", async () => {
    const created = await newMember(["staff"]);

    expect(fakeAccounts.calls).toEqual([
      [
        "createUser",
        {
          name: "Juan Gómez",
          email: "staff@example.com",
          password: startingPassword,
          metadata: { organizationId, roles: ["staff"] },
        },
      ],
    ]);
    expect(created).toMatchObject({
      userId: fakeAccounts.lastUserId,
      roles: ["staff"],
      active: true,
    });
    const staff = await organization.listStaff(adminCaller);
    expect(staff.ok && staff.staff.map((member) => member.email)).toEqual([
      "ana@example.com",
      "staff@example.com",
    ]);
  });

  it("holds the new member to the starting password until they replace it", async () => {
    const created = await newMember(["staff"]);

    expect(await organization.listStaff(created)).toEqual({
      ok: false,
      reason: "mustChangePassword",
    });
    expect(await organization.viewer(created)).toMatchObject({
      ok: true,
      viewer: { mustChangePassword: true },
    });

    await replaceStartingPassword(created.userId);

    expect(await organization.viewer(created)).toMatchObject({
      ok: true,
      viewer: { mustChangePassword: false, roles: ["staff"] },
    });
    expect(fakeAccounts.calls.slice(1)).toEqual([
      ["verifyPassword", created.userId, startingPassword],
      ["setPassword", created.userId, "a-new-password"],
    ]);
  });

  it("refuses a taken email and a short password, and asks Clerk for nothing", async () => {
    await newMember(["staff"], "juan@example.com");
    fakeAccounts.reset();
    const base = { name: "Otro", email: "otro@example.com", password: startingPassword };

    const results = [
      await organization.createStaffMember(adminCaller, {
        ...base,
        email: "Juan@example.com",
        roles: ["admin"],
      }),
      await organization.createStaffMember(adminCaller, {
        ...base,
        password: "short",
        roles: ["admin"],
      }),
    ];

    expect(results).toEqual([
      { ok: false, reason: "emailTaken" },
      { ok: false, reason: "passwordTooShort" },
    ]);
    expect(fakeAccounts.calls).toEqual([]);
  });

  it("creates no member when Clerk refuses the user", async () => {
    fakeAccounts.refuseNext("emailTaken");

    expect(
      await organization.createStaffMember(adminCaller, {
        name: "Otro",
        email: "otro@example.com",
        password: startingPassword,
        roles: ["staff"],
      }),
    ).toEqual({ ok: false, reason: "emailTaken" });
    const staff = await organization.listStaff(adminCaller);
    expect(staff.ok && staff.staff).toHaveLength(1);
  });

  it("deletes the Clerk user when the email is taken while Clerk answers", async () => {
    const release = fakeAccounts.hold("createUser");
    const creating = organization.createStaffMember(adminCaller, {
      name: "Otro",
      email: "otro@example.com",
      password: startingPassword,
      roles: ["staff"],
    });
    await vi.waitUntil(() => fakeAccounts.calls.length > 0);
    const orphan = fakeAccounts.lastUserId!;
    await organization.addMember(adminCaller, {
      userId: "user-other",
      name: "Otro",
      email: "otro@example.com",
      roles: ["staff"],
    });
    release();

    expect(await creating).toEqual({ ok: false, reason: "emailTaken" });
    expect(fakeAccounts.calls.at(-1)).toEqual(["deleteUser", orphan]);
    expect(fakeAccounts.hasUser(orphan)).toBe(false);
  });

  it("adopts the Clerk user an earlier create of this organization left without a member", async () => {
    const orphan = fakeAccounts.addUser("otro@example.com", { organizationId, roles: ["admin"] });

    const created = await organization.createStaffMember(adminCaller, {
      name: "Otro",
      email: "otro@example.com",
      password: startingPassword,
      roles: ["staff"],
    });

    expect(created).toMatchObject({
      ok: true,
      member: { userId: orphan, roles: ["staff"] },
    });
    expect(fakeAccounts.calls.slice(1)).toEqual([
      ["findUserByEmail", "otro@example.com"],
      ["setPassword", orphan, startingPassword],
      ["updateMetadata", orphan, { organizationId, roles: ["staff"] }],
    ]);
  });

  it("refuses a second create of an email still being created, and asks Clerk nothing for it", async () => {
    const release = fakeAccounts.hold("createUser");
    const first = organization.createStaffMember(adminCaller, {
      name: "Otro",
      email: "otro@example.com",
      password: startingPassword,
      roles: ["staff"],
    });
    await vi.waitUntil(() => fakeAccounts.calls.length > 0);

    expect(
      await organization.createStaffMember(adminCaller, {
        name: "Otra",
        email: "OTRO@example.com",
        password: "another-password",
        roles: ["admin"],
      }),
    ).toEqual({ ok: false, reason: "emailTaken" });
    release();

    expect(await first).toMatchObject({ ok: true, member: { name: "Otro" } });
    expect(fakeAccounts.calls.map(([method]) => method)).toEqual(["createUser"]);
  });

  it("lets the email be created again once a create of it has failed", async () => {
    fakeAccounts.failNext("createUser");
    await inObject(organization, (instance) =>
      expect(
        instance.createStaffMember(adminCaller, {
          name: "Otro",
          email: "otro@example.com",
          password: startingPassword,
          roles: ["staff"],
        }),
      ).rejects.toThrow("Clerk is unreachable"),
    );

    expect(
      await organization.createStaffMember(adminCaller, {
        name: "Otro",
        email: "otro@example.com",
        password: startingPassword,
        roles: ["staff"],
      }),
    ).toMatchObject({ ok: true });
  });

  it("does not adopt a Clerk user of another organization", async () => {
    fakeAccounts.addUser("otro@example.com", { organizationId: "other", roles: ["admin"] });

    expect(
      await organization.createStaffMember(adminCaller, {
        name: "Otro",
        email: "otro@example.com",
        password: startingPassword,
        roles: ["staff"],
      }),
    ).toEqual({ ok: false, reason: "emailTaken" });
    expect(fakeAccounts.calls.map(([method]) => method)).toEqual(["createUser", "findUserByEmail"]);
  });
});

describe("changing roles", () => {
  it("takes effect on the member's next call, and is mirrored to Clerk", async () => {
    const created = await newMember(["staff"]);
    await replaceStartingPassword(created.userId);
    expect(await organization.listStaff(created)).toEqual({ ok: false, reason: "forbidden" });
    fakeAccounts.reset();

    const saved = await organization.updateMember(adminCaller, {
      memberId: created.memberId,
      roles: ["admin", "staff"],
    });

    expect(saved).toMatchObject({ ok: true, member: { roles: ["admin", "staff"] } });
    expect((await organization.listStaff(created)).ok).toBe(true);
    expect(fakeAccounts.calls).toEqual([
      ["updateMetadata", created.userId, { roles: ["admin", "staff"] }],
    ]);
    const entries = await inStorage(organization, (database) =>
      database.select().from(auditLog).all(),
    );
    expect(entries.at(-1)).toMatchObject({
      action: "update",
      entityType: "member",
      entityId: created.userId,
      userId: adminCaller.userId,
      before: { roles: "staff" },
      after: { roles: "admin,staff" },
    });
  });
});

describe("the last admin", () => {
  it("can neither lose the admin role nor be deactivated, and nothing is saved", async () => {
    await organization.updateMember(adminCaller, {
      memberId: adminCaller.userId,
      roles: ["admin", "staff"],
    });
    fakeAccounts.reset();

    const results = [
      await organization.updateMember(adminCaller, {
        memberId: adminCaller.userId,
        roles: ["staff"],
      }),
      await organization.setMemberActive(adminCaller, {
        memberId: adminCaller.userId,
        active: false,
      }),
    ];

    expect(results).toEqual([
      { ok: false, reason: "lastAdmin" },
      { ok: false, reason: "lastAdmin" },
    ]);
    expect(
      await organization.getStaffMember(adminCaller, { memberId: adminCaller.userId }),
    ).toMatchObject({
      ok: true,
      member: {
        roles: ["admin", "staff"],
        active: true,
      },
    });
    expect(fakeAccounts.calls).toEqual([]);
  });

  it("counts only active admins", async () => {
    const other = await newMember(["admin"]);
    await organization.setMemberActive(adminCaller, { memberId: other.memberId, active: false });

    expect(
      await organization.updateMember(adminCaller, {
        memberId: adminCaller.userId,
        roles: ["staff"],
      }),
    ).toEqual({ ok: false, reason: "lastAdmin" });
  });

  it("lets an admin step down while another active admin remains", async () => {
    await newMember(["admin"]);

    expect(
      await organization.updateMember(adminCaller, {
        memberId: adminCaller.userId,
        roles: ["staff"],
      }),
    ).toMatchObject({ ok: true, member: { roles: ["staff"] } });
  });
});

describe("deactivating a member", () => {
  it("refuses their next call, asks Clerk to ban them, and deletes nothing", async () => {
    const created = await newMember(["staff"]);
    await replaceStartingPassword(created.userId);
    fakeAccounts.reset();

    const result = await organization.setMemberActive(adminCaller, {
      memberId: created.memberId,
      active: false,
    });

    expect(result).toEqual({ ok: true });
    expect(await organization.viewer(created)).toEqual({ ok: false, reason: "unauthenticated" });
    expect(fakeAccounts.calls).toEqual([["ban", created.userId]]);
    expect(
      await organization.getStaffMember(adminCaller, { memberId: created.memberId }),
    ).toMatchObject({ ok: true, member: { email: created.email, active: false } });
  });

  it("lets a reactivated member back in, and asks Clerk to lift the ban", async () => {
    const created = await newMember(["staff"]);
    await organization.setMemberActive(adminCaller, { memberId: created.memberId, active: false });
    fakeAccounts.reset();

    await organization.setMemberActive(adminCaller, { memberId: created.memberId, active: true });

    expect((await organization.viewer(created)).ok).toBe(true);
    expect(fakeAccounts.calls).toEqual([["unban", created.userId]]);
    const entries = await inStorage(organization, (database) =>
      database.select().from(auditLog).all(),
    );
    expect(entries.slice(-2).map((entry) => entry.action)).toEqual(["deactivate", "reactivate"]);
  });

  it("leaves the Clerk user unbanned when another admin reactivates while Clerk bans", async () => {
    const created = await newMember(["staff"]);
    fakeAccounts.reset();
    const release = fakeAccounts.hold("ban");

    const deactivating = organization.setMemberActive(adminCaller, {
      memberId: created.memberId,
      active: false,
    });
    await vi.waitUntil(() => fakeAccounts.calls.length > 0);
    await organization.setMemberActive(adminCaller, { memberId: created.memberId, active: true });
    release();
    await deactivating;

    expect(fakeAccounts.calls.at(-1)).toEqual(["unban", created.userId]);
    expect((await organization.viewer(created)).ok).toBe(true);
  });
});

describe("passwords", () => {
  it("gives a member a new starting password, which they must replace again", async () => {
    const created = await newMember(["staff"]);
    await replaceStartingPassword(created.userId);
    fakeAccounts.reset();

    const result = await organization.setStartingPassword(adminCaller, {
      memberId: created.memberId,
      password: "another-start",
    });

    expect(result).toEqual({ ok: true });
    expect(fakeAccounts.calls).toEqual([["setPassword", created.userId, "another-start"]]);
    expect(await organization.listStaff(created)).toEqual({
      ok: false,
      reason: "mustChangePassword",
    });
  });

  it("refuses a starting password that is too short", async () => {
    const created = await newMember(["staff"]);

    expect(
      await organization.setStartingPassword(adminCaller, {
        memberId: created.memberId,
        password: "short",
      }),
    ).toEqual({ ok: false, reason: "passwordTooShort" });
  });

  it("refuses a starting password longer than Clerk's 72 bytes", async () => {
    const created = await newMember(["staff"]);

    const results = [
      await organization.setStartingPassword(adminCaller, {
        memberId: created.memberId,
        password: "a".repeat(73),
      }),
      // Clerk counts bytes: 37 "ñ" are 74 bytes in UTF-8.
      await organization.setStartingPassword(adminCaller, {
        memberId: created.memberId,
        password: "ñ".repeat(37),
      }),
      await organization.setStartingPassword(adminCaller, {
        memberId: created.memberId,
        password: "a".repeat(72),
      }),
    ];

    expect(results).toEqual([
      { ok: false, reason: "passwordTooLong" },
      { ok: false, reason: "passwordTooLong" },
      { ok: true },
    ]);
  });

  it("refuses a wrong current password, or the same one, and keeps the hold", async () => {
    const created = await newMember(["staff"]);
    fakeAccounts.rejectPasswords();

    const results = [
      await organization.changePassword(created, {
        currentPassword: "wrong-password",
        newPassword: "a-new-password",
      }),
      await organization.changePassword(created, {
        currentPassword: startingPassword,
        newPassword: startingPassword,
      }),
    ];

    expect(results).toEqual([
      { ok: false, reason: "wrongPassword" },
      { ok: false, reason: "samePassword" },
    ]);
    expect(await organization.viewer(created)).toMatchObject({
      viewer: { mustChangePassword: true },
    });
  });

  it("lets any member change their own password at any time", async () => {
    const created = await newMember(["staff"]);
    await replaceStartingPassword(created.userId);

    expect(
      await organization.changePassword(created, {
        currentPassword: "a-new-password",
        newPassword: "another-password",
      }),
    ).toEqual({ ok: true });
  });
});

describe("refusals", () => {
  it("refuses every staff call to anyone without the admin role, and changes nothing", async () => {
    const created = await newMember(["staff"]);
    await replaceStartingPassword(created.userId);
    fakeAccounts.reset();
    const memberId = created.memberId;

    const results = [
      await organization.listStaff(created),
      await organization.getStaffMember(created, { memberId }),
      await organization.createStaffMember(created, {
        name: "X",
        email: "x@example.com",
        password: startingPassword,
        roles: ["admin"],
      }),
      await organization.updateMember(created, { memberId, roles: ["admin"] }),
      await organization.setMemberActive(created, { memberId: adminCaller.userId, active: false }),
      await organization.setStartingPassword(created, {
        memberId: adminCaller.userId,
        password: "x-password",
      }),
    ];

    for (const result of results) {
      expect(result).toEqual({ ok: false, reason: "forbidden" });
    }
    expect(fakeAccounts.calls).toEqual([]);
    expect(await organization.getStaffMember(adminCaller, { memberId })).toMatchObject({
      ok: true,
      member: { roles: ["staff"], active: true },
    });
  });

  it("answers notFound for a member of another organization", async () => {
    const created = await newMember(["staff"]);
    const other = freshOrganization().organization;
    await other.setUp({
      organizationId: "other",
      name: "Otra",
      admin: { userId: adminCaller.userId, name: "Ana Admin", email: "ana@example.com" },
    });

    const results = [
      await other.getStaffMember(adminCaller, { memberId: created.memberId }),
      await other.updateMember(adminCaller, { memberId: created.memberId, roles: ["admin"] }),
      await other.setMemberActive(adminCaller, { memberId: created.memberId, active: false }),
      await other.setStartingPassword(adminCaller, {
        memberId: created.memberId,
        password: "x-password",
      }),
    ];

    for (const result of results) {
      expect(result).toEqual({ ok: false, reason: "notFound" });
    }
  });
});

describe("setting an organization up", () => {
  it("creates its first admin's Clerk user and member, who must replace the starting password", async () => {
    const { organization: fresh } = freshOrganization();
    fakeAccounts.reset();

    const result = await fresh.setUpWithAccount({
      organizationId: "ferreteria-belgrano",
      name: "Ferretería Belgrano",
      admin: { name: "Ana Gómez", email: "Ana@Example.com", password: startingPassword },
    });

    expect(result).toEqual({ ok: true, userId: fakeAccounts.lastUserId });
    expect(fakeAccounts.calls).toEqual([
      [
        "createUser",
        {
          name: "Ana Gómez",
          email: "ana@example.com",
          password: startingPassword,
          metadata: { organizationId: "ferreteria-belgrano", roles: ["admin"] },
        },
      ],
    ]);
    expect(await fresh.viewer({ userId: fakeAccounts.lastUserId! })).toMatchObject({
      ok: true,
      viewer: {
        organizationId: "ferreteria-belgrano",
        organizationName: "Ferretería Belgrano",
        roles: ["admin"],
        mustChangePassword: true,
      },
    });
  });

  it("changes nothing, and creates no user, when the organization is already set up", async () => {
    fakeAccounts.reset();

    expect(
      await organization.setUpWithAccount({
        organizationId,
        name: "Otra",
        admin: { name: "Otro", email: "otro@example.com", password: startingPassword },
      }),
    ).toEqual({ ok: false, reason: "alreadySetUp" });
    expect(fakeAccounts.calls).toEqual([]);
  });
});
