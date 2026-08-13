import { expect, test } from "@playwright/test";

test("login asks for email then authenticator copy", async ({ page }) => {
  await page.goto("/login");
  await expect(page.getByRole("heading", { name: /the portal/i })).toBeVisible();
  await expect(page.getByLabel(/email/i)).toBeVisible();
  await expect(page.getByRole("button", { name: "continue" })).toBeVisible();
});
