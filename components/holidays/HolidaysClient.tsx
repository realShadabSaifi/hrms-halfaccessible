"use client";

import { useMemo, useState } from "react";
import { markHoliday, unmarkHoliday } from "@/app/(portal)/holidays/actions";
import { Button } from "@/components/ui/Button";
import { TextField } from "@/components/ui/TextField";
import { Toast } from "@/components/ui/Toast";
import { monthCells, WEEKDAYS } from "@/lib/holidays/calendar";
import { HOLIDAY_TITLE_MAX } from "@/lib/holidays/validate";
import type { CompanyHoliday } from "@/lib/types";

function monthLabel(year: number, month: number) {
  return new Date(Date.UTC(year, month - 1, 1))
    .toLocaleString("en-US", { month: "long", year: "numeric", timeZone: "UTC" })
    .toLowerCase();
}

export function HolidaysClient({
  holidays,
  canManage,
}: {
  holidays: CompanyHoliday[];
  canManage: boolean;
}) {
  const now = new Date();
  const [year, setYear] = useState(now.getUTCFullYear());
  const [month, setMonth] = useState(now.getUTCMonth() + 1);
  const [selected, setSelected] = useState<string | null>(null);
  const [toast, setToast] = useState<string | null>(null);
  const byDate = useMemo(
    () => Object.fromEntries(holidays.map((h) => [h.holiday_on, h])),
    [holidays],
  );
  const cells = monthCells(year, month);
  const picked = selected ? byDate[selected] : undefined;
  const today = now.toISOString().slice(0, 10);
  const upcoming = holidays.filter((h) => h.holiday_on >= today);

  function shift(delta: number) {
    const next = new Date(Date.UTC(year, month - 1 + delta, 1));
    setYear(next.getUTCFullYear());
    setMonth(next.getUTCMonth() + 1);
    setSelected(null);
  }

  return (
    <div className="pageEnter mx-auto max-w-[720px]">
      <div className="rounded-ha-lg border border-ha-line bg-ha-surface p-[22px] shadow-[var(--ha-shadow-card)]">
        <div className="font-[family-name:var(--font-display)] text-base font-bold">
          holiday calendar
        </div>
        <p className="mb-3.5 text-xs text-ha-muted">
          {canManage ? "click a day. name it. mark it." : "official days off."}
        </p>
        <div className="mb-3 flex items-center justify-between">
          <Button variant="ghost" type="button" onClick={() => shift(-1)}>
            prev
          </Button>
          <div className="text-sm font-bold">{monthLabel(year, month)}</div>
          <Button variant="ghost" type="button" onClick={() => shift(1)}>
            next
          </Button>
        </div>
        <div className="grid grid-cols-7 gap-1">
          {WEEKDAYS.map((d) => (
            <div
              key={d}
              className="text-center text-[11.5px] font-bold uppercase tracking-wider text-ha-muted"
            >
              {d}
            </div>
          ))}
          {cells.map((cell) => {
            const hit = byDate[cell.iso];
            const isSelected = selected === cell.iso;
            const inner = (
              <>
                <span className="text-[13px] font-bold">{Number(cell.iso.slice(8))}</span>
                {hit ? (
                  <span className="block truncate text-[10px] text-ha-soft">{hit.title}</span>
                ) : null}
              </>
            );
            const cls = `min-h-14 rounded-[6px] border border-ha-line px-1 py-1 text-left ${
              cell.inMonth ? "bg-ha-surface" : "bg-ha-bg text-ha-muted"
            } ${hit ? "bg-[rgba(116,99,212,0.07)]" : ""} ${
              isSelected ? "outline outline-[3px] outline-[rgba(116,99,212,0.45)]" : ""
            }`;
            if (!canManage) {
              return (
                <div key={cell.iso} className={cls}>
                  {inner}
                </div>
              );
            }
            return (
              <button
                key={cell.iso}
                type="button"
                className={cls}
                onClick={() => setSelected(cell.iso)}
              >
                {inner}
              </button>
            );
          })}
        </div>
        {canManage && selected ? (
          <div className="mt-4 border-t border-ha-line pt-4">
            {picked ? (
              <div>
                <p className="text-sm">
                  {picked.holiday_on} · {picked.title}
                </p>
                <Button
                  className="mt-3"
                  variant="ghost"
                  onClick={async () => {
                    const r = await unmarkHoliday(picked.id);
                    setToast(r.ok ? "unmarked." : r.error ?? "nope");
                    if (r.ok) setSelected(null);
                  }}
                >
                  unmark
                </Button>
              </div>
            ) : (
              <form
                action={async (fd) => {
                  const r = await markHoliday(fd);
                  setToast(r.ok ? "marked." : r.error ?? "nope");
                  if (r.ok) setSelected(null);
                }}
              >
                <input type="hidden" name="holiday_on" value={selected} />
                <TextField
                  name="title"
                  label={`name for ${selected}`}
                  maxLength={HOLIDAY_TITLE_MAX}
                  required
                />
                <div className="mt-3">
                  <Button type="submit">mark holiday</Button>
                </div>
              </form>
            )}
          </div>
        ) : null}
        {!canManage && upcoming.length ? (
          <ul className="mt-4 border-t border-ha-line pt-4 text-sm">
            {upcoming.map((h) => (
              <li key={h.id}>
                {h.holiday_on} · {h.title}
              </li>
            ))}
          </ul>
        ) : null}
      </div>
      <Toast message={toast} />
    </div>
  );
}
