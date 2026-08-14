"use client";

import { useState } from "react";
import { addDepartment, removeDepartment, renameDepartment } from "@/app/(portal)/users/actions";
import { Button } from "@/components/ui/Button";
import { TextField } from "@/components/ui/TextField";
import type { Department } from "@/lib/types";

export function DepartmentsCard({
  departments,
  onToast,
}: {
  departments: Department[];
  onToast: (message: string) => void;
}) {
  const [next, setNext] = useState("");
  const [drafts, setDrafts] = useState<Record<string, string>>({});

  return (
    <div className="rounded-ha-lg border border-ha-line bg-ha-surface p-6 shadow-[var(--ha-shadow-card)]">
      <div className="font-[family-name:var(--font-display)] text-[17px] font-bold">departments</div>
      <p className="mb-4 text-xs text-ha-muted">the list everyone picks from. move people before you remove one.</p>
      {departments.map((d) => {
        const value = drafts[d.id] ?? d.name;
        return (
          <div key={d.id} className="mb-3 flex flex-wrap items-end gap-2">
            <TextField
              id={`dept-${d.id}`}
              label="name"
              value={value}
              onChange={(e) => setDrafts({ ...drafts, [d.id]: e.target.value })}
              className="min-w-[160px] flex-1"
            />
            <Button
              variant="ghost"
              onClick={async () => {
                const r = await renameDepartment(d.id, value);
                onToast(r.ok ? "renamed." : r.error ?? "nope");
              }}
            >
              rename
            </Button>
            <Button
              variant="ghost"
              onClick={async () => {
                const r = await removeDepartment(d.id);
                onToast(r.ok ? "removed." : r.error ?? "nope");
              }}
            >
              remove
            </Button>
          </div>
        );
      })}
      <div className="mt-4 flex flex-wrap items-end gap-2 border-t border-ha-line pt-4">
        <TextField
          id="new-department"
          label="new department"
          value={next}
          onChange={(e) => setNext(e.target.value)}
          className="min-w-[160px] flex-1"
        />
        <Button
          onClick={async () => {
            const r = await addDepartment(next);
            if (!r.ok) {
              onToast(r.error ?? "nope");
              return;
            }
            setNext("");
            onToast("added.");
          }}
        >
          add department
        </Button>
      </div>
    </div>
  );
}
