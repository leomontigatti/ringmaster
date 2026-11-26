import type { Organization } from "#/organization/organization.ts";

import { accepted } from "#/dev/accepted.ts";
import { devOrganizationName, devPeople } from "#/dev/world.ts";

/**
 * Fills a new dev organization's object with `src/dev/world.ts`, through the
 * object's own methods, so the seed obeys the rules a screen does. An object
 * already set up is left as it is: two first page loads at once seed it once.
 */
export async function seedDevOrganization(
  organization: DurableObjectStub<Organization>,
  organizationId: string,
): Promise<void> {
  const setUp = await organization.setUp({
    organizationId,
    name: devOrganizationName,
    admin: devPeople.admin,
  });
  if (!setUp.ok) {
    if (setUp.reason === "alreadySetUp") {
      return;
    }
    throw new Error(`dev seed: setUp refused (${setUp.reason})`);
  }
  const admin = { userId: devPeople.admin.userId };
  accepted(
    "addMember staff",
    await organization.addMember(admin, { ...devPeople.staff, roles: ["staff"] }),
  );
}
