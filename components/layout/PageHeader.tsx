import { pageMeta } from "@/lib/layout/navItems";
import type { AppSettings, ProfileRole } from "@/lib/types";
import { BrandLockup } from "./BrandLockup";
import styles from "./PageHeader.module.scss";

export function PageHeader({
  pathname,
  role,
  settings,
}: {
  pathname: string;
  role: ProfileRole;
  settings: AppSettings;
}) {
  const meta = pageMeta(pathname, role);
  return (
    <div className={styles.header}>
      <div className={styles.mobileBrand}>
        <BrandLockup name={settings.app_name} logoUrl={settings.logo_url} size="header" />
      </div>
      <h1 className={styles.title}>{meta.title}</h1>
      <p className={styles.sub}>{meta.sub}</p>
    </div>
  );
}
