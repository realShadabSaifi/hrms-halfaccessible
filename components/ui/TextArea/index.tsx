import type { TextareaHTMLAttributes, ReactNode } from "react";
import styles from "./TextArea.module.scss";

export function TextArea({
  label,
  hint,
  error,
  id,
  className = "",
  ...props
}: TextareaHTMLAttributes<HTMLTextAreaElement> & {
  label?: ReactNode;
  hint?: string;
  error?: string;
}) {
  const inputId = id ?? (typeof label === "string" ? label : undefined);
  return (
    <label className={`${styles.wrap} ${className}`} htmlFor={inputId}>
      {label ? <span className={styles.label}>{label}</span> : null}
      <textarea id={inputId} className={styles.input} {...props} />
      {error ? (
        <span className={styles.error}>{error}</span>
      ) : hint ? (
        <span className={styles.hint}>{hint}</span>
      ) : null}
    </label>
  );
}
