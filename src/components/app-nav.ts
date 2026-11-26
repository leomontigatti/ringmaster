import type { LinkProps } from "@tanstack/react-router";
import { HouseIcon, PackageIcon, UserCogIcon, UsersIcon } from "lucide-react";
import type { LucideIcon } from "lucide-react";

import type { Role } from "#/lib/access.ts";

// What the sidebar shows, apart from how: its groups, and who sees each link.
// It only spares a member a link to a screen that has nothing for them: each
// screen's own server functions decide what they may do there. A new area
// (such as Clientes or Productos) is one more link, or a folder of its pages.

export const passwordChangePath = "/cambiar-contrasena";

type Path = NonNullable<LinkProps["to"]>;

interface NavLink {
  label: string;
  to: Path;
  icon: LucideIcon;
  adminOnly?: boolean;
}

/** A link that only opens its entries, each a page of its own. */
interface NavFolder {
  label: string;
  icon: LucideIcon;
  adminOnly?: boolean;
  entries: { label: string; to: Path }[];
}

const groups: { label: string; items: (NavLink | NavFolder)[] }[] = [
  {
    label: "General",
    items: [
      { label: "Inicio", to: "/", icon: HouseIcon },
      { label: "Clientes", to: "/clientes", icon: UsersIcon },
      { label: "Productos", to: "/productos", icon: PackageIcon },
    ],
  },
  {
    label: "Administración",
    items: [{ label: "Personal", to: "/personal", icon: UserCogIcon, adminOnly: true }],
  },
];

/** The groups and links `roles` see; a group left with no link is dropped. */
export function navFor(roles: readonly Role[]) {
  const isAdmin = roles.includes("admin");
  return groups
    .map((group) => ({
      label: group.label,
      items: group.items.filter((item) => isAdmin || !item.adminOnly),
    }))
    .filter((group) => group.items.length > 0);
}

/** Whether `pathname` is the link's page or one under it. */
export function isCurrentPath(pathname: string, to: string) {
  return pathname === to || pathname.startsWith(`${to}/`);
}

/** Whether `folder` stands open on `pathname`: the page is one of its entries, or under one. */
export function isOpenOn(pathname: string, folder: Pick<NavFolder, "entries">) {
  return folder.entries.some((entry) => isCurrentPath(pathname, entry.to));
}

/** A step of the breadcrumbs: a label, and the page it opens unless it is a folder. */
export interface SectionCrumb {
  label: string;
  to?: Path;
}

/** The pages the top bar opens rather than the menu: the account menu's. */
const outsideTheMenu = [
  { label: "Cambiar contraseña", to: passwordChangePath },
] satisfies SectionCrumb[];

/** The steps to `pathname` through `item`: its link, or its folder and the folder's entry. */
function stepsTo(pathname: string, item: NavLink | NavFolder): SectionCrumb[] | null {
  if ("to" in item) {
    return isCurrentPath(pathname, item.to) ? [{ label: item.label, to: item.to }] : null;
  }
  const entry = item.entries.find((one) => isCurrentPath(pathname, one.to));
  return entry ? [{ label: item.label }, { label: entry.label, to: entry.to }] : null;
}

/**
 * The section `pathname` sits in, as the sidebar names it: its group, which is
 * no page, then its link, or its folder and the folder's entry. Empty outside
 * every section.
 */
export function sectionOf(pathname: string): SectionCrumb[] {
  const outside = outsideTheMenu.find((page) => isCurrentPath(pathname, page.to));
  if (outside) {
    return [outside];
  }
  for (const group of groups) {
    for (const item of group.items) {
      const steps = stepsTo(pathname, item);
      if (steps) {
        return [{ label: group.label }, ...steps];
      }
    }
  }
  return [];
}
