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
    id: "leaves",
    href: "/leaves",
    label: "leaves",
    title: "leave management",
    sub: "inform → handoff → go. that's it.",
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
    label: "anon board",
    title: "the anon board",
    sub: "read at your own risk",
  },
  {
    id: "team",
    href: "/team",
    label: "the humans",
    title: "the humans",
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
  label: "CXO windows",
  title: "CXO windows",
  sub: "drop a window. add slots.",
};

const SETTINGS: NavItem = {
  id: "settings",
  href: "/settings",
  label: "portal config",
  title: "portal config",
  sub: "name, logo. the face of the portal.",
};

export function getNavItems(role: ProfileRole, unreadAnnouncements = 0): (NavItem & { badge: number | null })[] {
  const items =
    role === "super_admin" ? [SETTINGS, USERS, HOLIDAYS] : role === "admin" ? [...BASE, USERS, CXO_WINDOWS] : BASE;
  return items.map((item) => ({
    ...item,
    badge: item.id === "ann" && unreadAnnouncements > 0 ? unreadAnnouncements : null,
  }));
}

export function pageMeta(pathname: string, role: ProfileRole) {
  const items = getNavItems(role);
  return items.find((i) => i.href === pathname) ?? items[0];
}
