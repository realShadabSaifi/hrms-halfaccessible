import { describe, expect, it } from "vitest";
import { firstName, initials } from "./names";

describe("firstName", () => {
  it("returns the first token", () => {
    expect(firstName("Zara Khan")).toBe("Zara");
    expect(firstName("  Priya  Nair ")).toBe("Priya");
    expect(firstName("   ")).toBe("");
  });
});

describe("initials", () => {
  it("still works", () => {
    expect(initials("Zara Khan")).toBe("ZK");
  });
});
