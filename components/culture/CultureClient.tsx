"use client";

import { useState } from "react";
import {
  approveParty,
  closeTrip,
  submitParty,
  voteTrip,
} from "@/app/(portal)/culture/actions";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { Chip } from "@/components/ui/Chip";
import { TextField } from "@/components/ui/TextField";
import { PARTY_VIBES } from "@/lib/culture/party";
import type { ProfileRole } from "@/lib/types";

export function CultureClient({
  role,
  parties,
  poll,
}: {
  role: ProfileRole;
  parties: {
    id: string;
    occasion: string;
    vibe: string;
    preferred_on: string | null;
    status: string;
    by: string;
  }[];
  poll: {
    id: string;
    open: boolean;
    options: { id: string; name: string; votes: number; mine: boolean }[];
  } | null;
}) {
  const [vibe, setVibe] = useState(PARTY_VIBES[1]);
  const lead = role === "lead" || role === "admin";
  const total = poll?.options.reduce((a, o) => a + o.votes, 0) || 1;

  return (
    <div className="pageEnter grid items-start gap-5 md:grid-cols-2">
      <div className="flex flex-col gap-5">
        <form
          className="rounded-ha-lg border border-ha-line bg-ha-surface p-6 shadow-[var(--ha-shadow-card)]"
          action={async (fd) => {
            await submitParty(String(fd.get("occasion")), vibe, String(fd.get("date")));
          }}
        >
          <div className="font-[family-name:var(--font-display)] text-[17px] font-bold">request a party</div>
          <p className="mb-4 text-xs text-ha-muted">
            company budget. lead approves. that&apos;s the whole process.
          </p>
          <TextField name="occasion" label="occasion" placeholder="e.g. we survived the migration" />
          <div className="mb-2 mt-3 text-[11.5px] font-bold uppercase tracking-wider text-ha-muted">
            vibe
          </div>
          <div className="mb-3.5 flex flex-wrap gap-2">
            {PARTY_VIBES.map((v) => (
              <Chip key={v} active={vibe === v} onClick={() => setVibe(v)}>
                {v}
              </Chip>
            ))}
          </div>
          <TextField name="date" label="preferred date" type="date" />
          <Button type="submit" className="mt-4 w-full">
            send to lead
          </Button>
        </form>
        <div className="rounded-ha-lg border border-ha-line bg-ha-surface p-[22px] shadow-[var(--ha-shadow-card)]">
          <div className="mb-3.5 font-[family-name:var(--font-display)] text-base font-bold">party queue</div>
          {parties.map((pr) => (
            <div key={pr.id} className="border-b border-ha-line py-2.5">
              <div className="flex items-center gap-2.5">
                <span className="min-w-0 flex-1">
                  <span className="block text-[13.5px] font-semibold">{pr.occasion}</span>
                  <span className="block text-xs text-ha-muted">
                    {pr.vibe} · {pr.preferred_on ?? "TBD"} · asked by {pr.by}
                  </span>
                </span>
                <Badge
                  status={
                    pr.status === "approved"
                      ? "Approved"
                      : pr.status === "rejected"
                        ? "Rejected"
                        : "Pending"
                  }
                />
              </div>
              {lead && pr.status === "pending" ? (
                <Button variant="success" className="mt-2" onClick={() => approveParty(pr.id)}>
                  approve - it&apos;s on the card
                </Button>
              ) : null}
            </div>
          ))}
        </div>
      </div>
      <div className="rounded-ha-lg border border-ha-line bg-ha-surface p-6 shadow-[var(--ha-shadow-card)]">
        <div className="font-[family-name:var(--font-display)] text-[17px] font-bold">
          FY27 team trip - where to?
        </div>
        <p className="mb-4 text-xs text-ha-muted">
          {poll?.open ? "admin opened the poll. vote or forever hold your peace." : "poll closed - winner announced"}
        </p>
        {poll?.options.map((to) => (
          <button
            key={to.id}
            type="button"
            disabled={!poll.open}
            onClick={() => voteTrip(to.id)}
            className="mb-2.5 block w-full rounded-ha-md border px-4 py-3.5 text-left"
            style={{
              background: to.mine ? "var(--ha-accent-wash)" : "transparent",
              borderColor: to.mine ? "var(--ha-accent)" : "var(--ha-line)",
            }}
          >
            <span className="mb-2 flex items-center gap-2.5">
              <span className="flex-1 text-sm font-bold">{to.name}</span>
              <span className="text-xs font-bold tabular-nums text-ha-accent-text">{to.votes} votes</span>
              {to.mine ? (
                <span className="rounded-full bg-ha-accent px-2 py-0.5 text-[10.5px] font-bold text-white">
                  your pick
                </span>
              ) : null}
            </span>
            <span className="block h-2 overflow-hidden rounded-full bg-ha-line">
              <span
                className="block h-full rounded-full bg-ha-teal-bar"
                style={{ width: `${Math.round((to.votes / total) * 100)}%` }}
              />
            </span>
          </button>
        ))}
        {role === "admin" && poll?.open ? (
          <Button variant="ghost" className="mt-3.5 w-full" onClick={() => closeTrip(poll.id)}>
            close poll & announce winner (admin)
          </Button>
        ) : null}
      </div>
    </div>
  );
}
