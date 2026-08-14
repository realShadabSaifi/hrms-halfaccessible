import styles from "./BrandLockup.module.scss";

export function BrandLockup({
  name,
  logoUrl,
  tagline,
  size = "nav",
}: {
  name: string;
  logoUrl: string | null;
  tagline?: string;
  size?: "nav" | "auth" | "header";
}) {
  return (
    <div className={`${styles.brand} ${styles[size]}`}>
      <div className={styles.row}>
        {logoUrl ? (
          // decorative; the visible name is the accessible label
          // eslint-disable-next-line @next/next/no-img-element
          <img src={logoUrl} alt="" className={styles.mark} />
        ) : null}
        <div className={styles.name}>{name}</div>
      </div>
      {tagline ? <div className={styles.tag}>{tagline}</div> : null}
    </div>
  );
}
