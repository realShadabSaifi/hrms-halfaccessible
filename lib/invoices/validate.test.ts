import { describe, expect, it } from "vitest";
import { issueBlocker, validateClient, validateCompany, validateDraft, validateExpense, validateGstin } from "./validate";

const company = {
  name: "Mohammad Shadab Saifi",
  address: "709 Delhi Gate, Hapur, Uttar Pradesh 245101",
  state_code: "09",
  pan: "ABCDE1234F",
  gstin: "",
  email: "",
  phone: "",
  website: "",
  bank_holder: "",
  bank_account: "",
  bank_ifsc: "HDFC0009079",
  bank_name: "HDFC Bank",
  invoice_prefix: "INV",
  default_terms: "Immediate",
};

const draft = {
  client_id: "c1",
  currency: "INR",
  fx_rate: null,
  invoice_date: "2026-11-05",
  due_date: "2026-11-05",
  payment_terms: "Immediate",
  place_of_supply: "07",
  notes: "",
  items: [{ name: "Accessibility Remediation", description: "Mela Ventures", hsn_sac: "", qty: 1, rate: 50000, gst_rate: 18 }],
};

describe("GSTIN", () => {
  it("is optional but must be well formed and match the state", () => {
    expect(validateGstin("", "07")).toBeNull();
    expect(validateGstin("07ABCDE1234F1Z5", "07")).toBeNull();
    expect(validateGstin("07abcde1234f1z5", "07")).toBeNull();
    expect(validateGstin("09ABCDE1234F1Z5", "07")).toMatch(/state code 07/);
    expect(validateGstin("07ABCDE1234F1X5", "07")).toMatch(/looks wrong/);
  });
});

describe("company", () => {
  it("needs name, address and an Indian state; checks PAN/IFSC/prefix shapes", () => {
    expect(validateCompany(company)).toBeNull();
    expect(validateCompany({ ...company, name: " " })).toMatch(/name/);
    expect(validateCompany({ ...company, state_code: "96" })).toMatch(/state/);
    expect(validateCompany({ ...company, pan: "123" })).toMatch(/PAN/);
    expect(validateCompany({ ...company, bank_ifsc: "HDFC9079" })).toMatch(/IFSC/);
    expect(validateCompany({ ...company, invoice_prefix: "IN V" })).toMatch(/prefix/);
  });
});

describe("client", () => {
  it("needs a name, place of supply and known currency", () => {
    const c = { name: "Enhanceaccess", address: "", country: "India", pincode: "", state_code: "07", gstin: "", email: "", default_currency: "INR" };
    expect(validateClient(c)).toBeNull();
    expect(validateClient({ ...c, state_code: "" })).toMatch(/place of supply/);
    expect(validateClient({ ...c, default_currency: "XYZ" })).toMatch(/currency/);
    expect(validateClient({ ...c, country: "USA", state_code: "96", default_currency: "USD" })).toBeNull();
  });
});

describe("draft", () => {
  it("accepts a normal invoice and rejects broken ones", () => {
    expect(validateDraft(draft)).toBeNull();
    expect(validateDraft({ ...draft, client_id: "" })).toMatch(/client/);
    expect(validateDraft({ ...draft, due_date: "2026-11-01" })).toMatch(/due date/);
    expect(validateDraft({ ...draft, items: [] })).toMatch(/at least one/);
    expect(validateDraft({ ...draft, items: [{ ...draft.items[0], qty: 0 }] })).toMatch(/item 1: quantity/);
    expect(validateDraft({ ...draft, items: [{ ...draft.items[0], name: "" }] })).toMatch(/item 1: name/);
    expect(validateDraft({ ...draft, fx_rate: 0 })).toMatch(/exchange rate/);
    expect(validateDraft({ ...draft, currency: "USD", fx_rate: 84.25 })).toBeNull();
  });
});

describe("issuing", () => {
  it("needs company details, and a GSTIN for INR invoices only", () => {
    expect(issueBlocker(null, "INR")).toMatch(/company details/);
    expect(issueBlocker(company, "INR")).toMatch(/GSTIN/);
    expect(issueBlocker(company, "USD")).toBeNull();
    expect(issueBlocker({ ...company, gstin: "09ABCDE1234F1Z5" }, "INR")).toBeNull();
  });
});

describe("expense", () => {
  it("needs a date, positive amount and category", () => {
    const e = { spent_on: "2026-11-24", amount: 1499.5, category_id: "cat", vendor: "", note: "" };
    expect(validateExpense(e)).toBeNull();
    expect(validateExpense({ ...e, amount: 0 })).toMatch(/above 0/);
    expect(validateExpense({ ...e, amount: 1.234 })).toMatch(/2 decimals/);
    expect(validateExpense({ ...e, category_id: "" })).toMatch(/category/);
  });
});
