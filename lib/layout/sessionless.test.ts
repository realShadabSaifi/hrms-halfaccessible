import { describe, expect, it } from "vitest";
import { isSessionlessPath } from "./sessionless";

describe("isSessionlessPath", () => {
  it("lets the service worker and pwa assets skip auth", () => {
    expect(isSessionlessPath("/sw.js")).toBe(true);
    expect(isSessionlessPath("/manifest.webmanifest")).toBe(true);
    expect(isSessionlessPath("/pwa/192")).toBe(true);
    expect(isSessionlessPath("/pwa/512")).toBe(true);
    expect(isSessionlessPath("/chat")).toBe(false);
    expect(isSessionlessPath("/sw")).toBe(false);
  });
});
