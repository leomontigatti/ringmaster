import type {
  MemberActiveChange,
  MemberUpdate,
  StaffInput,
  StartingPasswordChange,
} from "#/lib/staff.ts";

import {
  insertMember,
  listActiveMembers,
  setUpOrganization,
  viewerOf,
} from "#/organization/members.ts";
import type { Caller, MemberInput } from "#/organization/members.ts";
import { OrganizationRuntime } from "#/organization/organization-runtime.ts";
import {
  changeOwnPassword,
  createStaffMember,
  getStaffMember,
  listStaff,
  setMemberActive,
  setStartingPassword,
  setUpWithAccount,
  updateMember,
} from "#/organization/staff.ts";

/**
 * One organization's data, in its own SQLite-backed Durable Object (ADR-0008):
 * the tenant boundary. The Worker reaches it only through the organization id
 * of a verified session (`src/server/caller.ts`), so nothing here can read or
 * write another organization's rows.
 *
 * One RPC method per operation the app performs. Each takes the caller and
 * the input, authorizes the caller against the member table, and returns a
 * result: a refusal is `{ ok: false, reason }`, never a throw. The logic lives
 * in one module per area beside this file; a method only names its
 * requirement and calls it. The object runs one event at a time, and a
 * module's checks and writes are synchronous, so a check holds until its write.
 */
export class Organization extends OrganizationRuntime {
  // Setup and sign-in: called by the Worker before any member is signed in,
  // never with input from the browser (`src/server/organization-setup.ts`,
  // `src/server/sign-in.functions.ts`).

  setUp(input: { organizationId: string; name: string; admin: Omit<MemberInput, "roles"> }) {
    return setUpOrganization(this.database, input);
  }

  /** Sets the organization up with its first admin's Clerk user: the setup script's call. */
  setUpWithAccount(input: Parameters<typeof setUpWithAccount>[3]) {
    return setUpWithAccount(this.database, this.accounts, this.emailsInFlight, input);
  }

  activeMembers() {
    return listActiveMembers(this.database);
  }

  // Members

  viewer(caller: Caller) {
    return this.as(caller, "signedIn", (acting) => ({
      ok: true as const,
      viewer: viewerOf(this.database, acting),
    }));
  }

  addMember(caller: Caller, input: MemberInput) {
    return this.as(caller, ["admin"], (acting) =>
      this.database.transaction((tx) => insertMember(tx, acting.userId, input)),
    );
  }

  // Staff

  listStaff(caller: Caller) {
    return this.as(caller, ["admin"], () => listStaff(this.database));
  }

  getStaffMember(caller: Caller, input: { memberId: string }) {
    return this.as(caller, ["admin"], () => getStaffMember(this.database, input));
  }

  async createStaffMember(caller: Caller, input: StaffInput) {
    return this.as(caller, ["admin"], (acting) =>
      createStaffMember(this.database, this.accounts, this.emailsInFlight, acting, input),
    );
  }

  async updateMember(caller: Caller, input: MemberUpdate) {
    return this.as(caller, ["admin"], (acting) =>
      updateMember(this.database, this.accounts, acting, input),
    );
  }

  async setMemberActive(caller: Caller, input: MemberActiveChange) {
    return this.as(caller, ["admin"], (acting) =>
      setMemberActive(this.database, this.accounts, acting, input),
    );
  }

  async setStartingPassword(caller: Caller, input: StartingPasswordChange) {
    return this.as(caller, ["admin"], () =>
      setStartingPassword(this.database, this.accounts, input),
    );
  }

  async changePassword(caller: Caller, input: { currentPassword: string; newPassword: string }) {
    return this.as(caller, "signedIn", (acting) =>
      changeOwnPassword(this.database, this.accounts, acting, input),
    );
  }
}
