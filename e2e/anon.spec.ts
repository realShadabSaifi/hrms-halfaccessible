import { expect, test } from "@playwright/test";

test("anon board is public", async ({ page }) => {
  await page.goto("/anon");
  await expect(page.getByText(/no names/i)).toBeVisible();
});
