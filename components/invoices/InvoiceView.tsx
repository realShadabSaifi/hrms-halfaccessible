"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { DownloadSimple } from "@phosphor-icons/react";
import { cancelInvoice, duplicateInvoice, markPaid } from "@/app/(portal)/invoices/actions";
import { Button } from "@/components/ui/Button";
import { Toast } from "@/components/ui/Toast";
import type { InvoiceItem, InvoiceRow } from "@/lib/invoices/data";
import { amountInWords, formatMoney } from "@/lib/invoices/money";
import { placeOfSupplyLabel } from "@/lib/invoices/reference";
import { APP_TIME_ZONE } from "@/lib/time";
import { Panel } from "./fields";
import { InvoiceBadge, isOverdue } from "./status";

const when = (iso: string | null) =>
  iso ? new Date(iso).toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric", timeZone: APP_TIME_ZONE }) : "";

export function InvoiceView({ invoice, items, justIssued, today }: { invoice: InvoiceRow; items: InvoiceItem[]; justIssued: boolean; today: string }) {
  const router = useRouter();
  const [toast, setToast] = useState<string | null>(justIssued ? `issued as ${invoice.number}.` : null);
  const [pending, start] = useTransition();
  const cur = invoice.currency;
  const client = invoice.client_snapshot;
  const act = (fn: () => Promise<{ ok: boolean; error?: string }>, msg: string) =>
    start(async () => {
      const r = await fn();
      setToast(r.ok ? msg : (r.error ?? "nope"));
      if (r.ok) router.refresh();
    });

  return (
    <div className="grid min-w-0 max-w-[1000px] gap-5 [&>*]:min-w-0">
      <div className="flex flex-wrap items-center gap-3">
        <h2 className="font-[family-name:var(--font-display)] text-2xl font-bold">{invoice.number}</h2>
        <InvoiceBadge status={invoice.status} overdue={isOverdue(invoice.status, invoice.due_date, today)} />
        <div className="ml-auto flex flex-wrap gap-2">
          <a
            href={`/api/invoices/${invoice.id}/pdf?download=1`}
            className="inline-flex min-h-11 items-center gap-2 rounded-ha-md bg-ha-accent px-5 text-[14px] font-bold text-white! no-underline hover:bg-ha-accent-hover"
          >
            <DownloadSimple size={18} weight="bold" /> download PDF
          </a>
          {invoice.status === "issued" ? (
            <Button variant="success" pending={pending} onClick={() => act(() => markPaid(invoice.id, true), "marked as paid.")}>
              mark as paid
            </Button>
          ) : null}
          {invoice.status === "paid" ? (
            <Button variant="ghost" pending={pending} onClick={() => act(() => markPaid(invoice.id, false), "marked as unpaid.")}>
              mark as unpaid
            </Button>
          ) : null}
          <Button
            variant="ghost"
            pending={pending}
            onClick={() =>
              start(async () => {
                const r = await duplicateInvoice(invoice.id);
                if (!r.ok) setToast(r.error);
                else router.push(`/invoices/${r.id}`);
              })
            }
          >
            duplicate as new draft
          </Button>
        </div>
      </div>

      <div className="grid gap-5 md:grid-cols-2">
        <Panel title="bill to">
          <p className="text-[14px] font-bold">{client?.name}</p>
          <p className="whitespace-pre-line text-[13px]">{client?.address}</p>
          <p className="text-[13px]">{[client?.country, client?.pincode].filter(Boolean).join(" - ")}</p>
          {client?.gstin ? <p className="text-[13px]">GSTIN: {client.gstin}</p> : null}
          <p className="text-[13px]">place of supply: {placeOfSupplyLabel(invoice.place_of_supply)}</p>
        </Panel>
        <Panel title="details">
          <dl className="grid grid-cols-[auto_1fr] gap-x-4 gap-y-1 text-[13px]">
            <dt className="text-ha-muted">invoice date</dt><dd>{invoice.invoice_date}</dd>
            <dt className="text-ha-muted">due date</dt><dd>{invoice.due_date}</dd>
            <dt className="text-ha-muted">payment terms</dt><dd>{invoice.payment_terms}</dd>
            <dt className="text-ha-muted">currency</dt><dd>{cur}{invoice.fx_rate ? ` (1 ${cur} = ₹${invoice.fx_rate})` : ""}</dd>
            <dt className="text-ha-muted">issued</dt><dd>{when(invoice.issued_at)}</dd>
            {invoice.paid_at ? (<><dt className="text-ha-muted">paid</dt><dd>{when(invoice.paid_at)}</dd></>) : null}
            {invoice.cancelled_at ? (<><dt className="text-ha-muted">cancelled</dt><dd>{when(invoice.cancelled_at)}</dd></>) : null}
          </dl>
        </Panel>
      </div>

      <Panel title="items">
        <div className="overflow-x-auto">
          <table className="w-full min-w-[560px] text-[13px]">
            <thead>
              <tr className="bg-ha-bg text-left text-xs font-bold uppercase tracking-wider text-ha-muted">
                <th className="p-2" scope="col">#</th>
                <th className="p-2" scope="col">item</th>
                <th className="p-2" scope="col">qty</th>
                <th className="p-2 text-right" scope="col">rate</th>
                {cur === "INR" ? <th className="p-2 text-right" scope="col">GST</th> : null}
                <th className="p-2 text-right" scope="col">amount</th>
              </tr>
            </thead>
            <tbody>
              {items.map((it, i) => (
                <tr key={it.id ?? i} className="border-b border-ha-line align-top">
                  <td className="p-2">{i + 1}.</td>
                  <td className="p-2">
                    <div className="font-semibold">{it.name}</div>
                    {it.description ? <div className="text-ha-muted">{it.description}</div> : null}
                    {it.hsn_sac ? <div className="text-xs text-ha-muted">HSN/SAC {it.hsn_sac}</div> : null}
                  </td>
                  <td className="p-2">{it.qty}</td>
                  <td className="p-2 text-right tabular-nums">{formatMoney(it.rate, cur)}</td>
                  {cur === "INR" ? <td className="p-2 text-right">{it.gst_rate}%</td> : null}
                  <td className="p-2 text-right tabular-nums">{formatMoney(Math.round(it.qty * it.rate * 100) / 100, cur)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <dl className="ml-auto mt-4 grid max-w-[340px] gap-1.5 text-[13px]">
          {cur === "INR" ? (
            <>
              <div className="flex justify-between"><dt className="text-ha-muted">subtotal</dt><dd>{formatMoney(invoice.subtotal, cur)}</dd></div>
              {invoice.igst ? <div className="flex justify-between"><dt className="text-ha-muted">IGST</dt><dd>{formatMoney(invoice.igst, cur)}</dd></div> : null}
              {invoice.cgst ? <div className="flex justify-between"><dt className="text-ha-muted">CGST</dt><dd>{formatMoney(invoice.cgst, cur)}</dd></div> : null}
              {invoice.sgst ? <div className="flex justify-between"><dt className="text-ha-muted">SGST</dt><dd>{formatMoney(invoice.sgst, cur)}</dd></div> : null}
            </>
          ) : null}
          <div className="flex justify-between rounded-ha-md bg-[#0b2844] px-3 py-2.5 text-[15px] font-semibold text-white">
            <dt>total</dt>
            <dd>{formatMoney(invoice.total, cur)}</dd>
          </div>
        </dl>
        <p className="mt-2 text-right text-[13px] text-ha-muted">{amountInWords(invoice.total, cur)}</p>
      </Panel>

      {invoice.notes ? (
        <Panel title="notes">
          <p className="whitespace-pre-line text-[13px]">{invoice.notes}</p>
        </Panel>
      ) : null}

      {invoice.status === "issued" || invoice.status === "paid" ? (
        <div>
          <Button
            variant="danger"
            pending={pending}
            onClick={() => {
              if (!window.confirm(`cancel ${invoice.number}? it stays in the list as cancelled and its number is not reused.`)) return;
              act(() => cancelInvoice(invoice.id), "invoice cancelled.");
            }}
          >
            cancel invoice
          </Button>
          <p className="mt-1.5 text-xs text-ha-muted">issued invoices can&apos;t be edited or deleted, so numbers never have gaps. to fix one, cancel it and duplicate it.</p>
        </div>
      ) : null}
      <Toast message={toast} />
    </div>
  );
}
