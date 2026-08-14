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
      {logoUrl ? (
        // decorative; the visible name is the accessible label
        <img src={logoUrl} alt="" className={styles.mark} />
      ) : null}
      <div>
        <div className={styles.name}>{name}</div>
        {tagline ? <div className={styles.tag}>{tagline}</div> : null}
      </div>
    </div>
  );
}
