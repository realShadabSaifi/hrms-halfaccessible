import { describe, expect, it } from "vitest";
import { resolveHoliday, votePercent } from "./resolve";

describe("burger resolve", () => {
  it("stays voting before the deadline", () => {
    expect(resolveHoliday({ yes: 9, no: 0, now: 1, closesAt: 10 })).toBe("voting");
  });

  it("approves on majority yes", () => {
    expect(resolveHoliday({ yes: 5, no: 2, now: 11, closesAt: 10 })).toBe("approved");
  });

  it("rejects otherwise", () => {
    expect(resolveHoliday({ yes: 2, no: 2, now: 11, closesAt: 10 })).toBe("rejected");
  });

  it("computes the yes bar", () => {
    expect(votePercent(7, 3)).toBe(70);
  });
});
