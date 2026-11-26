import { describe, expect, it } from "vite-plus/test";

import { seedDevOrganization } from "#/dev/seed.ts";
import { devPeople } from "#/dev/world.ts";
import { freshOrganization } from "#/organization/organization.test-support.ts";

// The dev seed runs every step through the object's methods and throws on a
// refusal, so seeding a fresh object is the test that the data obeys the rules.

describe("seedDevOrganization", () => {
  it("sets the organization up with one member per role", async () => {
    const { organization, organizationId } = freshOrganization();
    await seedDevOrganization(organization, organizationId);

    const members = await organization.activeMembers();
    expect(members.map((member) => member.userId).sort()).toEqual(
      Object.values(devPeople)
        .map((person) => person.userId)
        .sort(),
    );
  });

  it("leaves an organization already set up as it is", async () => {
    const { organization, organizationId } = freshOrganization();
    await seedDevOrganization(organization, organizationId);
    await seedDevOrganization(organization, organizationId);

    expect(await organization.activeMembers()).toHaveLength(2);
  });
});
