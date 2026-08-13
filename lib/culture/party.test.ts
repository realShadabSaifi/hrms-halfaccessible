import { describe, expect, it } from "vitest";
import { validateParty } from "./party";

describe("party request", () => {
  it("needs an occasion", () => {
    expect(validateParty("")).toBe("a party needs an occasion (any excuse counts)");
    expect(validateParty("we survived the migration")).toBeNull();
  });
});
