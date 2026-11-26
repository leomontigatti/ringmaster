import { sql } from "drizzle-orm";
import { check, index, sqliteTable, text, uniqueIndex } from "drizzle-orm/sqlite-core";

import type { Role } from "#/lib/access.ts";

import { flag, id, timestamps } from "#/organization/schema-columns.ts";

// The organization object's SQLite schema (ADR-0008). Everything in it belongs
// to the one organization the object is, so no table carries an organization
// id: the object is the tenant boundary. Instants are integers, Unix
// milliseconds UTC.
//
// After editing it, run `pnpm organization:generate`, which adds a migration;
// a migration on `main` has run in deployed objects and is never edited.

/** The organization itself: one row, written by the setup. */
export const organization = sqliteTable("organization", {
  id: text("id").primaryKey(),
  name: text("name").notNull(),
  createdAt: timestamps.createdAt,
});

/**
 * A member of the organization's staff (ui: "Personal"), keyed by the sign-in
 * provider's user id. The object authorizes every call from this row, never
 * from the roles a session token claims.
 */
export const member = sqliteTable(
  "member",
  {
    userId: text("user_id").primaryKey(),
    name: text("name").notNull(),
    email: text("email").notNull(),
    roles: text("roles", { mode: "json" }).$type<Role[]>().notNull(),
    active: flag("active").notNull().default(true),
    // Held on the change-password screen until they replace the starting
    // password; mirrored to the Clerk user's public metadata.
    mustChangePassword: flag("must_change_password").notNull().default(false),
    ...timestamps,
  },
  (table) => [
    uniqueIndex("member_email_unique").on(sql`lower(${table.email})`),
    // SQLite allows no subquery in a check, so the role names themselves are
    // the object's to validate (`insertMember`).
    check("member_roles_check", sql`json_array_length(${table.roles}) >= 1`),
  ],
);

/**
 * The append-only audit log: one row per change, written in the change's
 * transaction by `recordAudit` (`src/organization/audit.ts`). No code path
 * updates or deletes a row (ADR-0008).
 */
export const auditLog = sqliteTable(
  "audit_log",
  {
    id: id(),
    // The acting user's id. No key: an entry outlives anything it names.
    userId: text("user_id").notNull(),
    action: text("action").notNull(),
    entityType: text("entity_type").notNull(),
    entityId: text("entity_id").notNull(),
    // The changed fields only: their values before and after the change.
    before: text("before", { mode: "json" }).$type<
      Record<string, string | number | boolean | null>
    >(),
    after: text("after", { mode: "json" }).$type<
      Record<string, string | number | boolean | null>
    >(),
    createdAt: timestamps.createdAt,
  },
  (table) => [index("audit_log_entity_idx").on(table.entityType, table.entityId, table.createdAt)],
);
