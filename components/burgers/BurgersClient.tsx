"use client";

import { useState } from "react";
import { overrideHoliday, proposeHoliday, voteHoliday } from "@/app/(portal)/burgers/actions";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { TextArea } from "@/components/ui/TextArea";
import { TextField } from "@/components/ui/TextField";
import { Toast } from "@/components/ui/Toast";
import { votePercent } from "@/lib/burgers/resolve";
import type { ProfileRole } from "@/lib/types";
import { BurgerRain } from "./BurgerRain";

export type HolidayView = {
  id: string;
  holiday_on: string;
  title: string;
  reason: string;
  status: "voting" | "approved" | "rejected";
  yes: number;
  no: number;
  myVote: "yes" | "no" | null;
  countdown: string | null;
};

export function BurgersClient({
  holidays,
  role,
}: {
  holidays: HolidayView[];
  role: ProfileRole;
}) {
  const [rain, setRain] = useState(false);
  const [toast, setToast] = useState<string | null>(null);
  const confirmed = holidays.filter((h) => h.status === "approved");

  return (
    <div className="pageEnter">
      <div className="mb-4 flex items-center gap-5 rounded-[22px] border border-[rgba(91,45,142,0.16)] bg-[rgba(91,45,142,0.06)] px-7 py-6">
        <span className="text-5xl">🍔</span>
        <span>
          <span className="block font-[family-name:var(--font-display)] text-xl font-bold">
            long weekend one day away? we vote.
          </span>
          <span className="mt-1 block text-[13.5px] text-[rgba(28,28,46,0.65)]">
            not a &quot;sandwich holiday&quot; - a <b>Burger Holiday</b>. inspired by the US, claimed by us.
            majority 🍔 wins.
          </span>
        </span>
      </div>
      {confirmed.length ? (
        <div className="mb-5 flex flex-wrap items-center gap-2.5">
          <span className="text-xs font-bold uppercase tracking-wider text-[rgba(28,28,46,0.55)]">
            confirmed:
          </span>
          {confirmed.map((ch) => (
            <span
              key={ch.id}
              className="rounded-full border border-[rgba(16,185,129,0.3)] bg-[rgba(16,185,129,0.13)] px-3.5 py-1.5 text-[12.5px] font-bold text-[#047857]"
            >
              🍔 {ch.holiday_on}
            </span>
          ))}
        </div>
      ) : null}
      <div className="grid items-start gap-5 md:grid-cols-[1.2fr_0.8fr]">
        <div className="flex flex-col gap-4">
          {holidays.map((h) => {
            const pct = votePercent(h.yes, h.no);
            const badge =
              h.status === "voting" ? "Voting" : h.status === "approved" ? "Approved" : "Rejected";
            return (
              <div
                key={h.id}
                className="rounded-[20px] border border-[rgba(28,28,46,0.09)] bg-white p-[22px] shadow-[0_1px_3px_rgba(28,28,46,0.05)]"
              >
                <div className="mb-1.5 flex items-center gap-3">
                  <span className="font-[family-name:var(--font-display)] text-lg font-bold">
                    {h.holiday_on}
                  </span>
                  <Badge status={badge} />
                  <span className="flex-1" />
                  {h.countdown ? (
                    <span className="text-xs font-bold tabular-nums text-[#2563EB]">⏳ {h.countdown}</span>
                  ) : null}
                </div>
                <div className="text-sm font-semibold">{h.title}</div>
                <div className="mb-3.5 text-[12.5px] text-[rgba(28,28,46,0.6)]">{h.reason}</div>
                <div className="mb-1.5 flex items-center gap-2.5">
                  <span className="w-11 text-[13px] tabular-nums">🍔 {h.yes}</span>
                  <span className="h-2.5 flex-1 overflow-hidden rounded-full bg-[rgba(28,28,46,0.08)]">
                    <span
                      className="block h-full rounded-full bg-[#009B8D] transition-[width] duration-500"
                      style={{ width: `${pct}%` }}
                    />
                  </span>
                  <span className="w-11 text-right text-[13px] tabular-nums">👎 {h.no}</span>
                </div>
                {h.status === "voting" ? (
                  <div className="mt-3 flex gap-2.5">
                    <Button
                      variant="success"
                      className="flex-1"
                      onClick={async () => {
                        const r = await voteHoliday(h.id, "yes");
                        if (r.ok && r.rain) setRain((x) => !x || true);
                        setToast("vote locked in");
                      }}
                    >
                      🍔 yes, holiday
                    </Button>
                    <Button variant="ghost" className="flex-1" onClick={() => voteHoliday(h.id, "no")}>
                      👎 nah
                    </Button>
                  </div>
                ) : null}
                {h.myVote ? (
                  <div className="mt-2.5 text-[12.5px] font-semibold text-[#00816F]">
                    you voted {h.myVote === "yes" ? "yes" : "nah"}
                  </div>
                ) : null}
                {role === "admin" && h.status === "voting" ? (
                  <div className="mt-3 flex gap-2 border-t border-dashed border-[rgba(28,28,46,0.15)] pt-2.5">
                    <Button variant="success" onClick={() => overrideHoliday(h.id, "approved")}>
                      force approve
                    </Button>
                    <Button variant="danger" onClick={() => overrideHoliday(h.id, "rejected")}>
                      force reject
                    </Button>
                  </div>
                ) : null}
              </div>
            );
          })}
        </div>
        <form
          className="rounded-[20px] border border-[rgba(28,28,46,0.09)] bg-white p-[22px] shadow-[0_1px_3px_rgba(28,28,46,0.05)]"
          action={async (fd) => {
            const r = await proposeHoliday(String(fd.get("date")), String(fd.get("reason")));
            setToast(r.ok ? "vote is open for 48h" : r.error);
          }}
        >
          <div className="font-[family-name:var(--font-display)] text-base font-bold">propose one</div>
          <p className="mb-4 text-xs text-[rgba(28,28,46,0.55)]">anyone can. that&apos;s the point. voting stays open 48h.</p>
          <TextField label="date" name="date" type="date" required />
          <div className="h-3" />
          <TextArea label="the pitch" name="reason" rows={3} placeholder="why does the team deserve this?" />
          <Button type="submit" className="mt-4 w-full">
            open the vote
          </Button>
        </form>
      </div>
      <BurgerRain fire={rain} />
      <Toast message={toast} />
    </div>
  );
}
