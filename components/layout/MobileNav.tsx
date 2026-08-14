"use client";

import { useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  Crown,
  Detective,
  DotsThree,
  GearSix,
  Hamburger,
  House,
  Leaf,
  Megaphone,
  ShieldCheck,
  Sparkle,
  Users,
  X,
} from "@phosphor-icons/react";
import type { getNavItems } from "@/lib/layout/navItems";
import styles from "./MobileNav.module.scss";

const PRIMARY = new Set(["dash", "leaves", "burgers", "anon"]);

const icons: Record<string, React.ComponentType<{ size?: number }>> = {
  dash: House,
  leaves: Leaf,
  burgers: Hamburger,
  anon: Detective,
  team: Users,
  culture: Sparkle,
  ann: Megaphone,
  users: ShieldCheck,
  settings: GearSix,
  cxo: Crown,
};

type Item = ReturnType<typeof getNavItems>[number];

export function MobileNav({ items }: { items: Item[] }) {
  const pathname = usePathname();
  const [open, setOpen] = useState(false);
  const primary = items.filter((i) => PRIMARY.has(i.id));
  const more = items.filter((i) => !PRIMARY.has(i.id));
  const moreActive = more.some((i) => i.href === pathname);

  if (primary.length === 0) {
    return (
      <nav className={styles.wrap} aria-label="mobile">
        <div className={styles.bar}>
          {items.map((item) => {
            const Icon = icons[item.id] ?? House;
            const active = pathname === item.href;
            return (
              <Link
                key={item.id}
                href={item.href}
                className={`${styles.tab} ${active ? styles.tabActive : ""}`}
              >
                <Icon size={20} />
                <span>{item.label}</span>
              </Link>
            );
          })}
        </div>
      </nav>
    );
  }

  return (
    <nav className={styles.wrap} aria-label="mobile">
      {open ? (
        <div className={styles.sheet}>
          <div className={styles.sheetHead}>
            <span>more</span>
            <button type="button" className={styles.close} onClick={() => setOpen(false)} aria-label="close menu">
              <X size={18} />
            </button>
          </div>
          {more.map((item) => {
            const Icon = icons[item.id] ?? House;
            const active = pathname === item.href;
            return (
              <Link
                key={item.id}
                href={item.href}
                className={`${styles.sheetLink} ${active ? styles.sheetActive : ""}`}
                onClick={() => setOpen(false)}
              >
                <Icon size={18} />
                <span style={{ flex: 1 }}>{item.label}</span>
                {item.badge ? <span className={styles.badge}>{item.badge}</span> : null}
              </Link>
            );
          })}
        </div>
      ) : null}
      <div className={styles.bar}>
        {primary.map((item) => {
          const Icon = icons[item.id] ?? House;
          const active = pathname === item.href;
          return (
            <Link
              key={item.id}
              href={item.href}
              className={`${styles.tab} ${active ? styles.tabActive : ""}`}
              onClick={() => setOpen(false)}
            >
              <Icon size={20} />
              <span>{item.label}</span>
              {item.badge ? <span className={styles.dot} /> : null}
            </Link>
          );
        })}
        <button
          type="button"
          className={`${styles.tab} ${moreActive || open ? styles.tabActive : ""}`}
          aria-expanded={open}
          onClick={() => setOpen((v) => !v)}
        >
          <DotsThree size={20} />
          <span>more</span>
        </button>
      </div>
    </nav>
  );
}
