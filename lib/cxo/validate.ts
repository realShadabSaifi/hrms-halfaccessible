import { AVATAR_SWATCHES } from "@/lib/profiles/details";

export const CXO_NAME_MAX = 80;
export const CXO_TITLE_MAX = 20;
export const CXO_SLOT_TAGLINE = "15 minutes. no agenda.";

const START_RE = /^(\d{4})-(\d{2})-(\d{2})T(\d{2}):(\d{2})(?::\d{2})?$/;
const MONTHS = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];

export type CxoWindowInput = {
  name: string;
  start: string;
  slots: unknown;
};

type WallClock = { y: number; m: number; d: number; h: number; min: number };

function parseCxoStart(raw: string): WallClock | "empty" | "invalid" | "offgrid" {
  const value = raw.trim();
  if (!value) return "empty";
  const match = START_RE.exec(value);
  if (!match) return "invalid";
  const y = Number(match[1]);
  const m = Number(match[2]);
  const d = Number(match[3]);
  const h = Number(match[4]);
  const min = Number(match[5]);
  const dt = new Date(Date.UTC(y, m - 1, d));
  if (dt.getUTCFullYear() !== y || dt.getUTCMonth() !== m - 1 || dt.getUTCDate() !== d) return "invalid";
  if (h > 23) return "invalid";
  if (min !== 0 && min !== 15 && min !== 30 && min !== 45) return "offgrid";
  return { y, m, d, h, min };
}

function addMinutes(clock: WallClock, minutes: number): WallClock {
  const dt = new Date(Date.UTC(clock.y, clock.m - 1, clock.d, clock.h, clock.min + minutes));
  return {
    y: dt.getUTCFullYear(),
    m: dt.getUTCMonth() + 1,
    d: dt.getUTCDate(),
    h: dt.getUTCHours(),
    min: dt.getUTCMinutes(),
  };
}

function formatClock(clock: WallClock): string {
  const date = `${MONTHS[clock.m - 1]} ${clock.d}`;
  const ampm = clock.h < 12 ? "am" : "pm";
  const hour = clock.h % 12 === 0 ? 12 : clock.h % 12;
  return `${date} · ${hour}:${String(clock.min).padStart(2, "0")}${ampm}`;
}

export function validateCxoName(name: string): string | null {
  const trimmed = name.trim();
  if (!trimmed) return "name required";
  if (trimmed.length > CXO_NAME_MAX) return "name too long";
  return null;
}

export function validateCxoStart(raw: string): string | null {
  const parsed = parseCxoStart(raw);
  if (parsed === "empty") return "start required";
  if (parsed === "invalid") return "invalid start";
  if (parsed === "offgrid") return "start must be on a 15-min mark";
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

export function formatCxoSlotLabel(raw: string): string {
  const parsed = parseCxoStart(raw);
  if (typeof parsed === "string") return "";
  return formatClock(parsed);
}

export function cxoSlotStarts(raw: string, count: number): string[] {
  const parsed = parseCxoStart(raw);
  if (typeof parsed === "string") return [];
  return Array.from({ length: count }, (_, i) => formatClock(addMinutes(parsed, i * 15)));
}

export function cxoTitleFromDesignation(designation: string): string {
  const trimmed = designation.trim();
  return trimmed ? trimmed.slice(0, CXO_TITLE_MAX) : "cxo";
}

export function cxoColorFromProfile(color: string): string {
  return AVATAR_SWATCHES.includes(color as (typeof AVATAR_SWATCHES)[number]) ? color : AVATAR_SWATCHES[0];
}

export function validateCxoWindow(input: CxoWindowInput): string | null {
  return validateCxoName(input.name) ?? validateCxoStart(input.start) ?? validateCxoSlotCount(input.slots);
}
