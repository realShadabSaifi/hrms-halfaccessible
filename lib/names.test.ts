import { describe, expect, it } from "vitest";
import { firstName, initials, jobLine, plural, roleLabel } from "./names";

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

describe("jobLine", () => {
  it("joins only the parts that exist", () => {
    expect(jobLine("Designer", "Design")).toBe("Designer · Design");
    expect(jobLine("", "Engineering")).toBe("Engineering");
    expect(jobLine("CTO", "  ")).toBe("CTO");
    expect(jobLine(null, undefined)).toBe("");
  });
});

describe("plural", () => {
  it("picks singular for exactly one", () => {
    expect(plural(1, "slot")).toBe("1 slot");
    expect(plural(3, "slot")).toBe("3 slots");
    expect(plural(0, "person", "people")).toBe("0 people");
  });
});

describe("roleLabel", () => {
  it("turns role ids into readable names", () => {
    expect(roleLabel("super_admin")).toBe("super admin");
    expect(roleLabel("lead")).toBe("team lead");
    expect(roleLabel("cxo")).toBe("CXO");
  });
});
