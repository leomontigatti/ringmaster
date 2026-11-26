import { expect, type Page, test } from "@playwright/test";

import { pickOption } from "./steps.test-support.ts";
import { people, roles, storageStateOf } from "./world.test-support.ts";

const sidebarLink = (page: Page, name: string) =>
  page.locator("[data-sidebar=menu-button]").and(page.getByRole("link", { name }));

// The app serves, each role is signed in and reaches the home page, and what
// only an admin may do stays out of everyone else's reach.

for (const role of roles) {
  test.describe(`as the ${role}`, () => {
    test.use({ storageState: storageStateOf(role) });

    test("opens on the home page", async ({ page, baseURL }) => {
      await page.goto("/");
      await expect(page).toHaveURL(`${baseURL}/`);
      await expect(sidebarLink(page, "Inicio")).toBeVisible();
      // The account menu at the end of the top bar names who is signed in.
      await expect(
        page.locator("header").getByRole("button", { name: people[role].name }),
      ).toBeVisible();
    });
  });
}

test.describe("as the admin", () => {
  test.use({ storageState: storageStateOf("admin") });

  test("reaches the staff", async ({ page }) => {
    await page.goto("/");
    await page.getByRole("link", { name: "Personal" }).click();
    await expect(page.getByRole("heading", { level: 1, name: "Personal" })).toBeVisible();
    await expect(page.getByRole("link", { name: people.staff.name })).toBeVisible();
  });
});

test.describe("as the staff", () => {
  test.use({ storageState: storageStateOf("staff") });

  test("sees no admin link", async ({ page }) => {
    await page.goto("/");
    await expect(sidebarLink(page, "Inicio")).toBeVisible();
    await expect(page.getByRole("link", { name: "Personal" })).toHaveCount(0);
  });
});

test.describe("signed out", () => {
  test("signs in on the page asked for", async ({ page }) => {
    await page.goto("/cambiar-contrasena");
    await expect(page).toHaveURL(/\/ingresar\?volver=/);
    await pickOption(page, "Miembro", new RegExp(`^${people.staff.name} \\(`));
    await page.getByRole("button", { name: "Ingresar" }).click();

    await expect(page).toHaveURL(/\/cambiar-contrasena$/);
  });

  test("signs in on this app's start when the page asked for is another site", async ({
    page,
    baseURL,
  }) => {
    // The URL parser drops the tab: `/\t/evil.example` would be https://evil.example/.
    await page.goto("/ingresar?volver=%2F%09%2Fevil.example");
    await pickOption(page, "Miembro", new RegExp(`^${people.staff.name} \\(`));
    await page.getByRole("button", { name: "Ingresar" }).click();

    await expect(page).toHaveURL(`${baseURL}/`);
  });
});
