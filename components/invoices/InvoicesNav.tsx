"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

const TABS = [
  { href: "/invoices", label: "invoices", match: (p: string) => p === "/invoices" || /^\/invoices\/(new|[0-9a-f-]{36})/.test(p) },
  { href: "/invoices/clients", label: "clients", match: (p: string) => p.startsWith("/invoices/clients") },
  { href: "/invoices/company", label: "company details", match: (p: string) => p.startsWith("/invoices/company") },
];

export function InvoicesNav() {
  const path = usePathname();
  return (
    <nav aria-label="invoices section" className="mb-5 flex flex-wrap gap-2">
      {TABS.map((t) => {
        const active = t.match(path);
        return (
          <Link
            key={t.href}
            href={t.href}
            aria-current={active ? "page" : undefined}
            className={`inline-flex min-h-10 items-center rounded-full border px-4 text-[13px] font-bold no-underline transition-colors ${
              active
                ? "border-ha-accent bg-ha-accent text-white!"
                : "border-ha-line bg-ha-surface text-ha-ink! hover:bg-ha-accent-wash"
            }`}
          >
            {t.label}
          </Link>
        );
      })}
    </nav>
  );
}
