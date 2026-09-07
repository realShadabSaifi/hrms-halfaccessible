import { expect, test } from "@playwright/test";

test("chat route is protected", async ({ page }) => {
  await page.goto("/chat");
  await expect(page).toHaveURL(/login/);
});

test("chat thread route is protected", async ({ page }) => {
  await page.goto("/chat/00000000-0000-0000-0000-000000000000");
  await expect(page).toHaveURL(/login/);
});
