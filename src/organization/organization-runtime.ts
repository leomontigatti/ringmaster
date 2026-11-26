import { DurableObject } from "cloudflare:workers";

import { accountsFor } from "#/organization/accounts.ts";
import type { Accounts } from "#/organization/accounts.ts";
import { migrateDatabase, openDatabase } from "#/organization/database.ts";
import type { Database } from "#/organization/database.ts";
import { authorize } from "#/organization/members.ts";
import type { Acting, Caller, Refusal, Requirement } from "#/organization/members.ts";
import type { EmailsInFlight } from "#/organization/staff.ts";

/**
 * What the organization's object runs on, under its RPC methods
 * (`organization.ts`): its SQLite storage, migrated before any call, and the
 * sign-in provider's accounts it mirrors its members to.
 */
export abstract class OrganizationRuntime extends DurableObject {
  protected readonly database: Database;
  /** The Clerk users staff sign in as (`src/organization/accounts.ts`). */
  protected readonly accounts: Accounts;
  /** The emails whose Clerk user a call is creating right now (`src/organization/staff.ts`). */
  protected readonly emailsInFlight: EmailsInFlight = new Set();

  constructor(ctx: DurableObjectState, env: Cloudflare.Env) {
    super(ctx, env);
    this.database = openDatabase(ctx.storage);
    this.accounts = accountsFor(env);
    void ctx.blockConcurrencyWhile(() => migrateDatabase(this.database));
  }

  /**
   * Authorizes `caller` against the member table for `requirement`, then runs
   * `work` as them: every RPC method that takes a caller goes through here.
   */
  protected async as<T>(
    caller: Caller,
    requirement: Requirement,
    work: (acting: Acting) => T,
  ): Promise<Awaited<T> | { ok: false; reason: Refusal }> {
    const authorized = authorize(this.database, caller, requirement);
    return authorized.ok ? await work(authorized.acting) : authorized;
  }
}
