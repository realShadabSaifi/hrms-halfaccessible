import styles from "./Avatar.module.scss";

export function Avatar({
  initials,
  color,
  size = "md",
  className = "",
}: {
  initials: string;
  color: string;
  size?: "sm" | "md" | "lg";
  className?: string;
}) {
  return (
    <span
      className={`${styles.root} ${styles[size]} ${className}`}
      style={{ background: color }}
      aria-hidden="true"
    >
      {initials}
    </span>
  );
}
