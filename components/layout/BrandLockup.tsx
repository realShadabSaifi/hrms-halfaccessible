import styles from "./BrandLockup.module.scss";

export function BrandLockup({
  name,
  logoUrl,
  tagline,
  size = "nav",
  compact = false,
}: {
  name: string;
  logoUrl: string | null;
  tagline?: string;
  size?: "nav" | "auth" | "header";
  compact?: boolean;
}) {
  return (
    <div
      className={`${styles.brand} ${styles[size]} ${compact ? styles.compact : ""}`}
      aria-label={compact ? name : undefined}
    >
      <div className={styles.row}>
        {logoUrl ? (
          // decorative; the visible name is the accessible label
          // eslint-disable-next-line @next/next/no-img-element
          <img src={logoUrl} alt="" className={styles.mark} />
        ) : compact ? (
          <span aria-hidden className={styles.initial}>
            {name.trim().slice(0, 1) || "h"}
          </span>
        ) : null}
        <div className={styles.name}>{name}</div>
      </div>
      {tagline && !compact ? <div className={styles.tag}>{tagline}</div> : null}
    </div>
  );
}
