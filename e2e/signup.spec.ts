import { expect, test } from "@playwright/test";

test("signup starts with email then QR copy", async ({ page }) => {
  await page.goto("/signup");
  await expect(page.getByRole("heading", { name: /authenticator/i })).toBeVisible();
  await expect(page.getByRole("button", { name: "show my QR" })).toBeVisible();
});
