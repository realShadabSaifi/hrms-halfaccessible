import { describe, expect, it } from "vitest";
import {
  APP_NAME_MAX,
  LOGO_MAX_BYTES,
  logoExtension,
  validateAppName,
  validateLogoFile,
} from "./validate";

describe("branding validation", () => {
  it("requires a trimmed name of 1 to APP_NAME_MAX chars", () => {
    expect(validateAppName("")).toBe("name required");
    expect(validateAppName("   ")).toBe("name required");
    expect(validateAppName("x".repeat(APP_NAME_MAX + 1))).toBe("name too long");
    expect(validateAppName("  halfAccessible  ")).toBeNull();
  });

  it("accepts png jpeg webp svg under 1MB", () => {
    expect(validateLogoFile({ type: "image/png", size: 12 })).toBeNull();
    expect(validateLogoFile({ type: "image/gif", size: 12 })).toBe("unsupported file type");
    expect(validateLogoFile({ type: "image/png", size: 0 })).toBe("empty file");
    expect(validateLogoFile({ type: "image/png", size: LOGO_MAX_BYTES + 1 })).toBe(
      "file too large",
    );
  });

  it("maps mime types to extensions", () => {
    expect(logoExtension("image/jpeg")).toBe("jpg");
    expect(logoExtension("image/svg+xml")).toBe("svg");
    expect(logoExtension("image/gif")).toBeNull();
  });
});
