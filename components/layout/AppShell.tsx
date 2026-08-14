"use client";

import { usePathname } from "next/navigation";
import { getNavItems } from "@/lib/layout/navItems";
import type { AppSettings, Profile } from "@/lib/types";
import { PageHeader } from "./PageHeader";
import { Sidebar } from "./Sidebar";
import { MobileNav } from "./MobileNav";
import styles from "./AppShell.module.scss";

export function AppShell({
  profile,
  unread,
  settings,
  children,
}: {
  profile: Profile;
  unread: number;
  settings: AppSettings;
  children: React.ReactNode;
}) {
  const pathname = usePathname();
  const items = getNavItems(profile.role, unread);

  return (
    <div className={styles.shell}>
      <Sidebar profile={profile} unread={unread} settings={settings} />
      <div id="main" className={styles.main}>
        <PageHeader pathname={pathname} role={profile.role} settings={settings} />
        {children}
      </div>
      <MobileNav items={items} />
    </div>
  );
}
