"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { motion, useReducedMotion } from "motion/react";
import {
  CalendarBlank,
  CaretLeft,
  CaretRight,
  Crown,
  Detective,
  GearSix,
  Hamburger,
  House,
  Leaf,
  Megaphone,
  ShieldCheck,
  Sparkle,
  Users,
} from "@phosphor-icons/react";
import { signOut } from "@/app/login/signOut";
import { Avatar } from "@/components/ui/Avatar";
import { initials } from "@/lib/names";
import { getNavItems } from "@/lib/layout/navItems";
import { readSidebarCollapsed, writeSidebarCollapsed } from "@/lib/layout/sidebarCollapsed";
import type { AppSettings, Profile } from "@/lib/types";
import { BrandLockup } from "./BrandLockup";
import styles from "./Sidebar.module.scss";

const icons: Record<string, React.ComponentType<{ size?: number }>> = {
  dash: House,
  leaves: Leaf,
  holidays: CalendarBlank,
  burgers: Hamburger,
  anon: Detective,
  team: Users,
  culture: Sparkle,
  ann: Megaphone,
  users: ShieldCheck,
  settings: GearSix,
  cxo: Crown,
};

export function Sidebar({
  profile,
  unread,
  settings,
}: {
  profile: Profile;
  unread: number;
  settings: AppSettings;
}) {
  const pathname = usePathname();
  const reduce = useReducedMotion();
  const items = getNavItems(profile.role, unread);
  const [collapsed, setCollapsed] = useState(false);

  useEffect(() => {
    setCollapsed(readSidebarCollapsed(window.localStorage));
  }, []);

  function toggle() {
    setCollapsed((current) => {
      const next = !current;
      writeSidebarCollapsed(window.localStorage, next);
      return next;
    });
  }

  return (
    <aside className={`${styles.sidebar} ${collapsed ? styles.collapsed : ""}`}>
      <div className={styles.top}>
        <div className={styles.brand}>
          <BrandLockup
            name={settings.app_name}
            logoUrl={settings.logo_url}
            tagline="the portal ✨ no corporate BS"
            size="nav"
            compact={collapsed}
          />
        </div>
        <button
          type="button"
          className={styles.toggle}
          aria-expanded={!collapsed}
          aria-controls="portal-nav"
          aria-label={collapsed ? "expand sidebar" : "collapse sidebar"}
          onClick={toggle}
        >
          {collapsed ? <CaretRight size={16} weight="bold" /> : <CaretLeft size={16} weight="bold" />}
        </button>
      </div>
      <nav id="portal-nav" aria-label="portal">
        {items.map((item) => {
          const Icon = icons[item.id] ?? House;
          const active = pathname === item.href;
          return (
            <Link
              key={item.id}
              href={item.href}
              title={item.label}
              className={`${styles.link} ${active ? styles.active : ""}`}
            >
              {active ? (
                <motion.span
                  layoutId={reduce ? undefined : "nav-active"}
                  className={styles.pill}
                  transition={{ type: "spring", stiffness: 380, damping: 34 }}
                />
              ) : null}
              <Icon size={20} />
              <span className={styles.label}>{item.label}</span>
              {item.badge ? <span className={styles.badge}>{item.badge}</span> : null}
            </Link>
          );
        })}
      </nav>
      <div className={styles.spacer} />
      {process.env.NEXT_PUBLIC_DEV_ROLE_SWITCH === "1" ? (
        <div className={styles.dev}>viewing as {profile.role} (dev)</div>
      ) : null}
      <div className={styles.me}>
        <Avatar initials={initials(profile.full_name)} color={profile.avatar_color} />
        <div className={styles.meCopy}>
          <div className={styles.name}>{profile.full_name || "new human"}</div>
          <div className={styles.role}>{profile.role}</div>
          <form action={signOut}>
            <button type="submit" className={styles.logout}>
              log out
            </button>
          </form>
        </div>
      </div>
    </aside>
  );
}
