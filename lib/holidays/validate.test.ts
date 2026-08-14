import { describe, expect, it } from "vitest";
import {
  HOLIDAY_TITLE_MAX,
  holidayDateTaken,
  validateHolidayDate,
  validateHolidayTitle,
} from "./validate";

describe("holiday date", () => {
  it("requires a real YYYY-MM-DD date", () => {
    expect(validateHolidayDate("")).toBe("date required");
    expect(validateHolidayDate("2026-13-01")).toBe("invalid date");
    expect(validateHolidayDate("2026-02-31")).toBe("invalid date");
    expect(validateHolidayDate("2026-08-15")).toBeNull();
  });
});

describe("holiday title", () => {
  it("requires a trimmed title of at most HOLIDAY_TITLE_MAX chars", () => {
    expect(validateHolidayTitle("  ")).toBe("name required");
    expect(validateHolidayTitle("x".repeat(HOLIDAY_TITLE_MAX + 1))).toBe("name too long");
    expect(validateHolidayTitle("  Diwali  ")).toBeNull();
  });
});

describe("holiday taken", () => {
  it("treats the same ISO date as taken", () => {
    expect(holidayDateTaken("2026-08-15", ["2026-08-15", "2026-10-02"])).toBe(true);
    expect(holidayDateTaken("2026-08-16", ["2026-08-15"])).toBe(false);
  });
});
