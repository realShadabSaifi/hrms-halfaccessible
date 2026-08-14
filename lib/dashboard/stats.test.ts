import { describe, expect, it } from "vitest";
import { computeDashboardStats, firstName, pickNextHoliday } from "./stats";

describe("dashboard stats", () => {
  it("aggregates the three home numbers", () => {
    const cards = computeDashboardStats({
      pendingLeaves: 1,
      nextHoliday: { holiday_on: "2026-10-02", title: "Gandhi Jayanti" },
      unreadAnnouncements: 3,
    });
    expect(cards.map((c) => c.value)).toEqual(["1", "Oct 2", "3"]);
    expect(cards[1].sub).toBe("Gandhi Jayanti");
  });

  it("uses the first name", () => {
    expect(firstName("Aarav Mehta")).toBe("Aarav");
    expect(firstName("")).toBe("there");
  });

  it("uses v2 canvas labels", () => {
    const cards = computeDashboardStats({
      pendingLeaves: 0,
      nextHoliday: null,
      unreadAnnouncements: 0,
    });
    expect(cards.map((c) => c.label)).toEqual([
      "pending leaves",
      "next holiday",
      "unread announcements",
    ]);
    expect(cards[0].sub).toBe("all clear. go touch grass.");
    expect(cards[1].value).toBe("—");
    expect(cards[1].sub).toBe("none on the calendar");
    expect(cards[2].sub).toBe("you're all caught up 😌");
  });

  it("picks the soonest company holiday on or after today", () => {
    expect(
      pickNextHoliday(
        [
          { holiday_on: "2026-01-26", title: "Republic Day" },
          { holiday_on: "2026-08-15", title: "Independence Day" },
          { holiday_on: "2026-10-02", title: "Gandhi Jayanti" },
        ],
        "2026-08-14",
      ),
    ).toEqual({ holiday_on: "2026-08-15", title: "Independence Day" });
    expect(pickNextHoliday([{ holiday_on: "2026-01-26", title: "Republic Day" }], "2026-08-14")).toBeNull();
  });
});
