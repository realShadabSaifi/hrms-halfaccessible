"use client";

import { useState } from "react";
import { addCxoSlots, createCxoWindow } from "@/app/(portal)/cxo/manage/actions";
import { Avatar } from "@/components/ui/Avatar";
import { Button } from "@/components/ui/Button";
import { EmptyState } from "@/components/ui/EmptyState";
import { TextField } from "@/components/ui/TextField";
import { Toast } from "@/components/ui/Toast";
import {
  CXO_NAME_MAX,
  CXO_NOTE_MAX,
  CXO_TAGLINE_MAX,
  CXO_TITLE_MAX,
} from "@/lib/cxo/validate";
import { initials } from "@/lib/names";
import { AVATAR_SWATCHES } from "@/lib/profiles/details";
import { CalendarBlank } from "@phosphor-icons/react";

export type CxoWindowRow = {
  id: string;
  name: string;
  title: string;
  tagline: string;
  avatar_color: string;
  window_label: string;
  slots_remaining: number;
};

export function CxoManageClient({ windows }: { windows: CxoWindowRow[] }) {
  const [toast, setToast] = useState<string | null>(null);
  const [color, setColor] = useState<(typeof AVATAR_SWATCHES)[number]>(AVATAR_SWATCHES[0]);
  const [formKey, setFormKey] = useState(0);

  return (
    <div className="pageEnter mx-auto max-w-[720px]">
      <form
        key={formKey}
        className="mb-5 rounded-ha-lg border border-ha-accent/30 bg-ha-surface p-[22px] shadow-[var(--ha-shadow-card)]"
        action={async (fd) => {
          const r = await createCxoWindow(fd);
          setToast(r.ok ? "window dropped" : r.error ?? "nope");
          if (r.ok) {
            setColor(AVATAR_SWATCHES[0]);
            setFormKey((k) => k + 1);
          }
        }}
      >
        <div className="mb-3 font-[family-name:var(--font-display)] text-base font-bold">
          drop a window
        </div>
        <TextField name="name" label="name" maxLength={CXO_NAME_MAX} required />
        <div className="h-2.5" />
        <TextField name="title" label="title" maxLength={CXO_TITLE_MAX} required />
        <div className="h-2.5" />
        <TextField name="tagline" label="tagline" maxLength={CXO_TAGLINE_MAX} required />
        <div className="h-2.5" />
        <TextField name="date" label="date" type="date" required />
        <div className="h-2.5" />
        <TextField name="note" label="note" maxLength={CXO_NOTE_MAX} />
        <div className="h-2.5" />
        <TextField name="slots" label="slots" type="number" min={1} max={20} defaultValue={1} required />
        <input type="hidden" name="color" value={color} />
        <div className="mt-3 flex flex-wrap gap-2">
          {AVATAR_SWATCHES.map((c) => (
            <button
              key={c}
              type="button"
              aria-label="pick avatar color"
              onClick={() => setColor(c)}
              className="h-[34px] w-[34px] rounded-full"
              style={{
                background: c,
                border: color === c ? "3px solid var(--ha-ink)" : "3px solid transparent",
              }}
            />
          ))}
        </div>
        <div className="mt-3.5">
          <Button type="submit">drop it</Button>
        </div>
      </form>
      <div className="rounded-ha-lg border border-ha-line bg-ha-surface p-[22px] shadow-[var(--ha-shadow-card)]">
        <div className="mb-3.5 font-[family-name:var(--font-display)] text-base font-bold">
          windows
        </div>
        {windows.length === 0 ? (
          <EmptyState icon={<CalendarBlank size={28} />} title="no windows yet" />
        ) : (
          windows.map((cx) => (
            <form
              key={cx.id}
              className="flex flex-wrap items-end gap-3 border-b border-ha-line py-2.5 last:border-b-0"
              action={async (fd) => {
                const r = await addCxoSlots(cx.id, fd.get("count"));
                setToast(r.ok ? "slots added" : r.error ?? "nope");
              }}
            >
              <Avatar initials={initials(cx.name)} color={cx.avatar_color} />
              <span className="min-w-0 flex-1">
                <span className="block text-[13.5px] font-semibold">{cx.name}</span>
                <span className="block text-xs text-ha-muted">
                  {cx.title} · {cx.window_label} · {cx.slots_remaining} slots
                </span>
              </span>
              <TextField
                name="count"
                label="slots"
                type="number"
                min={1}
                max={20}
                defaultValue={1}
                className="w-24"
              />
              <Button type="submit">add slots</Button>
            </form>
          ))
        )}
      </div>
      <Toast message={toast} />
    </div>
  );
}
