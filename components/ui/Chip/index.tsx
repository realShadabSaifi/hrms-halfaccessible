import type { ButtonHTMLAttributes } from "react";
import styles from "./Chip.module.scss";

export function Chip({
  active = false,
  className = "",
  children,
  type = "button",
  ...props
}: ButtonHTMLAttributes<HTMLButtonElement> & { active?: boolean }) {
  return (
    <button
      type={type}
      className={`${styles.root} ${active ? styles.active : ""} ${className}`}
      aria-pressed={active}
      {...props}
    >
      {children}
    </button>
  );
}
