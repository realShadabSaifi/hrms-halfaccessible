import { describe, expect, it } from "vitest";
import { cxoNameFromRoster, validateCxoPersonId } from "./person";

const roster = [
  { id: "c1", full_name: "  Nikhil Verma  ", role: "cxo" },
  { id: "a1", full_name: "Ada Admin", role: "admin" },
];

describe("cxo person", () => {
  it("requires a cxo from the roster", () => {
    expect(validateCxoPersonId("", roster)).toBe("cxo required");
    expect(validateCxoPersonId("a1", roster)).toBe("cxo required");
    expect(validateCxoPersonId("missing", roster)).toBe("cxo required");
    expect(validateCxoPersonId("c1", roster)).toBeNull();
  });

  it("uses the roster full name", () => {
    expect(cxoNameFromRoster("", roster)).toBeNull();
    expect(cxoNameFromRoster("a1", roster)).toBeNull();
    expect(cxoNameFromRoster("c1", roster)).toBe("Nikhil Verma");
  });
});
