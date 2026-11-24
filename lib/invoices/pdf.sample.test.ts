// @vitest-environment node
import { writeFileSync } from "node:fs";
import { describe, expect, it, vi } from "vitest";

vi.mock("server-only", () => ({}));

const OUT = process.env.PDF_SAMPLE_DIR;

const company = {
  name: "Mohammad Shadab Saifi",
  address: "709 Delhi Gate Hapur H.o Hapur Uttar Pradesh India 245101",
  state_code: "09",
  pan: "ABCDE1234F",
  gstin: "09ABCDE1234F1Z5",
  email: "billing@example.com",
  phone: "+910000000000",
  website: "https://example.com",
  bank_holder: "Mohammad Shadab Saifi",
  bank_account: "000000000000",
  bank_ifsc: "HDFC0000001",
  bank_name: "HDFC Bank",
  invoice_prefix: "INV",
  default_terms: "Immediate",
};
const client = {
  name: "Enhanceaccess Private Limited",
  address: "B-46, Ground Floor, B Block, Lajpat Nagar 2, New Delhi, South East Delhi, Delhi, 110024",
  country: "India",
  pincode: "110024",
  state_code: "07",
  gstin: "07ABCDE1234F1Z5",
  email: "",
  default_currency: "INR",
};
const items = [
  ["Mela Ventures", 50000],
  ["Grow x", 30000],
  ["Ampersand", 40000],
  ["Turtle Wealth", 60000],
].map(([d, r]) => ({ name: "Accessibility Remediation", description: String(d), hsn_sac: "998314", qty: 1, rate: Number(r), gst_rate: 18 }));

describe("invoice PDF", () => {
  it("renders INR (GST), USD (no tax), and a long multi-page draft", async () => {
    const { renderInvoicePdf } = await import("./pdf");
    const base = {
      status: "issued" as const,
      number: "INV/2026-27/0001",
      currency: "INR",
      invoice_date: "2026-11-05",
      due_date: "2026-11-05",
      payment_terms: "Immediate",
      place_of_supply: "07",
      notes: "",
      company,
      client,
      items,
      logo: null,
    };
    const inr = await renderInvoicePdf(base);
    const usd = await renderInvoicePdf({
      ...base,
      number: "INV/2026-27/0002",
      currency: "USD",
      place_of_supply: "96",
      client: { ...client, name: "Acme Inc", address: "1 Market St, San Francisco, CA", country: "USA", pincode: "94105", state_code: "96", gstin: "" },
    });
    const long = await renderInvoicePdf({
      ...base,
      status: "draft",
      number: null,
      notes: "Thanks for your business. Payment within 15 days please.",
      items: Array.from({ length: 30 }, (_, i) => ({ ...items[i % 4], name: `Accessibility audit, phase ${i + 1} with a fairly long title that wraps` })),
    });
    for (const b of [inr, usd, long]) expect(Buffer.from(b.slice(0, 5)).toString()).toBe("%PDF-");
    if (OUT) {
      writeFileSync(`${OUT}/inr.pdf`, inr);
      writeFileSync(`${OUT}/usd.pdf`, usd);
      writeFileSync(`${OUT}/long.pdf`, long);
    }
  });
});
