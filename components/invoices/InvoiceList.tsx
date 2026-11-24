"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { Receipt } from "@phosphor-icons/react";
import { HeaderActions } from "@/components/layout/HeaderActions";
import { Chip } from "@/components/ui/Chip";
import { EmptyState } from "@/components/ui/EmptyState";
import type { InvoiceRow, InvoiceStatus } from "@/lib/invoices/data";
import { formatMoney } from "@/lib/invoices/money";
import { InvoiceBadge, isOverdue } from "./status";

type Row = InvoiceRow & { client_name: string };
type Filter = "all" | InvoiceStatus | "overdue";

const FILTERS: { id: Filter; label: string }[] = [
  { id: "all", label: "all" },
  { id: "draft", label: "drafts" },
  { id: "issued", label: "unpaid" },
  { id: "overdue", label: "overdue" },
  { id: "paid", label: "paid" },
  { id: "cancelled", label: "cancelled" },
];

/** Sum per currency, e.g. "INR 2,12,400.00 · USD 5,000.00". */
function sumByCurrency(rows: Row[]) {
  const m = new Map<string, number>();
  for (const r of rows) m.set(r.currency, (m.get(r.currency) ?? 0) + r.total);
  return [...m].map(([c, v]) => formatMoney(v, c)).join(" · ") || "-";
}

export function InvoiceList({ rows, today, companyReady }: { rows: Row[]; today: string; companyReady: boolean }) {
  const [filter, setFilter] = useState<Filter>("all");
  const [q, setQ] = useState("");
  const newButton = useMemo(
    () => (
      <Link href="/invoices/new" className="inline-flex min-h-11 items-center rounded-ha-md bg-ha-accent px-5 text-[14px] font-bold text-white! no-underline hover:bg-ha-accent-hover">
        new invoice
      </Link>
    ),
    [],
  );

  const unpaid = rows.filter((r) => r.status === "issued");
  const overdue = unpaid.filter((r) => isOverdue(r.status, r.due_date, today));
  const fyStart = `${Number(today.slice(5, 7)) < 4 ? Number(today.slice(0, 4)) - 1 : today.slice(0, 4)}-04-01`;
  const paidThisYear = rows.filter((r) => r.status === "paid" && r.invoice_date >= fyStart);

  const visible = rows.filter((r) => {
    if (filter === "overdue" ? !isOverdue(r.status, r.due_date, today) : filter !== "all" && r.status !== filter) return false;
    const s = q.trim().toLowerCase();
    return !s || `${r.number ?? ""} ${r.client_name}`.toLowerCase().includes(s);
  });

  return (
    <div className="grid min-w-0 gap-5 [&>*]:min-w-0">
      <HeaderActions>{newButton}</HeaderActions>
      {!companyReady ? (
        <p className="rounded-ha-md border border-ha-line bg-ha-accent-wash px-4 py-3 text-[13px]">
          first time here? fill in{" "}
          <Link href="/invoices/company" className="font-bold text-ha-accent-text">
            company details
          </Link>{" "}
          and add a{" "}
          <Link href="/invoices/clients" className="font-bold text-ha-accent-text">
            client
          </Link>
          , then create your first invoice.
        </p>
      ) : null}

      <div className="grid gap-4 md:grid-cols-3">
        {[
          { label: "unpaid", value: sumByCurrency(unpaid), sub: `${unpaid.length} invoice${unpaid.length === 1 ? "" : "s"}` },
          { label: "overdue", value: sumByCurrency(overdue), sub: `${overdue.length} past due date` },
          { label: "paid this financial year", value: sumByCurrency(paidThisYear), sub: `since ${fyStart}` },
        ].map((s) => (
          <div key={s.label} className="rounded-ha-lg border border-ha-line bg-ha-surface p-5 shadow-[var(--ha-shadow-card)]">
            <div className="text-xs font-bold uppercase tracking-wider text-ha-muted">{s.label}</div>
            <div className="mt-2 font-[family-name:var(--font-display)] text-xl font-bold text-ha-accent-text">{s.value}</div>
            <div className="text-xs text-ha-muted">{s.sub}</div>
          </div>
        ))}
      </div>

      <div className="rounded-ha-lg border border-ha-line bg-ha-surface p-[22px] shadow-[var(--ha-shadow-card)]">
        <div className="mb-4 flex flex-wrap items-center gap-2">
          <div role="group" aria-label="filter by status" className="flex flex-wrap gap-1.5">
            {FILTERS.map((f) => (
              <Chip key={f.id} active={filter === f.id} onClick={() => setFilter(f.id)}>
                {f.label}
              </Chip>
            ))}
          </div>
          <input
            type="search"
            aria-label="search invoices"
            placeholder="search number or client…"
            value={q}
            onChange={(e) => setQ(e.target.value)}
            className="ml-auto min-h-10 w-full max-w-[260px] rounded-ha-md border border-ha-line bg-ha-surface px-3 text-[13px]"
          />
        </div>
        {visible.length === 0 ? (
          <EmptyState icon={<Receipt size={28} />} title={rows.length ? "nothing matches" : "no invoices yet"} body={rows.length ? undefined : "use “new invoice” to bill your first client."} />
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full min-w-[640px] text-[13px]">
              <thead>
                <tr className="text-left text-xs font-bold uppercase tracking-wider text-ha-muted">
                  <th className="p-2" scope="col">number</th>
                  <th className="p-2" scope="col">client</th>
                  <th className="p-2" scope="col">date</th>
                  <th className="p-2" scope="col">due</th>
                  <th className="p-2 text-right" scope="col">total</th>
                  <th className="p-2" scope="col">status</th>
                </tr>
              </thead>
              <tbody>
                {visible.map((r) => (
                  <tr key={r.id} className="border-t border-ha-line hover:bg-ha-bg">
                    <td className="p-2">
                      <Link href={`/invoices/${r.id}`} className="font-bold text-ha-accent-text">
                        {r.number ?? "draft"}
                      </Link>
                    </td>
                    <td className="p-2">{r.client_name || "-"}</td>
                    <td className="p-2 tabular-nums">{r.invoice_date}</td>
                    <td className="p-2 tabular-nums">{r.due_date}</td>
                    <td className="p-2 text-right tabular-nums">{formatMoney(r.total, r.currency)}</td>
                    <td className="p-2">
                      <InvoiceBadge status={r.status} overdue={isOverdue(r.status, r.due_date, today)} />
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
