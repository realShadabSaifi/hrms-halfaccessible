import "server-only";
import { createClient } from "@/lib/supabase/server";
import type { ClientInput, CompanyInput, ItemInput } from "./validate";

export type InvoiceStatus = "draft" | "issued" | "paid" | "cancelled";

export type Company = CompanyInput & { logo_path: string | null };
export type Client = ClientInput & { id: string; archived: boolean };

export type InvoiceRow = {
  id: string;
  status: InvoiceStatus;
  number: string | null;
  client_id: string | null;
  client_snapshot: (ClientInput & { id?: string }) | null;
  company_snapshot: Company | null;
  currency: string;
  fx_rate: number | null;
  invoice_date: string;
  due_date: string;
  payment_terms: string;
  place_of_supply: string;
  notes: string;
  subtotal: number;
  cgst: number;
  sgst: number;
  igst: number;
  total: number;
  issued_at: string | null;
  paid_at: string | null;
  cancelled_at: string | null;
  created_at: string;
};

export type InvoiceItem = ItemInput & { id?: string; position: number };

export const EMPTY_COMPANY: Company = {
  name: "",
  address: "",
  state_code: "",
  pan: "",
  gstin: "",
  email: "",
  phone: "",
  website: "",
  bank_holder: "",
  bank_account: "",
  bank_ifsc: "",
  bank_name: "",
  invoice_prefix: "INV",
  default_terms: "Immediate",
  logo_path: null,
};

const COMPANY_COLS =
  "name, address, state_code, pan, gstin, email, phone, website, bank_holder, bank_account, bank_ifsc, bank_name, invoice_prefix, default_terms, logo_path";
const CLIENT_COLS = "id, name, address, country, pincode, state_code, gstin, email, default_currency, archived";
const INVOICE_COLS =
  "id, status, number, client_id, client_snapshot, company_snapshot, currency, fx_rate, invoice_date, due_date, payment_terms, place_of_supply, notes, subtotal, cgst, sgst, igst, total, issued_at, paid_at, cancelled_at, created_at";

const num = (v: unknown) => (v === null || v === undefined ? 0 : Number(v));

function normalizeInvoice(r: Record<string, unknown>): InvoiceRow {
  return {
    ...(r as unknown as InvoiceRow),
    fx_rate: r.fx_rate === null || r.fx_rate === undefined ? null : Number(r.fx_rate),
    subtotal: num(r.subtotal),
    cgst: num(r.cgst),
    sgst: num(r.sgst),
    igst: num(r.igst),
    total: num(r.total),
  };
}

export async function getCompany(): Promise<Company> {
  const supabase = await createClient();
  const { data } = await supabase.from("company_profile").select(COMPANY_COLS).eq("id", 1).maybeSingle();
  return { ...EMPTY_COMPANY, ...(data ?? {}) };
}

export async function getClients(includeArchived = false): Promise<Client[]> {
  const supabase = await createClient();
  let q = supabase.from("clients").select(CLIENT_COLS).order("name");
  if (!includeArchived) q = q.eq("archived", false);
  const { data } = await q;
  return (data ?? []) as Client[];
}

export async function getInvoices(): Promise<(InvoiceRow & { client_name: string })[]> {
  const supabase = await createClient();
  const [{ data }, clients] = await Promise.all([
    supabase.from("invoices").select(INVOICE_COLS).order("created_at", { ascending: false }).limit(500),
    getClients(true),
  ]);
  const names = new Map(clients.map((c) => [c.id, c.name]));
  return (data ?? []).map((r) => {
    const inv = normalizeInvoice(r);
    return { ...inv, client_name: inv.client_snapshot?.name ?? (inv.client_id ? names.get(inv.client_id) : "") ?? "" };
  });
}

export async function getInvoice(id: string): Promise<{ invoice: InvoiceRow; items: InvoiceItem[] } | null> {
  if (!/^[0-9a-f-]{36}$/i.test(id)) return null;
  const supabase = await createClient();
  const [{ data: inv }, { data: items }] = await Promise.all([
    supabase.from("invoices").select(INVOICE_COLS).eq("id", id).maybeSingle(),
    supabase
      .from("invoice_items")
      .select("id, position, name, description, hsn_sac, qty, rate, gst_rate")
      .eq("invoice_id", id)
      .order("position"),
  ]);
  if (!inv) return null;
  return {
    invoice: normalizeInvoice(inv),
    items: (items ?? []).map((i) => ({ ...i, qty: num(i.qty), rate: num(i.rate), gst_rate: num(i.gst_rate) })),
  };
}

export type ExpenseCategory = { id: string; name: string };
export type Expense = { id: string; spent_on: string; amount: number; category_id: string; vendor: string; note: string };

export async function getExpenseCategories(): Promise<ExpenseCategory[]> {
  const supabase = await createClient();
  const { data } = await supabase.from("expense_categories").select("id, name").order("sort").order("name");
  return data ?? [];
}

/** Expenses within [from, to) — YYYY-MM-DD bounds. */
export async function getExpenses(from: string, to: string): Promise<Expense[]> {
  const supabase = await createClient();
  const { data } = await supabase
    .from("expenses")
    .select("id, spent_on, amount, category_id, vendor, note")
    .gte("spent_on", from)
    .lt("spent_on", to)
    .order("spent_on", { ascending: false })
    .order("created_at", { ascending: false });
  return (data ?? []).map((e) => ({ ...e, amount: num(e.amount) }));
}
