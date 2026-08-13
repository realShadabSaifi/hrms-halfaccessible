"use client";

import { useMemo, useState } from "react";
import { decideLeave, type LeaveRow } from "@/app/(portal)/leaves/actions";
import { Avatar } from "@/components/ui/Avatar";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { Chip } from "@/components/ui/Chip";
import { initials } from "@/lib/names";
import { LEAVE_TYPES } from "@/lib/validators/leave";

export function TeamRequests({
  rows,
  names,
}: {
  rows: LeaveRow[];
  names: Record<string, { full_name: string; avatar_color: string }>;
}) {
  const [filter, setFilter] = useState("All");
  const [notes, setNotes] = useState<Record<string, string>>({});
  const filtered = useMemo(
    () =>
      rows.filter((r) => (filter === "All" ? true : r.status === filter.toLowerCase())),
    [rows, filter],
  );

  return (
    <div className="rounded-ha-lg border border-ha-accent/30 bg-ha-surface p-[22px] shadow-[var(--ha-shadow-card)]">
      <div className="font-[family-name:var(--font-display)] text-base font-bold">team requests 👀</div>
      <p className="mb-3 text-xs text-ha-muted">you have the power. use it kindly.</p>
      <div className="mb-3 flex flex-wrap gap-1.5">
        {["All", "Pending", "Approved", "Rejected"].map((f) => (
          <Chip key={f} active={filter === f} onClick={() => setFilter(f)}>
            {f}
          </Chip>
        ))}
      </div>
      {filtered.map((tl) => {
        const person = names[tl.requester_id];
        const meta = LEAVE_TYPES.find((t) => t.type === tl.type);
        const status =
          tl.status === "pending" ? "Pending" : tl.status === "approved" ? "Approved" : "Rejected";
        return (
          <div key={tl.id} className="border-b border-ha-line py-3">
            <div className="mb-2 flex items-center gap-2.5">
              <Avatar
                initials={initials(person?.full_name ?? "?")}
                color={person?.avatar_color ?? "#7048B6"}
                size="sm"
              />
              <span className="min-w-0 flex-1">
                <span className="block text-[13.5px] font-semibold">
                  {person?.full_name} · {meta?.emoji} {meta?.name}
                </span>
                <span className="block text-xs text-ha-muted">
                  {tl.starts_on} - {tl.reason}
                </span>
              </span>
              <Badge status={status} />
            </div>
            {tl.status === "pending" ? (
              <div className="flex flex-wrap items-center gap-2 pl-10">
                <input
                  className="min-h-9 min-w-[140px] flex-1 rounded-full border border-ha-line bg-ha-surface px-3.5 text-xs text-ha-ink"
                  placeholder="optional note…"
                  value={notes[tl.id] ?? ""}
                  onChange={(e) => setNotes((n) => ({ ...n, [tl.id]: e.target.value }))}
                />
                <Button variant="success" onClick={() => decideLeave(tl.id, "approve", notes[tl.id] ?? "")}>
                  approve
                </Button>
                <Button variant="danger" onClick={() => decideLeave(tl.id, "reject", notes[tl.id] ?? "")}>
                  reject
                </Button>
              </div>
            ) : tl.decision_note ? (
              <div className="pl-10 text-xs italic text-ha-muted">note: {tl.decision_note}</div>
            ) : null}
          </div>
        );
      })}
    </div>
  );
}
