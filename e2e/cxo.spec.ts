import { expect, test } from "@playwright/test";

test("cxo manage page is not public", async ({ page }) => {
  await page.goto("/cxo/manage");
  await expect(page).toHaveURL(/login/);
});
