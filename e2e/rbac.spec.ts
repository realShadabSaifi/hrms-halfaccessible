import { expect, test } from "@playwright/test";

test("users page is not public", async ({ page }) => {
  await page.goto("/users");
  await expect(page).toHaveURL(/login/);
});

test("home is not public", async ({ page }) => {
  await page.goto("/");
  await expect(page).toHaveURL(/login/);
});
