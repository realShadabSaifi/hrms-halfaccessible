import type { ButtonHTMLAttributes } from "react";
import styles from "./Button.module.scss";

export type ButtonVariant = "primary" | "ghost" | "danger" | "success";

export function Button({
  variant = "primary",
  shape = "default",
  className = "",
  children,
  type = "button",
  pending = false,
  disabled,
  ...props
}: ButtonHTMLAttributes<HTMLButtonElement> & {
  variant?: ButtonVariant;
  shape?: "default" | "auth";
  pending?: boolean;
}) {
  return (
    <button
      type={type}
      className={`${styles.root} ${styles[variant]} ${shape === "auth" ? styles.auth : ""} ${className}`}
      disabled={disabled || pending}
      aria-busy={pending || undefined}
      {...props}
    >
      {children}
    </button>
  );
}
