import type { ButtonHTMLAttributes } from "react";
import styles from "./Button.module.scss";

export type ButtonVariant = "primary" | "ghost" | "danger" | "success";

export function Button({
  variant = "primary",
  className = "",
  children,
  type = "button",
  pending = false,
  disabled,
  ...props
}: ButtonHTMLAttributes<HTMLButtonElement> & {
  variant?: ButtonVariant;
  pending?: boolean;
}) {
  return (
    <button
      type={type}
      className={`${styles.root} ${styles[variant]} ${className}`}
      disabled={disabled || pending}
      aria-busy={pending || undefined}
      {...props}
    >
      {children}
    </button>
  );
}
