import type { Role } from "#/lib/access.ts";

// The organization the dev sign-in signs into, made-up data only: what a fresh
// clone's `pnpm dev` shows and what the browser suite drives
// (`tests/e2e/world.test-support.ts`). Each new area adds its rows here and to
// `seedDevOrganization` (`src/dev/seed.ts`).

export const devOrganizationName = "Comercio Prueba";

export const devRoles = ["admin", "staff"] as const satisfies readonly Role[];

export type DevRole = (typeof devRoles)[number];

/** One member per role, each holding that role alone. */
export const devPeople: Record<DevRole, { userId: string; name: string; email: string }> = {
  admin: { userId: "dev-admin", name: "Ana Prueba", email: "ana@prueba.example.com" },
  staff: { userId: "dev-staff", name: "Rita Prueba", email: "rita@prueba.example.com" },
};
