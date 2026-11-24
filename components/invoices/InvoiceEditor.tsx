"use client";

import { useMemo, useState, useTransition } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Plus, Trash } from "@phosphor-icons/react";
import { deleteDraft, issueInvoice, saveDraft } from "@/app/(portal)/invoices/actions";
import { Button } from "@/components/ui/Button";
import { TextArea } from "@/components/ui/TextArea";
import { TextField } from "@/components/ui/TextField";
import { Toast } from "@/components/ui/Toast";
import type { Client, Company } from "@/lib/invoices/data";
import { amountInWords, computeTotals, formatMoney } from "@/lib/invoices/money";
import { GST_RATES, OUTSIDE_INDIA } from "@/lib/invoices/reference";
import { type DraftInput, type ItemInput, issueBlocker, validateDraft } from "@/lib/invoices/validate";
import { ClientForm } from "./ClientsManager";
import { CurrencyOptions, Panel, SelectField, StateOptions } from "./fields";

const today = () => new Date().toISOString().slice(0, 10);
const blankItem = (): ItemInput => ({ name: "", description: "", hsn_sac: "", qty: 1, rate: 0, gst_rate: 18 });

type Row = Omit<ItemInput, "qty" | "rate" | "gst_rate"> & { key: number; qty: string; rate: string; gst_rate: string };

let keySeq = 0;
const toRow = (i: ItemInput): Row => ({
  ...i,
  key: ++keySeq,
  qty: String(i.qty),
  rate: i.rate ? String(i.rate) : "",
  gst_rate: String(i.gst_rate),
});

export function InvoiceEditor({
  id,
  initial,
  initialItems,
  clients,
  company,
}: {
  id: string | null;
  initial: Omit<DraftInput, "items"> | null;
  initialItems: ItemInput[];
  clients: Client[];
  company: Company;
}) {
  const router = useRouter();
  const [d, setD] = useState<Omit<DraftInput, "items">>(
    initial ?? {
      client_id: "",
      currency: "INR",
      fx_rate: null,
      invoice_date: today(),
      due_date: today(),
      payment_terms: company.default_terms || "Immediate",
      place_of_supply: "",
      notes: "",
    },
  );
  const [rows, setRows] = useState<Row[]>(() => (initialItems.length ? initialItems : [blankItem()]).map(toRow));
  const [fx, setFx] = useState(initial?.fx_rate ? String(initial.fx_rate) : "");
  const [addingClient, setAddingClient] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [toast, setToast] = useState<string | null>(null);
  const [pending, start] = useTransition();
  const inr = d.currency === "INR";

  const items: ItemInput[] = rows.map((r) => ({
    name: r.name,
    description: r.description,
    hsn_sac: r.hsn_sac,
    qty: Number(r.qty),
    rate: r.rate === "" ? 0 : Number(r.rate),
    gst_rate: inr ? Number(r.gst_rate) : 0,
  }));
  const input: DraftInput = { ...d, fx_rate: inr || fx.trim() === "" ? null : Number(fx), items };
  const totals = useMemo(
    () =>
      computeTotals(
        items.map((i) => ({ qty: Number.isFinite(i.qty) ? i.qty : 0, rate: Number.isFinite(i.rate) ? i.rate : 0, gst_rate: i.gst_rate || 0 })),
        { currency: d.currency, companyState: company.state_code, placeOfSupply: d.place_of_supply },
      ),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [JSON.stringify(items), d.currency, d.place_of_supply, company.state_code],
  );
  const blocker = issueBlocker(company, d.currency);

  function pickClient(clientId: string) {
    const c = clients.find((x) => x.id === clientId);
    setD({
      ...d,
      client_id: clientId,
      ...(c ? { currency: c.default_currency, place_of_supply: c.state_code } : {}),
    });
  }

  const setRow = (key: number, patch: Partial<Row>) => setRows(rows.map((r) => (r.key === key ? { ...r, ...patch } : r)));

  async function save(): Promise<string | null> {
    const err = validateDraft(input);
    if (err) {
      setError(err);
      return null;
    }
    setError(null);
    const r = await saveDraft(id, input);
    if (!r.ok) {
      setError(r.error);
      return null;
    }
    return r.id ?? id;
  }

  return (
    <form
      onSubmit={(e) => {
        e.preventDefault();
        start(async () => {
          const saved = await save();
          if (!saved) return;
          setToast("draft saved.");
          if (!id) router.replace(`/invoices/${saved}`);
          else router.refresh();
        });
      }}
      className="grid min-w-0 max-w-[1100px] gap-5 [&>*]:min-w-0"
    >
      {blocker ? (
        <p className="rounded-ha-md border border-ha-line bg-ha-accent-wash px-4 py-3 text-[13px]">
          {blocker}.{" "}
          <Link href="/invoices/company" className="font-bold text-ha-accent-text">
            open company details
          </Link>{" "}
          - you can still save this as a draft.
        </p>
      ) : null}

      <Panel title="bill to">
        <div className="grid gap-3 md:grid-cols-3">
          <SelectField
            id="inv-client"
            label="client"
            value={d.client_id}
            onChange={(e) => pickClient(e.target.value)}
            required
            className="md:col-span-2"
          >
            <option value="">{clients.length ? "choose a client…" : "no clients yet - add one"}</option>
            {clients.map((c) => (
              <option key={c.id} value={c.id}>
                {c.name}
              </option>
            ))}
          </SelectField>
          <div className="flex items-end">
            <Button variant="ghost" onClick={() => setAddingClient((v) => !v)} aria-expanded={addingClient}>
              {addingClient ? "close" : "+ new client"}
            </Button>
          </div>
        </div>
        {addingClient ? (
          <div className="mt-3 rounded-ha-md border border-ha-line bg-ha-bg p-4">
            <ClientForm
              id={null}
              initial={{ name: "", address: "", country: "India", pincode: "", state_code: "", gstin: "", email: "", default_currency: "INR" }}
              onDone={(m) => {
                setAddingClient(false);
                setToast(`${m} pick it from the list.`);
                router.refresh();
              }}
            />
          </div>
        ) : null}
      </Panel>

      <Panel title="invoice details">
        <div className="grid gap-3 md:grid-cols-3">
          <TextField id="inv-date" label="invoice date" type="date" value={d.invoice_date} onChange={(e) => setD({ ...d, invoice_date: e.target.value })} required />
          <TextField id="inv-due" label="due date" type="date" value={d.due_date} min={d.invoice_date} onChange={(e) => setD({ ...d, due_date: e.target.value })} required />
          <TextField id="inv-terms" label="payment terms" value={d.payment_terms} onChange={(e) => setD({ ...d, payment_terms: e.target.value })} />
          <SelectField id="inv-currency" label="currency" value={d.currency} onChange={(e) => setD({ ...d, currency: e.target.value })} hint={inr ? "GST applies" : "no GST on non-INR invoices"}>
            <CurrencyOptions />
          </SelectField>
          {!inr ? (
            <TextField
              id="inv-fx"
              label={`INR per 1 ${d.currency} (optional)`}
              inputMode="decimal"
              value={fx}
              onChange={(e) => setFx(e.target.value)}
              placeholder="e.g. 84.25"
              hint="for your reports only - not printed"
            />
          ) : null}
          <SelectField
            id="inv-pos"
            label="place of supply"
            value={d.place_of_supply}
            onChange={(e) => setD({ ...d, place_of_supply: e.target.value })}
            required
            hint={inr ? (totals.interState ? "different state → IGST" : "same state → CGST + SGST") : undefined}
          >
            <StateOptions />
          </SelectField>
        </div>
      </Panel>

      <Panel title="items">
        <div className="overflow-x-auto">
          <table className="w-full min-w-[720px] border-collapse text-[13px]">
            <thead>
              <tr className="bg-ha-bg text-left text-xs font-bold uppercase tracking-wider text-ha-muted">
                <th className="w-8 p-2" scope="col">#</th>
                <th className="p-2" scope="col">item</th>
                {inr ? <th className="w-28 p-2" scope="col">HSN/SAC</th> : null}
                <th className="w-20 p-2" scope="col">qty</th>
                <th className="w-32 p-2" scope="col">rate ({d.currency})</th>
                {inr ? <th className="w-24 p-2" scope="col">GST %</th> : null}
                <th className="w-32 p-2 text-right" scope="col">amount</th>
                <th className="w-12 p-2" scope="col"><span className="sr-only">remove</span></th>
              </tr>
            </thead>
            <tbody>
              {rows.map((r, i) => {
                const n = i + 1;
                return (
                  <tr key={r.key} className="border-b border-ha-line align-top">
                    <td className="p-2 pt-4">{n}.</td>
                    <td className="p-2">
                      <input aria-label={`item ${n} name`} className="w-full rounded-ha-md border border-ha-line bg-ha-surface px-3 py-2 font-semibold" value={r.name} onChange={(e) => setRow(r.key, { name: e.target.value })} placeholder="e.g. Accessibility Remediation" />
                      <input aria-label={`item ${n} description`} className="mt-1.5 w-full rounded-ha-md border border-ha-line bg-ha-surface px-3 py-1.5 text-ha-muted" value={r.description} onChange={(e) => setRow(r.key, { description: e.target.value })} placeholder="description (optional)" />
                    </td>
                    {inr ? (
                      <td className="p-2">
                        <input aria-label={`item ${n} HSN or SAC code`} className="w-full rounded-ha-md border border-ha-line bg-ha-surface px-3 py-2" value={r.hsn_sac} onChange={(e) => setRow(r.key, { hsn_sac: e.target.value })} placeholder="998314" />
                      </td>
                    ) : null}
                    <td className="p-2">
                      <input aria-label={`item ${n} quantity`} inputMode="decimal" className="w-full rounded-ha-md border border-ha-line bg-ha-surface px-3 py-2" value={r.qty} onChange={(e) => setRow(r.key, { qty: e.target.value })} />
                    </td>
                    <td className="p-2">
                      <input aria-label={`item ${n} rate`} inputMode="decimal" className="w-full rounded-ha-md border border-ha-line bg-ha-surface px-3 py-2 text-right" value={r.rate} onChange={(e) => setRow(r.key, { rate: e.target.value })} placeholder="0.00" />
                    </td>
                    {inr ? (
                      <td className="p-2">
                        <select aria-label={`item ${n} GST rate`} className="w-full rounded-ha-md border border-ha-line bg-ha-surface px-2 py-2" value={r.gst_rate} onChange={(e) => setRow(r.key, { gst_rate: e.target.value })}>
                          {GST_RATES.map((g) => (
                            <option key={g} value={g}>
                              {g}%
                            </option>
                          ))}
                        </select>
                      </td>
                    ) : null}
                    <td className="p-2 pt-4 text-right font-semibold tabular-nums">{formatMoney(totals.lines[i]?.amount ?? 0, d.currency)}</td>
                    <td className="p-2">
                      <button
                        type="button"
                        aria-label={`remove item ${n}`}
                        disabled={rows.length === 1}
                        onClick={() => setRows(rows.filter((x) => x.key !== r.key))}
                        className="grid h-10 w-10 place-items-center rounded-ha-md text-ha-muted hover:bg-ha-accent-wash disabled:opacity-30"
                      >
                        <Trash size={18} />
                      </button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
        <Button variant="ghost" className="mt-3 inline-flex items-center gap-2" onClick={() => setRows([...rows, toRow(blankItem())])}>
          <Plus size={16} weight="bold" /> add item
        </Button>

        <div className="mt-5 grid gap-4 md:grid-cols-[1fr_340px]">
          <div>
            <div className="text-xs font-bold uppercase tracking-wider text-ha-muted">total in words</div>
            <p className="mt-1 text-[14px]">{amountInWords(totals.total, d.currency)}</p>
          </div>
          <dl className="grid gap-1.5 text-[13px]">
            {inr ? (
              <>
                <div className="flex justify-between"><dt className="text-ha-muted">subtotal</dt><dd className="tabular-nums">{formatMoney(totals.subtotal, d.currency)}</dd></div>
                {totals.interState ? (
                  <div className="flex justify-between"><dt className="text-ha-muted">IGST</dt><dd className="tabular-nums">{formatMoney(totals.igst, d.currency)}</dd></div>
                ) : (
                  <>
                    <div className="flex justify-between"><dt className="text-ha-muted">CGST</dt><dd className="tabular-nums">{formatMoney(totals.cgst, d.currency)}</dd></div>
                    <div className="flex justify-between"><dt className="text-ha-muted">SGST</dt><dd className="tabular-nums">{formatMoney(totals.sgst, d.currency)}</dd></div>
                  </>
                )}
              </>
            ) : null}
            <div className="mt-1 flex justify-between rounded-ha-md bg-[#0b2844] px-3 py-2.5 text-[15px] font-semibold text-white">
              <dt>total</dt>
              <dd className="tabular-nums">{formatMoney(totals.total, d.currency)}</dd>
            </div>
            {!inr && fx && Number(fx) > 0 ? (
              <div className="flex justify-between text-xs text-ha-muted"><dt>≈ in INR</dt><dd className="tabular-nums">{formatMoney(totals.total * Number(fx), "INR")}</dd></div>
            ) : null}
          </dl>
        </div>
      </Panel>

      <Panel title="notes" sub="optional. printed under the total.">
        <TextArea id="inv-notes" label="message to the client" value={d.notes} onChange={(e) => setD({ ...d, notes: e.target.value })} rows={2} placeholder="e.g. thanks for your business" />
      </Panel>

      {error ? (
        <p role="alert" className="rounded-ha-md border border-ha-danger/30 bg-ha-danger/5 px-4 py-3 text-[13px] font-semibold text-ha-danger">
          {error}
        </p>
      ) : null}

      <div className="flex flex-wrap items-center gap-2">
        <Button type="submit" variant="ghost" pending={pending}>
          save draft
        </Button>
        <Button
          pending={pending}
          disabled={Boolean(blocker)}
          title={blocker ?? undefined}
          onClick={() =>
            start(async () => {
              const saved = await save();
              if (!saved) return;
              const r = await issueInvoice(saved);
              if (!r.ok) {
                setError(r.error);
                if (!id) router.replace(`/invoices/${saved}`);
                return;
              }
              router.replace(`/invoices/${saved}?issued=1`);
              router.refresh();
            })
          }
        >
          save & issue invoice
        </Button>
        {id ? (
          <>
            <a href={`/api/invoices/${id}/pdf`} target="_blank" rel="noreferrer" className="inline-flex min-h-11 items-center px-3 text-[13px] font-bold text-ha-accent-text">
              preview PDF (last saved)
            </a>
            <Button
              variant="danger"
              className="ml-auto"
              onClick={() =>
                start(async () => {
                  if (!window.confirm("delete this draft? this can't be undone.")) return;
                  const r = await deleteDraft(id);
                  if (!r.ok) setError(r.error);
                  else router.replace("/invoices");
                })
              }
            >
              delete draft
            </Button>
          </>
        ) : null}
      </div>
      <p className="text-xs text-ha-muted">
        issuing gives the invoice its number and locks it. after that you can mark it paid or cancel it, but not edit it.
        {d.place_of_supply === OUTSIDE_INDIA && inr ? " note: client is outside India but the invoice is in INR, so IGST applies." : ""}
      </p>
      <Toast message={toast} />
    </form>
  );
}
