import type { Page } from "@playwright/test";

// Browser steps more than one spec takes. Locators go by role and accessible
// name.

/**
 * Picks `option` in a select (shadcn's `Select`, whose list opens in a popup
 * outside the box), found by its label.
 */
export async function pickOption(page: Page, label: string, option: string | RegExp) {
  await page.getByRole("combobox", { name: label }).click();
  await page.getByRole("option", { name: option }).click();
}
