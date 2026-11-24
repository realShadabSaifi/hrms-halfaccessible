import { describe, expect, it } from "vitest";
import { csvCell, isMonth, monthBounds, monthLabel, shiftMonth, toCsv } from "./expenses";

describe("months", () => {
  it("computes bounds across year ends", () => {
    expect(monthBounds("2026-11")).toEqual({ from: "2026-11-01", to: "2026-12-01" });
    expect(monthBounds("2026-12")).toEqual({ from: "2026-12-01", to: "2027-01-01" });
  });
  it("validates and shifts", () => {
    expect(isMonth("2026-11")).toBe(true);
    expect(isMonth("2026-13")).toBe(false);
    expect(isMonth("26-11")).toBe(false);
    expect(isMonth(undefined)).toBe(false);
    expect(shiftMonth("2026-01", -1)).toBe("2025-12");
    expect(shiftMonth("2026-11", 2)).toBe("2027-01");
    expect(shiftMonth("2026-11", -5)).toBe("2026-06");
    expect(monthLabel("2026-11")).toBe("November 2026");
  });
});

describe("csv", () => {
  it("quotes and defuses formulas", () => {
    expect(csvCell("plain")).toBe("plain");
    expect(csvCell('say "hi", ok')).toBe('"say ""hi"", ok"');
    expect(csvCell("=HYPERLINK(1)")).toBe("'=HYPERLINK(1)");
    expect(csvCell(-12.5)).toBe("-12.5");
    expect(toCsv([["a", 1], ["b,c", 2]])).toBe('a,1\r\n"b,c",2\r\n');
  });
});
