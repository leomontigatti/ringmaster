import { devOrganizationName, devPeople, devRoles } from "#/dev/world.ts";
import type { DevRole } from "#/dev/world.ts";

// What the dev seed holds and the specs act on, made-up data only: the dev
// world (`src/dev/world.ts`). The specs know the organization through this file
// and the browser alone: none of them reads storage or calls the auth server.

export const roles = devRoles;
export type E2eRole = DevRole;

export const organizationName = devOrganizationName;

/** Each role's person, signed in once by `auth.setup.ts`. */
export const people = devPeople;

/** Where `auth.setup.ts` saves a role's signed-in browser state. */
export const storageStateOf = (role: E2eRole) => `tests/e2e/.auth/${role}.json`;
