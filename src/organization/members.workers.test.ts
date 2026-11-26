import { eq } from "drizzle-orm";
import { describe, expect, it } from "vite-plus/test";

import {
  addMember,
  adminCaller,
  auditEntriesFor,
  freshOrganization,
  inStorage,
  setUpTestOrganization,
} from "#/organization/organization.test-support.ts";
import { auditLog, member } from "#/organization/schema.ts";

describe("the organization object's members", () => {
  it("applies its migration on first start and serves the viewer from its tables", async () => {
    const { organizationId, organization } = await setUpTestOrganization();

    const result = await organization.viewer(adminCaller);

    expect(result).toEqual({
      ok: true,
      viewer: {
        userId: adminCaller.userId,
        organizationId,
        organizationName: "Comercio Prueba",
        name: "Ana Admin",
        email: "ana@example.com",
        roles: ["admin"],
        mustChangePassword: false,
      },
    });
  });

  it("sets an organization up once", async () => {
    const { organizationId, organization } = await setUpTestOrganization();

    const again = await organization.setUp({
      organizationId,
      name: "Otra",
      admin: { userId: "someone-else", name: "Otro", email: "otro@example.com" },
    });

    expect(again).toEqual({ ok: false, reason: "alreadySetUp" });
    expect(await organization.viewer({ userId: "someone-else" })).toEqual({
      ok: false,
      reason: "unauthenticated",
    });
  });

  it("refuses a user who is not one of its members", async () => {
    const { organization } = await setUpTestOrganization();

    expect(await organization.viewer({ userId: "stranger" })).toEqual({
      ok: false,
      reason: "unauthenticated",
    });
  });

  it("refuses a member it marks inactive, on their next call", async () => {
    const { organization } = await setUpTestOrganization();
    const staff = await addMember(organization, ["staff"]);
    expect((await organization.viewer(staff)).ok).toBe(true);

    await inStorage(organization, (database) =>
      database.update(member).set({ active: false }).where(eq(member.userId, staff.userId)).run(),
    );

    expect(await organization.viewer(staff)).toEqual({
      ok: false,
      reason: "unauthenticated",
    });
  });

  it("refuses a call that needs a role the member lacks, from its own table", async () => {
    const { organization } = await setUpTestOrganization();
    const staff = await addMember(organization, ["staff"]);

    const result = await organization.addMember(staff, {
      userId: "new-user",
      name: "Nuevo",
      email: "nuevo@example.com",
      roles: ["admin"],
    });

    expect(result).toEqual({ ok: false, reason: "forbidden" });
  });

  it("takes a role change on the next call", async () => {
    const { organization } = await setUpTestOrganization();
    const promoted = await addMember(organization, ["staff"]);

    await inStorage(organization, (database) =>
      database
        .update(member)
        .set({ roles: ["admin"] })
        .where(eq(member.userId, promoted.userId))
        .run(),
    );

    const result = await organization.addMember(promoted, {
      userId: "new-user",
      name: "Nuevo",
      email: "nuevo@example.com",
      roles: ["staff"],
    });
    expect(result).toEqual({ ok: true });
  });

  it("refuses every call before it is set up", async () => {
    const { organization } = freshOrganization();

    expect(await organization.viewer(adminCaller)).toEqual({
      ok: false,
      reason: "unauthenticated",
    });
  });

  it("refuses a second member with the same email, whatever its case", async () => {
    const { organization } = await setUpTestOrganization();

    const result = await organization.addMember(adminCaller, {
      userId: "other-user",
      name: "Otra Ana",
      email: "ANA@example.com",
      roles: ["staff"],
    });

    expect(result).toEqual({ ok: false, reason: "memberExists" });
  });
});

describe("the audit log", () => {
  it("records who added a member, in the same change", async () => {
    const { organization } = await setUpTestOrganization();
    const added = await addMember(organization, ["staff"]);

    const entries = await inStorage(organization, (database) =>
      database.select().from(auditLog).where(eq(auditLog.entityId, added.userId)).all(),
    );

    expect(entries).toMatchObject([
      { userId: adminCaller.userId, action: "create", entityType: "member", before: null },
    ]);
  });

  it("keeps no entry of a change that is refused", async () => {
    const { organization } = await setUpTestOrganization();
    await organization.updateMember(adminCaller, {
      memberId: adminCaller.userId,
      roles: ["admin", "staff"],
    });
    const before = await auditEntriesFor(organization, adminCaller.userId);

    // New roles would write an entry; losing the last admin refuses them.
    const refused = await organization.updateMember(adminCaller, {
      memberId: adminCaller.userId,
      roles: ["staff"],
    });

    expect(refused).toEqual({ ok: false, reason: "lastAdmin" });
    expect(await auditEntriesFor(organization, adminCaller.userId)).toEqual(before);
  });
});
