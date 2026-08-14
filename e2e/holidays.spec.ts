import { expect, test } from "@playwright/test";

test("holidays page is not public", async ({ page }) => {
  await page.goto("/holidays");
  await expect(page).toHaveURL(/login/);
});
