import { describe, expect, it } from "vitest";
import { sortAnnouncements } from "./pin";

describe("announcement pin sort", () => {
  it("keeps pinned first", () => {
    const sorted = sortAnnouncements([
      { pinned: false, created_at: "2026-08-12", title: "old" },
      { pinned: true, created_at: "2026-08-10", title: "pin" },
      { pinned: false, created_at: "2026-08-13", title: "new" },
    ]);
    expect(sorted.map((a) => a.title)).toEqual(["pin", "new", "old"]);
  });
});
