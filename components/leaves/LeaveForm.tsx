"use client";

import { useState } from "react";
import { Button } from "@/components/ui/Button";
import { Chip } from "@/components/ui/Chip";
import { TextArea } from "@/components/ui/TextArea";
import { TextField } from "@/components/ui/TextField";
import { Toggle } from "@/components/ui/Toggle";
import { Toast } from "@/components/ui/Toast";
import { submitLeave } from "@/app/(portal)/leaves/actions";
import { LEAVE_TYPES } from "@/lib/validators/leave";
import type { LeaveType } from "@/lib/types";
import styles from "./LeaveForm.module.scss";

export function LeaveForm() {
  const [type, setType] = useState<LeaveType>("personal");
  const [emergency, setEmergency] = useState(false);
  const [toast, setToast] = useState<string | null>(null);
  const skipHandoff = emergency || type === "emergency";
  const note = LEAVE_TYPES.find((t) => t.type === type)?.note ?? "";

  async function onSubmit(formData: FormData) {
    const result = await submitLeave({
      type,
      startsOn: String(formData.get("from") ?? ""),
      endsOn: String(formData.get("to") ?? ""),
      reason: String(formData.get("reason") ?? ""),
      handoff: String(formData.get("handoff") ?? ""),
      emergency,
    });
    setToast(result.ok ? "leave sent. go live your life." : result.error);
  }

  return (
    <form action={onSubmit} className={styles.card}>
      <div className={styles.title}>request a leave 📝</div>
      <div className="mb-2 text-[11.5px] font-bold uppercase tracking-wider text-[rgba(28,28,46,0.55)]">
        type
      </div>
      <div className={styles.chips}>
        {LEAVE_TYPES.map((t) => (
          <Chip key={t.type} active={type === t.type} onClick={() => setType(t.type)}>
            {t.emoji} {t.name}
          </Chip>
        ))}
      </div>
      <p className={styles.note}>{note}</p>
      <div className={styles.dates}>
        <TextField label="from" name="from" type="date" required />
        <TextField label="to" name="to" type="date" required />
      </div>
      <TextField
        label={
          <>
            reason <span className="font-medium normal-case">(optional, we&apos;re not the police)</span>
          </>
        }
        name="reason"
        placeholder="e.g. cousin's wedding, will be offline (blissfully)"
      />
      <div className="my-3">
        <Toggle
          checked={emergency}
          onChange={setEmergency}
          label="emergency mode"
          hint="just go. inform later. handoff skipped - zero compromise."
        />
      </div>
      {!skipHandoff ? (
        <TextArea
          label="handoff notes"
          name="handoff"
          rows={3}
          placeholder="who's covering what while you're gone?"
        />
      ) : null}
      <Button type="submit" className="mt-4 w-full">
        send it
      </Button>
      <Toast message={toast} />
    </form>
  );
}
