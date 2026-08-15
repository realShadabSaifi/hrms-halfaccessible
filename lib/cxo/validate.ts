import { validateHolidayDate } from "@/lib/holidays/validate";
import { AVATAR_SWATCHES } from "@/lib/profiles/details";

export const CXO_NAME_MAX = 40;
export const CXO_TITLE_MAX = 20;
export const CXO_TAGLINE_MAX = 80;
export const CXO_NOTE_MAX = 40;

export type CxoWindowInput = {
  name: string;
  title: string;
  tagline: string;
  date: string;
  note: string;
  slots: unknown;
  color: string;
};

export function validateCxoName(name: string): string | null {
  const trimmed = name.trim();
  if (!trimmed) return "name required";
  if (trimmed.length > CXO_NAME_MAX) return "name too long";
  return null;
}

export function validateCxoTitle(title: string): string | null {
  const trimmed = title.trim();
  if (!trimmed) return "title required";
  if (trimmed.length > CXO_TITLE_MAX) return "title too long";
  return null;
}

export function validateCxoTagline(tagline: string): string | null {
  const trimmed = tagline.trim();
  if (!trimmed) return "tagline required";
  if (trimmed.length > CXO_TAGLINE_MAX) return "tagline too long";
  return null;
}

export function validateCxoDate(iso: string): string | null {
  return validateHolidayDate(iso);
}

export function validateCxoNote(note: string): string | null {
  if (note.trim().length > CXO_NOTE_MAX) return "note too long";
  return null;
}

export function validateCxoSlotCount(n: unknown): string | null {
  if (typeof n === "number") {
    if (!Number.isInteger(n) || n < 1 || n > 20) return "slots must be 1-20";
    return null;
  }
  const raw = String(n ?? "").trim();
  if (!/^\d+$/.test(raw)) return "slots must be 1-20";
  const value = Number.parseInt(raw, 10);
  if (value < 1 || value > 20) return "slots must be 1-20";
  return null;
}

export function cxoSlotCount(n: unknown): number {
  return typeof n === "number" ? n : Number.parseInt(String(n).trim(), 10);
}

export function validateCxoColor(color: string): string | null {
  if (!AVATAR_SWATCHES.includes(color as (typeof AVATAR_SWATCHES)[number])) {
    return "invalid color";
  }
  return null;
}

export function formatCxoWindowLabel(iso: string, note: string): string {
  const [y, m, d] = iso.split("-").map(Number);
  const date = new Date(Date.UTC(y, m - 1, d)).toLocaleString("en-US", {
    month: "short",
    day: "numeric",
    timeZone: "UTC",
  });
  const extra = note.trim();
  return extra ? `${date} · ${extra}` : date;
}

export function nextSlotsRemaining(current: number, add: number): number {
  return current + add;
}

export function validateCxoWindow(input: CxoWindowInput): string | null {
  return (
    validateCxoName(input.name) ??
    validateCxoTitle(input.title) ??
    validateCxoTagline(input.tagline) ??
    validateCxoDate(input.date) ??
    validateCxoNote(input.note) ??
    validateCxoSlotCount(input.slots) ??
    validateCxoColor(input.color)
  );
}
