import { describe, expect, it } from "vitest";
import { isValidEmail } from "./email";

describe("email validation", () => {
  it("rejects empty", () => {
    expect(isValidEmail("")).toBe(false);
    expect(isValidEmail("   ")).toBe(false);
  });

  it("rejects invalid", () => {
    expect(isValidEmail("not-an-email")).toBe(false);
    expect(isValidEmail("a@b")).toBe(false);
  });

  it("accepts a normal address", () => {
    expect(isValidEmail("aarav@halfaccessible.com")).toBe(true);
  });
});
