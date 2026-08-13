import { describe, expect, it } from "vitest";
import { computeDashboardStats, firstName } from "./stats";

describe("dashboard stats", () => {
  it("aggregates the three home numbers", () => {
    const cards = computeDashboardStats({
      pendingLeaves: 1,
      upcomingHolidays: 2,
      unreadAnnouncements: 3,
    });
    expect(cards.map((c) => c.value)).toEqual(["1", "2", "3"]);
  });

  it("uses the first name", () => {
    expect(firstName("Aarav Mehta")).toBe("Aarav");
    expect(firstName("")).toBe("there");
  });
});
