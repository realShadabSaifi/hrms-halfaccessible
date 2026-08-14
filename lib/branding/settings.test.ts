import { afterEach, describe, expect, it } from "vitest";
import { DEFAULT_APP_NAME, logoPublicUrl, normalizeSettings } from "./settings";

describe("branding settings", () => {
  const prev = process.env.NEXT_PUBLIC_SUPABASE_URL;
  afterEach(() => {
    process.env.NEXT_PUBLIC_SUPABASE_URL = prev;
  });

  it("falls back to halfAccessible and no logo", () => {
    expect(normalizeSettings(null)).toEqual({
      app_name: DEFAULT_APP_NAME,
      logo_path: null,
      logo_url: null,
    });
    expect(normalizeSettings({ app_name: "  ", logo_path: null }).app_name).toBe(
      DEFAULT_APP_NAME,
    );
  });

  it("builds a public storage URL", () => {
    process.env.NEXT_PUBLIC_SUPABASE_URL = "http://127.0.0.1:54321/";
    expect(logoPublicUrl("logo-ab.png")).toBe(
      "http://127.0.0.1:54321/storage/v1/object/public/branding/logo-ab.png",
    );
    expect(normalizeSettings({ app_name: "Acme", logo_path: "logo-ab.png" })).toEqual({
      app_name: "Acme",
      logo_path: "logo-ab.png",
      logo_url: "http://127.0.0.1:54321/storage/v1/object/public/branding/logo-ab.png",
    });
  });
});
