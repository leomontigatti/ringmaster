import { env, runInDurableObject } from "cloudflare:test";
import { eq, sql } from "drizzle-orm";

import type { Role } from "#/lib/access.ts";

import type { AccountMetadata, Accounts, CreateUserResult } from "#/organization/accounts.ts";
import { openDatabase } from "#/organization/database.ts";
import type { Database } from "#/organization/database.ts";
import type { Organization } from "#/organization/organization.ts";
import { auditLog } from "#/organization/schema.ts";
import type { WorkerEnv } from "#/server/caller.ts";

// Fixtures for the organization object's tests (`*.workers.test.ts`): a fresh
// object per call, set up with its first admin, and members by role.

const bindings: WorkerEnv = env;

export type OrganizationStub = DurableObjectStub<Organization>;

/** A new organization's object, never used by another test. */
export function freshOrganization(): { organizationId: string; organization: OrganizationStub } {
  const organizationId = `test-${crypto.randomUUID()}`;
  return {
    organizationId,
    organization: bindings.ORGANIZATION.get(bindings.ORGANIZATION.idFromName(organizationId)),
  };
}

export const adminCaller = { userId: "user-admin" };

/** A fresh organization, set up with `adminCaller` as its first admin. */
export async function setUpTestOrganization() {
  const fresh = freshOrganization();
  const setUp = await fresh.organization.setUp({
    organizationId: fresh.organizationId,
    name: "Comercio Prueba",
    admin: { userId: adminCaller.userId, name: "Ana Admin", email: "ana@example.com" },
  });
  if (!setUp.ok) {
    throw new Error(`setUp refused: ${setUp.reason}`);
  }
  return fresh;
}

/** Adds a member with `roles`, as the first admin, and returns them as a caller. */
export async function addMember(organization: OrganizationStub, roles: Role[]) {
  const userId = `user-${crypto.randomUUID()}`;
  const added = await organization.addMember(adminCaller, {
    userId,
    name: `Miembro ${roles.join(" ")}`,
    email: `${userId}@example.com`,
    roles,
  });
  if (!added.ok) {
    throw new Error(`addMember refused: ${added.reason}`);
  }
  return { userId };
}

/**
 * Calls the object's methods on its instance, not through the stub: for a
 * method expected to throw. A throw across RPC is logged inside the object as
 * an uncaught exception, which the Workers test runner fails the run on.
 */
export function inObject<T>(
  organization: OrganizationStub,
  work: (instance: Organization) => Promise<T>,
) {
  // Named, since the stub alone types the instance as RPC's branded type; it is the object itself.
  return runInDurableObject<Organization, T>(organization, work);
}

/** Runs `work` on the object's storage directly: for what no method reads or writes yet. */
export function inStorage<T>(organization: OrganizationStub, work: (database: Database) => T) {
  return runInDurableObject(organization, (_instance, state) => work(openDatabase(state.storage)));
}

/** The audit entries about `entityId`, oldest first, as the log keeps them. */
export function auditEntriesFor(organization: OrganizationStub, entityId: string) {
  return inStorage(organization, (database) =>
    database
      .select({
        action: auditLog.action,
        entityType: auditLog.entityType,
        userId: auditLog.userId,
        before: auditLog.before,
        after: auditLog.after,
      })
      .from(auditLog)
      .where(eq(auditLog.entityId, entityId))
      // Insertion order: two entries can share a millisecond.
      .orderBy(sql`rowid`)
      .all(),
  );
}

type Call = { [K in keyof Accounts]: [K, ...Parameters<Accounts[K]>] }[keyof Accounts];

type UserRefusal = Extract<CreateUserResult, { ok: false }>["reason"];

interface FakeUser {
  userId: string;
  email: string;
  metadata: Partial<AccountMetadata>;
}

/**
 * A stand-in for Clerk's accounts. It records every call, keeps one user per
 * email, and accepts a password only when it is the user's current one.
 */
class FakeAccounts implements Accounts {
  calls: Call[] = [];
  lastUserId: string | undefined;
  readonly #passwords = new Map<string, string>();
  readonly #users = new Map<string, FakeUser>();
  readonly #holds = new Map<keyof Accounts, Promise<void>>();
  readonly #failures = new Set<keyof Accounts>();
  #refusal: UserRefusal | undefined;

  /** Forgets the calls and the users: what each test starts from. */
  reset() {
    this.calls = [];
    this.#users.clear();
    this.#holds.clear();
    this.#failures.clear();
    this.#refusal = undefined;
  }

  /** Makes the next `method` call throw, after it is recorded: Clerk unreachable. */
  failNext(method: keyof Accounts) {
    this.#failures.add(method);
  }

  /** Refuses the next user created, as Clerk would. */
  refuseNext(reason: UserRefusal) {
    this.#refusal = reason;
  }

  /** Forgets every password, so any current password is wrong. */
  rejectPasswords() {
    this.#passwords.clear();
  }

  /** A user Clerk already holds, as an earlier create that never became a member leaves it. */
  addUser(email: string, metadata: Partial<AccountMetadata>) {
    const userId = `user-${crypto.randomUUID()}`;
    this.#users.set(userId, { userId, email, metadata });
    return userId;
  }

  /** Whether Clerk still holds `userId`. */
  hasUser(userId: string) {
    return this.#users.has(userId);
  }

  /**
   * Makes the next `method` call wait, after it is recorded and has taken
   * effect, until the returned function is called: Clerk answering slowly.
   */
  hold(method: keyof Accounts) {
    let release = () => {};
    this.#holds.set(
      method,
      new Promise<void>((resolve) => {
        release = resolve;
      }),
    );
    return () => release();
  }

  async #answer<T>(method: keyof Accounts, value: T): Promise<T> {
    const held = this.#holds.get(method);
    this.#holds.delete(method);
    await held;
    if (this.#failures.delete(method)) {
      throw new Error(`Clerk is unreachable (${method})`);
    }
    return value;
  }

  createUser(user: Parameters<Accounts["createUser"]>[0]): Promise<CreateUserResult> {
    this.calls.push(["createUser", user]);
    const refusal = this.#refusal;
    this.#refusal = undefined;
    if (refusal) {
      return this.#answer("createUser", { ok: false, reason: refusal });
    }
    if ([...this.#users.values()].some((existing) => existing.email === user.email)) {
      return this.#answer("createUser", { ok: false, reason: "emailTaken" });
    }
    const userId = `user-${crypto.randomUUID()}`;
    this.lastUserId = userId;
    this.#users.set(userId, { userId, email: user.email, metadata: user.metadata });
    this.#passwords.set(userId, user.password);
    return this.#answer("createUser", { ok: true, userId });
  }

  updateMetadata(...call: Parameters<Accounts["updateMetadata"]>) {
    this.calls.push(["updateMetadata", ...call]);
    const [userId, metadata] = call;
    const user = this.#users.get(userId);
    if (user) {
      user.metadata = { ...user.metadata, ...metadata };
    }
    return this.#answer("updateMetadata", undefined);
  }

  setPassword(userId: string, password: string) {
    this.calls.push(["setPassword", userId, password]);
    this.#passwords.set(userId, password);
    return this.#answer("setPassword", { ok: true as const });
  }

  verifyPassword(userId: string, password: string) {
    this.calls.push(["verifyPassword", userId, password]);
    return this.#answer("verifyPassword", this.#passwords.get(userId) === password);
  }

  findUserByEmail(email: string) {
    this.calls.push(["findUserByEmail", email]);
    const user = [...this.#users.values()].find((existing) => existing.email === email);
    return this.#answer(
      "findUserByEmail",
      user && { userId: user.userId, metadata: { ...user.metadata } },
    );
  }

  deleteUser(userId: string) {
    this.calls.push(["deleteUser", userId]);
    this.#users.delete(userId);
    return this.#answer("deleteUser", undefined);
  }

  ban(userId: string) {
    this.calls.push(["ban", userId]);
    return this.#answer("ban", undefined);
  }

  unban(userId: string) {
    this.calls.push(["unban", userId]);
    return this.#answer("unban", undefined);
  }
}

/**
 * The accounts a test installs in place of Clerk's, with
 * `vi.mock(import("#/organization/accounts.ts"), …)` returning it from
 * `accountsFor`. The object and the test share one isolate, so the test reads
 * the calls the object made.
 */
export const fakeAccounts = new FakeAccounts();
