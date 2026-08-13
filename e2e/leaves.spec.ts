import { expect, test } from "@playwright/test";

test("leave route is protected", async ({ page }) => {
  await page.goto("/leaves");
  await expect(page).toHaveURL(/login/);
});
