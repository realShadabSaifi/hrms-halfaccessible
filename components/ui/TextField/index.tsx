import type { InputHTMLAttributes, ReactNode } from "react";
import styles from "./TextField.module.scss";

export function TextField({
  label,
  hint,
  error,
  id,
  className = "",
  ...props
}: InputHTMLAttributes<HTMLInputElement> & {
  label: ReactNode;
  hint?: string;
  error?: string;
}) {
  const inputId = id ?? (typeof label === "string" ? label : undefined);
  return (
    <label className={`${styles.wrap} ${className}`} htmlFor={inputId}>
      <span className={styles.label}>{label}</span>
      <input id={inputId} className={styles.input} {...props} />
      {error ? (
        <span className={styles.error}>{error}</span>
      ) : hint ? (
        <span className={styles.hint}>{hint}</span>
      ) : null}
    </label>
  );
}
