"use client";

import { useState } from "react";
import { bookCxo } from "@/app/(portal)/cxo/actions";
import { Avatar } from "@/components/ui/Avatar";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { Chip } from "@/components/ui/Chip";
import { EmptyState } from "@/components/ui/EmptyState";
import { TextArea } from "@/components/ui/TextArea";
import { Toast } from "@/components/ui/Toast";
import { initials } from "@/lib/names";
import { CalendarBlank } from "@phosphor-icons/react";

const TOPICS = ["wild idea", "career stuff", "venting", "product rant", "just vibes"];

export function CxoClient({
  cxos,
  mine,
}: {
  cxos: {
    id: string;
    name: string;
    title: string;
    tagline: string;
    avatar_color: string;
    window_label: string;
    slots_remaining: number;
  }[];
  mine: { id: string; who: string; topic: string; when: string; status: string }[];
}) {
  const [who, setWho] = useState(cxos[0]?.id ?? "");
  const [topic, setTopic] = useState(TOPICS[0]);
  const [toast, setToast] = useState<string | null>(null);

  return (
    <div className="pageEnter">
      <div className="mb-6 flex items-center gap-5 rounded-ha-lg border border-ha-accent/25 bg-ha-accent-wash px-7 py-6">
        <span className="text-5xl">👑</span>
        <span>
          <span className="block font-[family-name:var(--font-display)] text-xl font-bold">
            the C-suite, unlocked. occasionally.
          </span>
          <span className="mt-1 block text-[13.5px] text-ha-muted">
            15-minute slots, no agenda police, no manager approval needed. rare drops - when a window opens, grab it.
          </span>
        </span>
      </div>
      <div className="mb-6 grid gap-4 md:grid-cols-3">
        {cxos.map((cx) => (
          <div
            key={cx.id}
            className="rounded-ha-lg border-2 bg-ha-surface p-[22px] shadow-[var(--ha-shadow-card)]"
            style={{ borderColor: who === cx.id ? "var(--ha-accent)" : "transparent" }}
          >
            <div className="mb-3 flex items-center gap-3">
              <Avatar initials={initials(cx.name)} color={cx.avatar_color} />
              <span>
                <span className="block font-[family-name:var(--font-display)] text-[15.5px] font-bold">
                  {cx.name}
                </span>
                <span className="block text-xs font-bold" style={{ color: cx.avatar_color }}>
                  {cx.title}
                </span>
              </span>
            </div>
            <p className="mb-3 text-[12.5px] text-ha-muted">{cx.tagline}</p>
            <div className="mb-3.5 flex flex-wrap gap-2">
              <span className="rounded-full bg-ha-accent-wash px-2.5 py-1 text-[11px] font-bold text-ha-accent-text">
                {cx.window_label}
              </span>
              <span className="rounded-full bg-emerald-500/15 px-2.5 py-1 text-[11px] font-bold text-emerald-700 dark:text-emerald-300">
                {cx.slots_remaining} slots
              </span>
            </div>
            <Button className="w-full" variant={who === cx.id ? "primary" : "ghost"} onClick={() => setWho(cx.id)}>
              {cx.slots_remaining > 0 ? "pick this window" : "full"}
            </Button>
          </div>
        ))}
      </div>
      <div className="grid items-start gap-5 md:grid-cols-[1.1fr_0.9fr]">
        <form
          className="rounded-ha-lg border border-ha-line bg-ha-surface p-6 shadow-[var(--ha-shadow-card)]"
          action={async (fd) => {
            const r = await bookCxo(who, topic, String(fd.get("note") ?? ""));
            setToast(r.ok ? "slot grabbed" : r.error ?? "could not book");
          }}
        >
          <div className="font-[family-name:var(--font-display)] text-base font-bold">what&apos;s it about?</div>
          <p className="mb-3.5 text-xs text-ha-muted">
            no wrong answers. &quot;i just want to vent&quot; is a legitimate agenda.
          </p>
          <div className="mb-3.5 flex flex-wrap gap-2">
            {TOPICS.map((t) => (
              <Chip key={t} active={topic === t} onClick={() => setTopic(t)}>
                {t}
              </Chip>
            ))}
          </div>
          <TextArea name="note" rows={2} placeholder="optional context - or keep the mystery" />
          <Button type="submit" className="mt-3.5 w-full">
            grab the slot
          </Button>
        </form>
        <div className="rounded-ha-lg border border-ha-line bg-ha-surface p-[22px] shadow-[var(--ha-shadow-card)]">
          <div className="mb-3.5 font-[family-name:var(--font-display)] text-base font-bold">your slots</div>
          {mine.length === 0 ? (
            <EmptyState icon={<CalendarBlank size={28} />} title="no slots grabbed yet" />
          ) : (
            mine.map((mc) => (
              <div key={mc.id} className="flex items-center gap-3 border-b border-ha-line py-2.5">
                <span className="min-w-0 flex-1">
                  <span className="block text-[13.5px] font-semibold">{mc.who}</span>
                  <span className="block text-xs text-ha-muted">
                    {mc.topic} · {mc.when}
                  </span>
                </span>
                <Badge status={mc.status === "approved" ? "Approved" : "Pending"} />
              </div>
            ))
          )}
        </div>
      </div>
      <Toast message={toast} />
    </div>
  );
}
