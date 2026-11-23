import type { ProfileRole } from "@/lib/types";

export type NavItem = {
  href: string;
  id: string;
  label: string;
  title: string;
  sub: string;
};

const HOLIDAYS: NavItem = {
  id: "holidays",
  href: "/holidays",
  label: "holidays",
  title: "holiday calendar",
  sub: "official days off. marked by admin.",
};

const BASE: NavItem[] = [
  { id: "dash", href: "/", label: "home", title: "home", sub: "the daily download" },
  {
    id: "chat",
    href: "/chat",
    label: "chat",
    title: "chat",
    sub: "dms and groups. no slack tax.",
  },
  {
    id: "leaves",
    href: "/leaves",
    label: "leaves",
    title: "leaves",
    sub: "inform → handoff → go. that's it.",
  },
  {
    id: "attendance",
    href: "/attendance",
    label: "attendance",
    title: "attendance",
    sub: "every punch in and out.",
  },
  HOLIDAYS,
  {
    id: "burgers",
    href: "/burgers",
    label: "burger holidays",
    title: "burger holidays 🍔",
    sub: "democracy, but delicious",
  },
  {
    id: "anon",
    href: "/anon",
    label: "anonymous board",
    title: "anonymous board",
    sub: "read at your own risk",
  },
  {
    id: "team",
    href: "/team",
    label: "people",
    title: "people",
    sub: "people, zero corporate energy",
  },
  {
    id: "cxo",
    href: "/cxo",
    label: "talk to CXOs",
    title: "talk to CXOs",
    sub: "rare. but real. no gatekeepers.",
  },
  {
    id: "culture",
    href: "/culture",
    label: "culture & parties",
    title: "culture & parties",
    sub: "the fun budget, democratized",
  },
  {
    id: "ann",
    href: "/announcements",
    label: "announcements",
    title: "announcements",
    sub: "the official-ish stuff",
  },
];

const USERS: NavItem = {
  id: "users",
  href: "/users",
  label: "user management",
  title: "user management",
  sub: "admin only. handle with care 🧤",
};

const CXO_WINDOWS: NavItem = {
  id: "cxo-windows",
  href: "/cxo/manage",
  label: "CXO slots",
  title: "CXO slots",
  sub: "add time slots for people to book.",
};

const SETTINGS: NavItem = {
  id: "settings",
  href: "/settings",
  label: "settings",
  title: "settings",
  sub: "name, logo, office location.",
};

export function getNavItems(
  role: ProfileRole,
  unreadAnnouncements = 0,
  unreadChat = 0,
): (NavItem & { badge: number | null })[] {
  const items =
    role === "super_admin"
      ? [SETTINGS, USERS, HOLIDAYS]
      : role === "admin" || role === "cxo"
        ? [...BASE, USERS, CXO_WINDOWS]
        : BASE;
  return items.map((item) => ({
    ...item,
    badge:
      item.id === "ann" && unreadAnnouncements > 0
        ? unreadAnnouncements
        : item.id === "chat" && unreadChat > 0
          ? unreadChat
          : null,
  }));
}

export function pageMeta(pathname: string, role: ProfileRole) {
  const items = getNavItems(role);
  return (
    items.find((i) => i.href === pathname) ??
    items.find((i) => i.href !== "/" && pathname.startsWith(`${i.href}/`)) ??
    items[0]
  );
}
