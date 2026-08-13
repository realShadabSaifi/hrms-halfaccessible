import type { ButtonHTMLAttributes } from "react";
import styles from "./Button.module.scss";

export type ButtonVariant = "primary" | "ghost" | "danger" | "success";

export function Button({
  variant = "primary",
  className = "",
  children,
  type = "button",
  ...props
}: ButtonHTMLAttributes<HTMLButtonElement> & {
  variant?: ButtonVariant;
}) {
  return (
    <button
      type={type}
      className={`${styles.root} ${styles[variant]} ${className}`}
      {...props}
    >
      {children}
    </button>
  );
}
