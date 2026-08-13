import { pageMeta } from "@/lib/layout/navItems";
import type { ProfileRole } from "@/lib/types";
import styles from "./PageHeader.module.scss";

export function PageHeader({
  pathname,
  role,
}: {
  pathname: string;
  role: ProfileRole;
}) {
  const meta = pageMeta(pathname, role);
  return (
    <div className={styles.header}>
      <h1 className={styles.title}>{meta.title}</h1>
      <p className={styles.sub}>{meta.sub}</p>
    </div>
  );
}
