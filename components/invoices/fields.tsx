"use client";

import type { ReactNode, SelectHTMLAttributes } from "react";
import fieldStyles from "@/components/ui/TextField/TextField.module.scss";
import { CURRENCIES, GST_STATES } from "@/lib/invoices/reference";

/** Native select styled like TextField. */
export function SelectField({
  label,
  hint,
  id,
  children,
  className = "",
  ...props
}: SelectHTMLAttributes<HTMLSelectElement> & { label: ReactNode; hint?: string; id: string }) {
  // label and hint sit outside the <select> so its accessible name is just the label
  // (a select nested in its label also gets the selected option read into the name)
  const hintId = hint ? `${id}-hint` : undefined;
  return (
    <div className={`${fieldStyles.wrap} ${className}`}>
      <label className={fieldStyles.label} htmlFor={id}>
        {label}
      </label>
      <select id={id} className={fieldStyles.input} aria-describedby={hintId} {...props}>
        {children}
      </select>
      {hint ? (
        <span id={hintId} className={fieldStyles.hint}>
          {hint}
        </span>
      ) : null}
    </div>
  );
}

export function StateOptions({ includeOutside = true }: { includeOutside?: boolean }) {
  return (
    <>
      <option value="">choose…</option>
      {GST_STATES.filter((s) => includeOutside || s.code !== "96").map((s) => (
        <option key={s.code} value={s.code}>
          {s.name} ({s.code})
        </option>
      ))}
    </>
  );
}

export function CurrencyOptions() {
  return (
    <>
      {CURRENCIES.map((c) => (
        <option key={c.code} value={c.code}>
          {c.code} - {c.major}
        </option>
      ))}
    </>
  );
}

export function Panel({ title, sub, children, className = "" }: { title: string; sub?: string; children: ReactNode; className?: string }) {
  return (
    <section className={`min-w-0 rounded-ha-lg border border-ha-line bg-ha-surface p-[22px] shadow-[var(--ha-shadow-card)] ${className}`}>
      <h2 className="font-[family-name:var(--font-display)] text-base font-bold">{title}</h2>
      {sub ? <p className="mb-3.5 text-xs text-ha-muted">{sub}</p> : <div className="mb-3" />}
      {children}
    </section>
  );
}
