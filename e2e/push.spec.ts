import { expect, test } from "@playwright/test";

test("service worker is public javascript", async ({ request }) => {
  const res = await request.get("/sw.js");
  expect(res.status()).toBe(200);
  expect(res.headers()["content-type"] ?? "").toMatch(/javascript|ecmascript/);
  const body = await res.text();
  expect(body).toContain("showNotification");
  expect(body).not.toMatch(/<html/i);
});

test("web manifest is public", async ({ request }) => {
  const res = await request.get("/manifest.webmanifest");
  expect(res.status()).toBe(200);
  const body = await res.text();
  expect(body).toContain("start_url");
  expect(body).not.toMatch(/<html/i);
});
