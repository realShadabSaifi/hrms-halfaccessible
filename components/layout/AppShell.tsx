"use client";

import { usePathname } from "next/navigation";
import { getNavItems } from "@/lib/layout/navItems";
import type { AppSettings, Profile } from "@/lib/types";
import { HeaderActionsProvider } from "./HeaderActions";
import { PageHeader } from "./PageHeader";
import { Sidebar } from "./Sidebar";
import { MobileNav } from "./MobileNav";
import { PushSync } from "./PushSync";
import styles from "./AppShell.module.scss";

export function AppShell({
  profile,
  unread,
  unreadChat = 0,
  settings,
  children,
}: {
  profile: Profile;
  unread: number;
  unreadChat?: number;
  settings: AppSettings;
  children: React.ReactNode;
}) {
  const pathname = usePathname();
  const items = getNavItems(profile.role, unread, unreadChat);

  return (
    <HeaderActionsProvider>
      <PushSync role={profile.role} />
      <div className={styles.shell}>
        <Sidebar profile={profile} unread={unread} unreadChat={unreadChat} settings={settings} />
        <main id="main" className={styles.main}>
          <PageHeader pathname={pathname} role={profile.role} settings={settings} />
          {children}
        </main>
        <MobileNav items={items} />
      </div>
    </HeaderActionsProvider>
  );
}
