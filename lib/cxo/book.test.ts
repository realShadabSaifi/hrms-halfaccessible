import { describe, expect, it } from "vitest";
import { canBookCxo } from "./book";

describe("cxo booking", () => {
  it("requires an open slot", () => {
    expect(canBookCxo(0)).toBe(false);
    expect(canBookCxo(2)).toBe(true);
  });
});
