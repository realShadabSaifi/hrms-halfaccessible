"use client";

import { useEffect, useState } from "react";
import {
  markAnnouncementsSeen,
  postAnnouncement,
  reactAnnouncement,
} from "@/app/(portal)/announcements/actions";
import { Button } from "@/components/ui/Button";
import { Chip } from "@/components/ui/Chip";
import { TextArea } from "@/components/ui/TextArea";
import { TextField } from "@/components/ui/TextField";
import { sortAnnouncements } from "@/lib/announcements/pin";
import type { ProfileRole } from "@/lib/types";

const CATS = ["General", "Culture", "Policy", "Shoutout", "Event", "Update"];
const EMOJIS = ["👍", "🔥", "❤️", "🎉", "💯"];

export type AnnView = {
  id: string;
  title: string;
  body: string;
  category: string;
  pinned: boolean;
  created_at: string;
  reacts: Record<string, number>;
};

export function AnnouncementsClient({
  role,
  items,
}: {
  role: ProfileRole;
  items: AnnView[];
}) {
  const [cat, setCat] = useState("General");
  const [pin, setPin] = useState(false);
  const [filter, setFilter] = useState("All");
  const lead = role === "lead" || role === "admin";
  const list = sortAnnouncements(
    filter === "All" ? items : items.filter((i) => i.category === filter),
  );

  useEffect(() => {
    void markAnnouncementsSeen();
  }, []);

  return (
    <div className="pageEnter">
      {lead ? (
        <form
          className="mb-5 max-w-[720px] rounded-[20px] border border-[rgba(91,45,142,0.3)] bg-white p-[22px]"
          action={async (fd) => {
            await postAnnouncement({
              title: String(fd.get("title")),
              body: String(fd.get("body")),
              category: cat,
              pinned: pin,
            });
          }}
        >
          <div className="mb-3 font-[family-name:var(--font-display)] text-base font-bold">
            post something 📢
          </div>
          <TextField name="title" label="title" placeholder="title - keep it punchy" />
          <div className="h-2.5" />
          <TextArea name="body" rows={2} placeholder="the news. no jargon allowed." />
          <div className="mt-3 flex flex-wrap items-center gap-2">
            {CATS.map((c) => (
              <Chip key={c} active={cat === c} onClick={() => setCat(c)}>
                {c}
              </Chip>
            ))}
            <span className="flex-1" />
            <Chip active={pin} onClick={() => setPin((v) => !v)}>
              pin it
            </Chip>
            <Button type="submit">post it</Button>
          </div>
        </form>
      ) : null}
      <div className="mb-5 flex flex-wrap gap-2">
        {["All", ...CATS].map((c) => (
          <Chip key={c} active={filter === c} onClick={() => setFilter(c)}>
            {c}
          </Chip>
        ))}
      </div>
      <div className="flex max-w-[720px] flex-col gap-4">
        {list.map((an) => (
          <article
            key={an.id}
            className="rounded-[20px] border bg-white px-6 py-[22px]"
            style={{ borderColor: an.pinned ? "rgba(91,45,142,0.35)" : "rgba(28,28,46,0.09)" }}
          >
            <div className="mb-2 flex items-center gap-2.5">
              {an.pinned ? (
                <span className="rounded-full bg-[#5B2D8E] px-2.5 py-0.5 text-[11px] font-bold text-white">
                  PINNED
                </span>
              ) : null}
              <span className="rounded-full bg-[rgba(0,155,141,0.1)] px-2.5 py-0.5 text-[11px] font-bold text-[#00816F]">
                {an.category}
              </span>
              <span className="flex-1" />
              <span className="text-[11.5px] text-[rgba(28,28,46,0.48)]">
                {new Date(an.created_at).toLocaleDateString("en-IN", { month: "short", day: "numeric" })}
              </span>
            </div>
            <h2 className="mb-1.5 font-[family-name:var(--font-display)] text-[17px] font-bold">{an.title}</h2>
            <p className="mb-3.5 whitespace-pre-wrap text-sm leading-relaxed text-[rgba(28,28,46,0.75)]">
              {an.body}
            </p>
            <div className="flex gap-2">
              {EMOJIS.map((e) => (
                <button
                  key={e}
                  type="button"
                  className="inline-flex min-h-[34px] items-center gap-1 rounded-full border border-[rgba(28,28,46,0.12)] px-3 text-[13px]"
                  onClick={() => reactAnnouncement(an.id, e)}
                >
                  {e} <span className="text-[11.5px] tabular-nums">{an.reacts[e] ?? 0}</span>
                </button>
              ))}
            </div>
          </article>
        ))}
        <div className="rounded-[20px] border border-dashed border-[rgba(28,28,46,0.18)] bg-[rgba(28,28,46,0.03)] px-6 py-[22px]">
          <div className="mb-2.5 font-[family-name:var(--font-display)] text-[15px] font-bold">
            the legal stuff
          </div>
          <div className="grid gap-2 text-[13px] leading-relaxed text-[rgba(28,28,46,0.72)]">
            <div>
              <b>POSH Act 2013</b> - zero tolerance. full stop. report anything, anytime, to Sana or the IC.
            </div>
            <div>
              <b>PF · ESIC · PT · TDS</b> - all handled, all compliant. details live in the handbook.
            </div>
            <div>
              <b>Payment of Gratuity Act 1972</b> - covered. long-timers, you&apos;re taken care of.
            </div>
            <div className="text-xs text-[rgba(28,28,46,0.55)]">
              your employment contract takes precedence over anything on this portal.
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
