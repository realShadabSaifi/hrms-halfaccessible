import { addUtcDay } from "./dates";

export const WEEKDAYS = ["mon", "tue", "wed", "thu", "fri", "sat", "sun"] as const;

export type CalendarCell = {
  iso: string;
  inMonth: boolean;
};

export function monthCells(year: number, month: number): CalendarCell[] {
  const first = new Date(Date.UTC(year, month - 1, 1));
  const startPad = (first.getUTCDay() + 6) % 7;
  let cur = `${year}-${String(month).padStart(2, "0")}-01`;
  for (let i = 0; i < startPad; i += 1) {
    const [y, m, d] = cur.split("-").map(Number);
    const prev = new Date(Date.UTC(y, m - 1, d));
    prev.setUTCDate(prev.getUTCDate() - 1);
    cur = prev.toISOString().slice(0, 10);
  }
  const cells: CalendarCell[] = [];
  for (let i = 0; i < 42; i += 1) {
    const [y, m] = cur.split("-").map(Number);
    cells.push({ iso: cur, inMonth: y === year && m === month });
    cur = addUtcDay(cur);
  }
  return cells;
}
