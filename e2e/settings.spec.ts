import { expect, test } from "@playwright/test";

test("settings page is not public", async ({ page }) => {
  await page.goto("/settings");
  await expect(page).toHaveURL(/login/);
});
