import { describe, expect, it } from "vite-plus/test";

import { isCurrentPath, isOpenOn, navFor, sectionOf } from "#/components/app-nav.ts";

describe("the menu a member sees", () => {
  it("leaves the admin's screens out for anyone else", () => {
    const labels = navFor(["staff"]).flatMap((group) => group.items.map((item) => item.label));

    expect(labels).toEqual(["Inicio"]);
  });

  it("keeps them for a member who is an admin among other roles", () => {
    const administration = navFor(["staff", "admin"]).at(-1)!;

    expect(administration.items.map((item) => item.label)).toContain("Personal");
  });
});

describe("the breadcrumbs' section", () => {
  it("names a page outside the menu by its own label", () => {
    expect(sectionOf("/cambiar-contrasena")).toEqual([
      { label: "Cambiar contraseña", to: "/cambiar-contrasena" },
    ]);
  });

  it("names a link's page under its group, which is no page", () => {
    expect(sectionOf("/personal/1")).toEqual([
      { label: "Administración" },
      { label: "Personal", to: "/personal" },
    ]);
  });
});

describe("a folder", () => {
  const folder: Parameters<typeof isOpenOn>[1] = {
    entries: [
      { label: "Nueva persona", to: "/personal/nueva" },
      { label: "Cambiar contraseña", to: "/cambiar-contrasena" },
    ],
  };

  it("opens on one of its pages and the pages under them, closed elsewhere", () => {
    expect(isOpenOn("/personal/nueva", folder)).toBe(true);
    expect(isOpenOn("/cambiar-contrasena", folder)).toBe(true);
    expect(isOpenOn("/personal", folder)).toBe(false);
  });
});

describe("the current link", () => {
  it("holds for its page and the pages under it, not for a longer name", () => {
    expect(isCurrentPath("/personal", "/personal")).toBe(true);
    expect(isCurrentPath("/personal/1", "/personal")).toBe(true);
    expect(isCurrentPath("/personal-viejo", "/personal")).toBe(false);
  });

  it("holds for the home page only on itself", () => {
    expect(isCurrentPath("/", "/")).toBe(true);
    expect(isCurrentPath("/personal", "/")).toBe(false);
  });
});
