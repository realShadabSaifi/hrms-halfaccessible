import { describe, expect, it } from "vitest";
import { AVATAR_SWATCHES } from "@/lib/profiles/details";
import {
  CXO_NAME_MAX,
  CXO_TITLE_MAX,
  cxoColorFromProfile,
  cxoSlotStarts,
  cxoTitleFromDesignation,
  formatCxoSlotLabel,
  validateCxoName,
  validateCxoSlotCount,
  validateCxoStart,
  validateCxoWindow,
} from "./validate";

describe("cxo name", () => {
  it("requires a trimmed name of at most CXO_NAME_MAX chars", () => {
    expect(validateCxoName("  ")).toBe("name required");
    expect(validateCxoName("x".repeat(CXO_NAME_MAX + 1))).toBe("name too long");
    expect(validateCxoName("  Nikhil Verma  ")).toBeNull();
  });
});

describe("cxo start", () => {
  it("requires a real datetime on a 15-min mark", () => {
    expect(validateCxoStart("")).toBe("start required");
    expect(validateCxoStart("2026-13-01T16:00")).toBe("invalid start");
    expect(validateCxoStart("2026-02-31T16:00")).toBe("invalid start");
    expect(validateCxoStart("2026-08-21T16:07")).toBe("start must be on a 15-min mark");
    expect(validateCxoStart("2026-08-21T16:00")).toBeNull();
    expect(validateCxoStart("2026-08-21T16:15")).toBeNull();
  });
});

describe("cxo slots", () => {
  it("requires an integer from 1 to 20", () => {
    expect(validateCxoSlotCount(0)).toBe("slots must be 1-20");
    expect(validateCxoSlotCount(21)).toBe("slots must be 1-20");
    expect(validateCxoSlotCount(1.5)).toBe("slots must be 1-20");
    expect(validateCxoSlotCount(1)).toBeNull();
    expect(validateCxoSlotCount(20)).toBeNull();
  });
});

describe("cxo slot label", () => {
  it("formats wall-clock date and 12-hour time", () => {
    expect(formatCxoSlotLabel("2026-08-21T16:00")).toBe("Aug 21 · 4:00pm");
    expect(formatCxoSlotLabel("2026-08-21T00:00")).toBe("Aug 21 · 12:00am");
    expect(formatCxoSlotLabel("2026-08-21T12:15")).toBe("Aug 21 · 12:15pm");
  });
});

describe("cxo slot starts", () => {
  it("emits one label every 15 minutes", () => {
    expect(cxoSlotStarts("2026-08-21T16:00", 4)).toEqual([
      "Aug 21 · 4:00pm",
      "Aug 21 · 4:15pm",
      "Aug 21 · 4:30pm",
      "Aug 21 · 4:45pm",
    ]);
    expect(cxoSlotStarts("2026-08-21T23:45", 2)).toEqual([
      "Aug 21 · 11:45pm",
      "Aug 22 · 12:00am",
    ]);
  });
});

describe("cxo title from designation", () => {
  it("falls back to cxo and slices to CXO_TITLE_MAX", () => {
    expect(cxoTitleFromDesignation("")).toBe("cxo");
    expect(cxoTitleFromDesignation("  ")).toBe("cxo");
    expect(cxoTitleFromDesignation("CEO")).toBe("CEO");
    expect(cxoTitleFromDesignation("Chief Executive Officer")).toBe(
      "Chief Executive Officer".slice(0, CXO_TITLE_MAX),
    );
  });
});

describe("cxo color from profile", () => {
  it("keeps a portal swatch and otherwise uses the first", () => {
    expect(cxoColorFromProfile("#7048B6")).toBe("#7048B6");
    expect(cxoColorFromProfile("#1C1C2E")).toBe(AVATAR_SWATCHES[0]);
  });
});

describe("cxo window", () => {
  it("returns the first field error", () => {
    expect(validateCxoWindow({ name: "", start: "2026-08-21T16:00", slots: 1 })).toBe("name required");
    expect(validateCxoWindow({ name: "Nikhil", start: "2026-08-21T16:07", slots: 1 })).toBe(
      "start must be on a 15-min mark",
    );
    expect(validateCxoWindow({ name: "Nikhil", start: "2026-08-21T16:00", slots: 1 })).toBeNull();
  });
});
