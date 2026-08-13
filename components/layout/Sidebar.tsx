"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { motion, useReducedMotion } from "motion/react";
import {
  Crown,
  Detective,
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
import type { Profile } from "@/lib/types";
import styles from "./Sidebar.module.scss";

const icons: Record<string, React.ComponentType<{ size?: number }>> = {
  dash: House,
  leaves: Leaf,
  burgers: Hamburger,
  anon: Detective,
  team: Users,
  culture: Sparkle,
  ann: Megaphone,
  users: ShieldCheck,
  cxo: Crown,
};

export function Sidebar({
  profile,
  unread,
}: {
  profile: Profile;
  unread: number;
}) {
  const pathname = usePathname();
  const reduce = useReducedMotion();
  const items = getNavItems(profile.role, unread);

  return (
    <aside className={styles.sidebar}>
      <div className={styles.brand}>
        <div className={styles.logo}>halfAccessible</div>
        <div className={styles.tag}>the portal ✨ no corporate BS</div>
      </div>
      {items.map((item) => {
        const Icon = icons[item.id] ?? House;
        const active = pathname === item.href;
        return (
          <Link
            key={item.id}
            href={item.href}
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
            <span style={{ flex: 1 }}>{item.label}</span>
            {item.badge ? <span className={styles.badge}>{item.badge}</span> : null}
          </Link>
        );
      })}
      <div className={styles.spacer} />
      {process.env.NEXT_PUBLIC_DEV_ROLE_SWITCH === "1" ? (
        <div className={styles.dev}>viewing as {profile.role} (dev)</div>
      ) : null}
      <div className={styles.me}>
        <Avatar initials={initials(profile.full_name)} color={profile.avatar_color} />
        <div>
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
