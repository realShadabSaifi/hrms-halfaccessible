"use client";

import { useState, useTransition } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { CaretLeft, CaretRight, DownloadSimple, Trash, Wallet } from "@phosphor-icons/react";
import { addCategory, addExpense, deleteExpense } from "@/app/(portal)/expenses/actions";
import { Panel, SelectField } from "@/components/invoices/fields";
import { Button } from "@/components/ui/Button";
import { EmptyState } from "@/components/ui/EmptyState";
import { TextField } from "@/components/ui/TextField";
import { Toast } from "@/components/ui/Toast";
import type { Expense, ExpenseCategory } from "@/lib/invoices/data";
import { monthLabel, shiftMonth } from "@/lib/invoices/expenses";
import { formatMoney } from "@/lib/invoices/money";
import { validateExpense } from "@/lib/invoices/validate";

const inr = (n: number) => formatMoney(n, "INR");

export function ExpensesClient({
  month,
  isCurrent,
  today,
  categories,
  expenses,
  trend,
}: {
  month: string;
  isCurrent: boolean;
  today: string;
  categories: ExpenseCategory[];
  expenses: Expense[];
  trend: { month: string; total: number }[];
}) {
  const router = useRouter();
  const [pending, start] = useTransition();
  const [toast, setToast] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [form, setForm] = useState({
    spent_on: isCurrent ? today : `${month}-01`,
    amount: "",
    category_id: categories[0]?.id ?? "",
    vendor: "",
    note: "",
  });
  const [newCat, setNewCat] = useState("");
  const name = new Map(categories.map((c) => [c.id, c.name]));

  const total = expenses.reduce((s, e) => s + Math.round(e.amount * 100), 0) / 100;
  const byCat = categories
    .map((c) => ({ ...c, total: expenses.filter((e) => e.category_id === c.id).reduce((s, e) => s + Math.round(e.amount * 100), 0) / 100 }))
    .filter((c) => c.total > 0)
    .sort((a, b) => b.total - a.total);
  const maxTrend = Math.max(1, ...trend.map((t) => t.total));
  const fyStartMonth = `${Number(month.slice(5)) < 4 ? Number(month.slice(0, 4)) - 1 : month.slice(0, 4)}-04`;

  return (
    <div className="pageEnter grid min-w-0 gap-5 [&>*]:min-w-0">
      <div className="flex flex-wrap items-center gap-2">
        <Link href={`/expenses?month=${shiftMonth(month, -1)}`} aria-label="previous month" className="grid h-11 w-11 place-items-center rounded-ha-md border border-ha-line bg-ha-surface">
          <CaretLeft size={18} />
        </Link>
        <h2 className="min-w-[170px] text-center font-[family-name:var(--font-display)] text-xl font-bold">{monthLabel(month)}</h2>
        <Link href={`/expenses?month=${shiftMonth(month, 1)}`} aria-label="next month" className="grid h-11 w-11 place-items-center rounded-ha-md border border-ha-line bg-ha-surface">
          <CaretRight size={18} />
        </Link>
        {!isCurrent ? (
          <Link href="/expenses" className="inline-flex min-h-11 items-center px-2 text-[13px] font-bold text-ha-accent-text">
            back to this month
          </Link>
        ) : null}
        <div className="ml-auto flex flex-wrap gap-2">
          <a href={`/api/expenses/csv?month=${month}`} className="inline-flex min-h-11 items-center gap-2 rounded-ha-md border border-ha-line bg-ha-surface px-4 text-[13px] font-bold no-underline">
            <DownloadSimple size={16} weight="bold" /> CSV for {monthLabel(month)}
          </a>
          <a href={`/api/expenses/csv?from=${fyStartMonth}&to=${month}`} className="inline-flex min-h-11 items-center gap-2 rounded-ha-md border border-ha-line bg-ha-surface px-4 text-[13px] font-bold no-underline">
            <DownloadSimple size={16} weight="bold" /> CSV, financial year to date
          </a>
        </div>
      </div>

      <div className="grid items-start gap-5 lg:grid-cols-[1fr_1.3fr]">
        <div className="grid gap-5">
          <Panel title="add an expense" sub="amounts in rupees.">
            <form
              onSubmit={(e) => {
                e.preventDefault();
                const input = { ...form, amount: Number(form.amount) };
                const err = validateExpense(input);
                if (err) {
                  setError(err);
                  return;
                }
                setError(null);
                start(async () => {
                  const r = await addExpense(input);
                  if (!r.ok) {
                    setError(r.error);
                    return;
                  }
                  setToast(`added ${inr(input.amount)}.`);
                  setForm({ ...form, amount: "", vendor: "", note: "" });
                  if (input.spent_on.slice(0, 7) !== month) router.push(`/expenses?month=${input.spent_on.slice(0, 7)}`);
                  else router.refresh();
                });
              }}
              className="grid gap-3 sm:grid-cols-2"
            >
              <TextField id="exp-date" label="date" type="date" value={form.spent_on} max={today} onChange={(e) => setForm({ ...form, spent_on: e.target.value })} required />
              <TextField id="exp-amount" label="amount (₹)" inputMode="decimal" value={form.amount} onChange={(e) => setForm({ ...form, amount: e.target.value })} placeholder="0.00" required />
              <SelectField id="exp-cat" label="category" value={form.category_id} onChange={(e) => setForm({ ...form, category_id: e.target.value })} required>
                {categories.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.name}
                  </option>
                ))}
              </SelectField>
              <TextField id="exp-vendor" label="paid to (optional)" value={form.vendor} onChange={(e) => setForm({ ...form, vendor: e.target.value })} placeholder="e.g. IndiGo, AWS" />
              <TextField id="exp-note" label="note (optional)" value={form.note} onChange={(e) => setForm({ ...form, note: e.target.value })} className="sm:col-span-2" />
              {error ? (
                <p role="alert" className="text-[13px] font-semibold text-ha-danger sm:col-span-2">
                  {error}
                </p>
              ) : null}
              <div className="sm:col-span-2">
                <Button type="submit" pending={pending}>
                  add expense
                </Button>
              </div>
            </form>
            <form
              onSubmit={(e) => {
                e.preventDefault();
                start(async () => {
                  const r = await addCategory(newCat);
                  setToast(r.ok ? `category "${newCat.trim()}" added.` : r.error);
                  if (r.ok) {
                    setNewCat("");
                    router.refresh();
                  }
                });
              }}
              className="mt-4 flex flex-wrap items-end gap-2 border-t border-ha-line pt-4"
            >
              <TextField id="exp-newcat" label="new category" value={newCat} onChange={(e) => setNewCat(e.target.value)} maxLength={40} className="min-w-[200px] flex-1" />
              <Button type="submit" variant="ghost" pending={pending}>
                add category
              </Button>
            </form>
          </Panel>

          <Panel title="last 6 months">
            <ul className="grid gap-2">
              {trend.map((t) => (
                <li key={t.month} className="grid grid-cols-[90px_1fr_auto] items-center gap-3 text-[13px]">
                  <Link href={`/expenses?month=${t.month}`} className={t.month === month ? "font-bold text-ha-accent-text" : "text-ha-ink"}>
                    {monthLabel(t.month).replace(/ (\d{2})(\d{2})$/, " '$2")}
                  </Link>
                  <span className="h-2.5 rounded-full bg-ha-accent-wash">
                    <span className="block h-2.5 rounded-full bg-ha-accent" style={{ width: `${(t.total / maxTrend) * 100}%` }} />
                  </span>
                  <span className="tabular-nums">{inr(t.total)}</span>
                </li>
              ))}
            </ul>
          </Panel>
        </div>

        <div className="grid gap-5">
          <Panel title={`total for ${monthLabel(month)}`}>
            <div className="font-[family-name:var(--font-display)] text-3xl font-bold text-ha-accent-text">{inr(total)}</div>
            {byCat.length ? (
              <ul className="mt-4 grid gap-2">
                {byCat.map((c) => (
                  <li key={c.id} className="grid grid-cols-[110px_1fr_auto] items-center gap-3 text-[13px]">
                    <span>{c.name}</span>
                    <span className="h-2.5 rounded-full bg-ha-accent-wash">
                      <span className="block h-2.5 rounded-full bg-ha-accent" style={{ width: `${(c.total / total) * 100}%` }} />
                    </span>
                    <span className="tabular-nums">
                      {inr(c.total)} <span className="text-ha-muted">({Math.round((c.total / total) * 100)}%)</span>
                    </span>
                  </li>
                ))}
              </ul>
            ) : null}
          </Panel>

          <Panel title="expenses this month">
            {expenses.length === 0 ? (
              <EmptyState icon={<Wallet size={28} />} title="nothing spent this month" body="add one with the form." />
            ) : (
              <ul className="divide-y divide-ha-line">
                {expenses.map((e) => (
                  <li key={e.id} className="flex items-center gap-3 py-2.5 text-[13px]">
                    <span className="w-[86px] shrink-0 tabular-nums text-ha-muted">{e.spent_on}</span>
                    <span className="min-w-0 flex-1">
                      <span className="block font-semibold">
                        {name.get(e.category_id)}
                        {e.vendor ? <span className="font-normal text-ha-muted"> · {e.vendor}</span> : null}
                      </span>
                      {e.note ? <span className="block truncate text-xs text-ha-muted">{e.note}</span> : null}
                    </span>
                    <span className="tabular-nums font-semibold">{inr(e.amount)}</span>
                    <button
                      type="button"
                      aria-label={`delete ${inr(e.amount)} ${name.get(e.category_id) ?? ""} expense from ${e.spent_on}`}
                      onClick={() => {
                        if (!window.confirm(`delete this ${inr(e.amount)} expense?`)) return;
                        start(async () => {
                          const r = await deleteExpense(e.id);
                          setToast(r.ok ? "expense deleted." : r.error);
                          if (r.ok) router.refresh();
                        });
                      }}
                      className="grid h-10 w-10 shrink-0 place-items-center rounded-ha-md text-ha-muted hover:bg-ha-accent-wash"
                    >
                      <Trash size={18} />
                    </button>
                  </li>
                ))}
              </ul>
            )}
          </Panel>
        </div>
      </div>
      <Toast message={toast} />
    </div>
  );
}
