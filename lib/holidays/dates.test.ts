import { describe, expect, it } from "vitest";
import { addUtcDay, datesInRange, overlappingHolidays } from "./dates";

describe("datesInRange", () => {
  it("walks inclusive UTC dates", () => {
    expect(addUtcDay("2026-08-31")).toBe("2026-09-01");
    expect(datesInRange("2026-08-14", "2026-08-16")).toEqual([
      "2026-08-14",
      "2026-08-15",
      "2026-08-16",
    ]);
  });
});

describe("overlappingHolidays", () => {
  it("returns holiday dates that sit inside the range", () => {
    expect(overlappingHolidays("2026-08-14", "2026-08-16", ["2026-08-15", "2026-10-02"])).toEqual([
      "2026-08-15",
    ]);
    expect(overlappingHolidays("2026-08-14", "2026-08-16", ["2026-10-02"])).toEqual([]);
  });
});
