import { describe, expect, it } from "vitest";
import { monthCells, WEEKDAYS } from "./calendar";

describe("monthCells", () => {
  it("builds a monday-first 42-cell grid", () => {
    expect(WEEKDAYS).toEqual(["mon", "tue", "wed", "thu", "fri", "sat", "sun"]);
    const cells = monthCells(2026, 8);
    expect(cells).toHaveLength(42);
    expect(cells[0]).toEqual({ iso: "2026-07-27", inMonth: false });
    expect(cells[5]).toEqual({ iso: "2026-08-01", inMonth: true });
    expect(cells.filter((c) => c.inMonth)).toHaveLength(31);
    expect(cells[41].iso).toBe("2026-09-06");
  });
});
