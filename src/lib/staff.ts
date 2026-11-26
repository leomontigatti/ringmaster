import * as z from "zod";

import { parseRoles, roleNames } from "#/lib/access.ts";
import type { Role } from "#/lib/access.ts";

const roleSchema = z.enum(roleNames);

/** At least one role, deduplicated and in the order `roleNames` (`access.ts`) declares them. */
const rolesSchema = z
  .array(roleSchema)
  .min(1)
  .transform((roles) => parseRoles(roles.join(",")));

export const roleLabels: Record<Role, string> = {
  admin: "Administrador",
  staff: "Empleado",
};

export function rolesLabel(roles: readonly Role[]): string {
  return roles.map((role) => roleLabels[role]).join(", ");
}

const memberId = z.string().min(1);

/**
 * A new staff member's fields, shared by the form and the organization's
 * object. The password's length is checked where the account is created
 * (`src/organization/staff.ts`), and Clerk checks the rest.
 */
export const staffInputSchema = z.object({
  name: z.string().trim().min(1).max(200),
  email: z.email().trim(),
  password: z.string(),
  roles: rolesSchema,
});

/** What changed on a member: their roles. */
export const memberUpdateSchema = z.object({ memberId, roles: rolesSchema });

export const memberActiveChangeSchema = z.object({ memberId, active: z.boolean() });

export const startingPasswordSchema = z.object({ memberId, password: z.string() });

export type StaffInput = z.input<typeof staffInputSchema>;
export type MemberUpdate = z.input<typeof memberUpdateSchema>;
export type MemberActiveChange = z.input<typeof memberActiveChangeSchema>;
export type StartingPasswordChange = z.input<typeof startingPasswordSchema>;
