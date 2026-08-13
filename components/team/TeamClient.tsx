"use client";

import { useMemo, useState } from "react";
import { saveProfile } from "@/app/(portal)/team/actions";
import { Avatar } from "@/components/ui/Avatar";
import { Button } from "@/components/ui/Button";
import { TextArea } from "@/components/ui/TextArea";
import { initials } from "@/lib/names";
import { matchesMember } from "@/lib/team/search";
import type { Profile } from "@/lib/types";

const SWATCHES = ["#7048B6", "#0E9488", "#D97706", "#DB2777", "#0284C7", "#65A30D"];

export function TeamClient({
  members,
  me,
}: {
  members: Profile[];
  me: string;
}) {
  const [q, setQ] = useState("");
  const [open, setOpen] = useState<Profile | null>(null);
  const [editing, setEditing] = useState(false);
  const [bio, setBio] = useState("");
  const [color, setColor] = useState("");
  const list = useMemo(() => members.filter((m) => matchesMember(m, q)), [members, q]);

  function openProfile(m: Profile) {
    setOpen(m);
    setEditing(false);
    setBio(m.bio);
    setColor(m.avatar_color);
  }

  return (
    <div className="pageEnter">
      <input
        className="mb-5 min-h-11 w-full max-w-[420px] rounded-[14px] border border-[rgba(28,28,46,0.14)] bg-white px-4"
        placeholder="search by name, role, dept, or skill…"
        value={q}
        onChange={(e) => setQ(e.target.value)}
      />
      {list.length === 0 ? (
        <div className="px-5 py-12 text-center text-[rgba(28,28,46,0.55)]">
          <div className="mb-2 text-4xl">🫥</div>
          <div className="font-semibold">nobody matches that vibe</div>
          <div className="mt-1 text-[13px]">try a name, role, dept, or skill - like &quot;figma&quot; or &quot;engineering&quot;</div>
        </div>
      ) : (
        <div className="grid grid-cols-[repeat(auto-fill,minmax(240px,1fr))] gap-4">
          {list.map((m) => (
            <button
              key={m.id}
              type="button"
              onClick={() => openProfile(m)}
              className="rounded-[20px] border border-[rgba(28,28,46,0.09)] bg-white p-5 text-left shadow-[0_1px_3px_rgba(28,28,46,0.05)] transition hover:-translate-y-1.5"
            >
              <Avatar initials={initials(m.full_name)} color={m.avatar_color} size="lg" className="mb-3" />
              <div className="font-[family-name:var(--font-display)] text-[15.5px] font-bold">
                {m.full_name} {m.id === me ? "(you)" : ""}
              </div>
              <div className="mb-2 mt-0.5 text-[12.5px] font-semibold" style={{ color: m.avatar_color }}>
                {m.designation} · {m.department}
              </div>
              <div className="mb-2.5 flex flex-wrap gap-1">
                {m.skills.map((sk) => (
                  <span key={sk} className="rounded-full bg-[rgba(28,28,46,0.06)] px-2 py-0.5 text-[10.5px] font-semibold">
                    {sk}
                  </span>
                ))}
              </div>
              <div className="text-[11px] text-[rgba(28,28,46,0.48)]">joined {m.joined_at}</div>
            </button>
          ))}
        </div>
      )}
      {open ? (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-[rgba(28,28,46,0.45)]"
          onClick={() => setOpen(null)}
        >
          <div
            className="w-[440px] max-w-[90vw] rounded-3xl bg-white p-8 shadow-[0_24px_64px_rgba(28,28,46,0.25)]"
            onClick={(e) => e.stopPropagation()}
            role="dialog"
            aria-modal="true"
            aria-label="profile"
          >
            <div className="mb-4 flex gap-4">
              <Avatar initials={initials(open.full_name)} color={editing ? color : open.avatar_color} size="lg" />
              <div className="flex-1 pt-1">
                <div className="font-[family-name:var(--font-display)] text-[22px] font-bold">{open.full_name}</div>
                <div className="mt-1 text-[13.5px] font-semibold" style={{ color: open.avatar_color }}>
                  {open.designation} · {open.department}
                </div>
              </div>
              <button type="button" aria-label="close profile" className="h-9 w-9 rounded-full bg-[rgba(28,28,46,0.06)]" onClick={() => setOpen(null)}>
                ✕
              </button>
            </div>
            {editing ? (
              <>
                <TextArea value={bio} onChange={(e) => setBio(e.target.value)} rows={3} />
                <div className="mb-2 mt-3 text-[11.5px] font-bold uppercase tracking-wider text-[rgba(28,28,46,0.55)]">
                  avatar color
                </div>
                <div className="mb-4 flex gap-2">
                  {SWATCHES.map((c) => (
                    <button
                      key={c}
                      type="button"
                      aria-label="pick avatar color"
                      onClick={() => setColor(c)}
                      className="h-[34px] w-[34px] rounded-full"
                      style={{ background: c, border: color === c ? "3px solid #1C1C2E" : "3px solid transparent" }}
                    />
                  ))}
                </div>
                <Button
                  className="w-full"
                  onClick={async () => {
                    await saveProfile(bio, color);
                    setOpen({ ...open, bio, avatar_color: color });
                    setEditing(false);
                  }}
                >
                  save
                </Button>
              </>
            ) : (
              <>
                <p className="mb-4 text-sm leading-relaxed text-[rgba(28,28,46,0.75)]">{open.bio || "no bio yet."}</p>
                <div className="mb-4 flex flex-wrap gap-1.5">
                  {open.skills.map((s) => (
                    <span key={s} className="rounded-full bg-[rgba(28,28,46,0.06)] px-2.5 py-1 text-[11px] font-semibold">
                      {s}
                    </span>
                  ))}
                </div>
                <div className="flex items-center">
                  <span className="flex-1 text-xs text-[rgba(28,28,46,0.5)]">joined {open.joined_at}</span>
                  {open.id === me ? (
                    <Button variant="ghost" onClick={() => setEditing(true)}>
                      edit my profile
                    </Button>
                  ) : null}
                </div>
              </>
            )}
          </div>
        </div>
      ) : null}
    </div>
  );
}
