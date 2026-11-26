/** The roles a member holds, in any combination (GLOSSARY.md). */
export const roleNames = ["admin", "staff"] as const;

export type Role = (typeof roleNames)[number];

export function parseRoles(value: string): Role[] {
  const names = value.split(",").map((name) => name.trim());
  return roleNames.filter((role) => names.includes(role));
}
