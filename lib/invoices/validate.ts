import { GST_STATES, OUTSIDE_INDIA, isKnownCurrency } from "./reference";

export const GSTIN_RE = /^[0-9]{2}[A-Z]{5}[0-9]{4}[A-Z][1-9A-Z]Z[0-9A-Z]$/;
export const PAN_RE = /^[A-Z]{5}[0-9]{4}[A-Z]$/;
const DATE_RE = /^\d{4}-\d{2}-\d{2}$/;

export const MAX_ITEMS = 100;

const isState = (code: string) => GST_STATES.some((s) => s.code === code);

/** GSTIN is optional; when given it must be well formed and start with the state's code. */
export function validateGstin(gstin: string, stateCode: string): string | null {
  const g = gstin.trim().toUpperCase();
  if (!g) return null;
  if (!GSTIN_RE.test(g)) return "GSTIN looks wrong (15 characters, e.g. 07ABCDE1234F1Z5)";
  if (stateCode && stateCode !== OUTSIDE_INDIA && g.slice(0, 2) !== stateCode) {
    return `GSTIN should start with the state code ${stateCode}`;
  }
  return null;
}

export type CompanyInput = {
  name: string;
  address: string;
  state_code: string;
  pan: string;
  gstin: string;
  email: string;
  phone: string;
  website: string;
  bank_holder: string;
  bank_account: string;
  bank_ifsc: string;
  bank_name: string;
  invoice_prefix: string;
  default_terms: string;
};

export function validateCompany(c: CompanyInput): string | null {
  if (!c.name.trim()) return "company name is required";
  if (!c.address.trim()) return "address is required";
  if (!isState(c.state_code) || c.state_code === OUTSIDE_INDIA) return "pick your state";
  if (c.pan.trim() && !PAN_RE.test(c.pan.trim().toUpperCase())) return "PAN looks wrong (e.g. ABCDE1234F)";
  const g = validateGstin(c.gstin, c.state_code);
  if (g) return g;
  if (c.bank_ifsc.trim() && !/^[A-Z]{4}0[A-Z0-9]{6}$/.test(c.bank_ifsc.trim().toUpperCase())) {
    return "IFSC looks wrong (e.g. HDFC0009079)";
  }
  if (!/^[A-Za-z0-9-]{1,12}$/.test(c.invoice_prefix.trim())) {
    return "invoice prefix: 1–12 letters, numbers or dashes";
  }
  return null;
}

export type ClientInput = {
  name: string;
  address: string;
  country: string;
  pincode: string;
  state_code: string;
  gstin: string;
  email: string;
  default_currency: string;
};

export function validateClient(c: ClientInput): string | null {
  if (!c.name.trim()) return "client name is required";
  if (!isState(c.state_code)) return "pick the place of supply (state, or outside India)";
  if (!isKnownCurrency(c.default_currency)) return "pick a currency";
  return validateGstin(c.gstin, c.state_code);
}

export type ItemInput = {
  name: string;
  description: string;
  hsn_sac: string;
  qty: number;
  rate: number;
  gst_rate: number;
};

export type DraftInput = {
  client_id: string;
  currency: string;
  fx_rate: number | null;
  invoice_date: string;
  due_date: string;
  payment_terms: string;
  place_of_supply: string;
  notes: string;
  items: ItemInput[];
};

export function validateDraft(d: DraftInput): string | null {
  if (!d.client_id) return "pick a client";
  if (!isKnownCurrency(d.currency)) return "pick a currency";
  if (d.fx_rate !== null && (!Number.isFinite(d.fx_rate) || d.fx_rate <= 0)) return "exchange rate must be above 0";
  if (!DATE_RE.test(d.invoice_date) || !DATE_RE.test(d.due_date)) return "invoice and due dates are required";
  if (d.due_date < d.invoice_date) return "due date can't be before the invoice date";
  if (!isState(d.place_of_supply)) return "pick the place of supply";
  if (d.items.length === 0) return "add at least one item";
  if (d.items.length > MAX_ITEMS) return `at most ${MAX_ITEMS} items`;
  for (const [i, it] of d.items.entries()) {
    const n = i + 1;
    if (!it.name.trim()) return `item ${n}: name is required`;
    if (!Number.isFinite(it.qty) || it.qty <= 0) return `item ${n}: quantity must be above 0`;
    if (!Number.isFinite(it.rate) || it.rate < 0) return `item ${n}: rate can't be negative`;
    if (!Number.isFinite(it.gst_rate) || it.gst_rate < 0 || it.gst_rate > 100) return `item ${n}: GST % must be 0–100`;
  }
  return null;
}

/** What must be true before an invoice can be issued (gets a number and is locked). */
export function issueBlocker(company: Partial<CompanyInput> | null, currency: string): string | null {
  if (!company?.name?.trim() || !company.address?.trim() || !company.state_code) {
    return "fill in your company details first (invoices → company)";
  }
  if (currency === "INR" && !company.gstin?.trim()) {
    return "add your GSTIN in company details to issue INR (GST) invoices";
  }
  return null;
}

export type ExpenseInput = { spent_on: string; amount: number; category_id: string; vendor: string; note: string };

export function validateExpense(e: ExpenseInput): string | null {
  if (!DATE_RE.test(e.spent_on)) return "date is required";
  if (!Number.isFinite(e.amount) || e.amount <= 0) return "amount must be above 0";
  if (Math.round(e.amount * 100) !== Math.round(e.amount * 100 * 1000) / 1000) return "amount: at most 2 decimals";
  if (!e.category_id) return "pick a category";
  return null;
}
