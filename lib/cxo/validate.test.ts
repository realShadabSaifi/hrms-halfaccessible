import { describe, expect, it } from "vitest";
import {
  CXO_NAME_MAX,
  CXO_NOTE_MAX,
  CXO_TAGLINE_MAX,
  CXO_TITLE_MAX,
  formatCxoWindowLabel,
  nextSlotsRemaining,
  validateCxoColor,
  validateCxoDate,
  validateCxoName,
  validateCxoNote,
  validateCxoSlotCount,
  validateCxoTagline,
  validateCxoTitle,
  validateCxoWindow,
} from "./validate";

describe("cxo name", () => {
  it("requires a trimmed name of at most CXO_NAME_MAX chars", () => {
    expect(validateCxoName("  ")).toBe("name required");
    expect(validateCxoName("x".repeat(CXO_NAME_MAX + 1))).toBe("name too long");
    expect(validateCxoName("  Nikhil Verma  ")).toBeNull();
  });
});

describe("cxo title", () => {
  it("requires a trimmed title of at most CXO_TITLE_MAX chars", () => {
    expect(validateCxoTitle("  ")).toBe("title required");
    expect(validateCxoTitle("x".repeat(CXO_TITLE_MAX + 1))).toBe("title too long");
    expect(validateCxoTitle("CEO")).toBeNull();
  });
});

describe("cxo tagline", () => {
  it("requires a trimmed tagline of at most CXO_TAGLINE_MAX chars", () => {
    expect(validateCxoTagline("  ")).toBe("tagline required");
    expect(validateCxoTagline("x".repeat(CXO_TAGLINE_MAX + 1))).toBe("tagline too long");
    expect(validateCxoTagline("asks why a lot")).toBeNull();
  });
});

describe("cxo date", () => {
  it("requires a real YYYY-MM-DD date", () => {
    expect(validateCxoDate("")).toBe("date required");
    expect(validateCxoDate("2026-13-01")).toBe("invalid date");
    expect(validateCxoDate("2026-02-31")).toBe("invalid date");
    expect(validateCxoDate("2026-08-21")).toBeNull();
  });
});

describe("cxo note", () => {
  it("allows empty and rejects over CXO_NOTE_MAX", () => {
    expect(validateCxoNote("")).toBeNull();
    expect(validateCxoNote("   ")).toBeNull();
    expect(validateCxoNote("x".repeat(CXO_NOTE_MAX + 1))).toBe("note too long");
    expect(validateCxoNote("after all-hands")).toBeNull();
  });
});

describe("cxo slots", () => {
  it("requires an integer from 1 to 20", () => {
    expect(validateCxoSlotCount(0)).toBe("slots must be 1-20");
    expect(validateCxoSlotCount(21)).toBe("slots must be 1-20");
    expect(validateCxoSlotCount(1.5)).toBe("slots must be 1-20");
    expect(validateCxoSlotCount("1.5")).toBe("slots must be 1-20");
    expect(validateCxoSlotCount(1)).toBeNull();
    expect(validateCxoSlotCount(20)).toBeNull();
    expect(validateCxoSlotCount("3")).toBeNull();
  });
});

describe("cxo color", () => {
  it("requires a portal swatch", () => {
    expect(validateCxoColor("#1C1C2E")).toBe("invalid color");
    expect(validateCxoColor("#7048B6")).toBeNull();
  });
});

describe("cxo window label", () => {
  it("formats UTC month and day, with an optional note", () => {
    expect(formatCxoWindowLabel("2026-08-21", "")).toBe("Aug 21");
    expect(formatCxoWindowLabel("2026-08-21", "  after all-hands  ")).toBe("Aug 21 · after all-hands");
  });
});

describe("cxo slot math", () => {
  it("adds to remaining without a cap", () => {
    expect(nextSlotsRemaining(2, 3)).toBe(5);
  });
});

describe("cxo window", () => {
  it("returns the first field error", () => {
    expect(
      validateCxoWindow({
        name: "",
        title: "CEO",
        tagline: "why",
        date: "2026-08-21",
        note: "",
        slots: 1,
        color: "#7048B6",
      }),
    ).toBe("name required");
    expect(
      validateCxoWindow({
        name: "Nikhil",
        title: "CEO",
        tagline: "why",
        date: "2026-08-21",
        note: "",
        slots: 1,
        color: "#7048B6",
      }),
    ).toBeNull();
  });
});
