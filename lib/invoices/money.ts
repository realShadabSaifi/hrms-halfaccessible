import { currencyInfo } from "./reference";

/** Money is handled in integer minor units (paise/cents) to avoid float drift. */
export function toMinor(n: number): number {
  return Math.round(n * 100);
}

export function fromMinor(n: number): number {
  return n / 100;
}

/** "180,000.00", grouped the way your invoice shows it. */
export function formatAmount(n: number): string {
  return n.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 });
}

export function formatMoney(n: number, currency: string): string {
  return `${currency} ${formatAmount(n)}`;
}

export type LineInput = { qty: number; rate: number; gst_rate: number };

export type LineResult = LineInput & { amount: number; tax: number };

export type TaxRow = { rate: number; taxable: number; cgst: number; sgst: number; igst: number };

export type InvoiceTotals = {
  taxable: boolean;
  interState: boolean;
  lines: LineResult[];
  subtotal: number;
  cgst: number;
  sgst: number;
  igst: number;
  total: number;
  byRate: TaxRow[];
};

/**
 * GST applies only to INR invoices. Same state for company and place of supply → CGST + SGST
 * (half each), otherwise IGST. Each line's tax is rounded to the paisa.
 */
export function computeTotals(
  lines: LineInput[],
  opts: { currency: string; companyState: string; placeOfSupply: string },
): InvoiceTotals {
  const taxable = opts.currency === "INR";
  const interState = !opts.companyState || opts.companyState !== opts.placeOfSupply;
  const rows = new Map<number, { taxable: number; cgst: number; sgst: number; igst: number }>();
  let sub = 0;
  let cgst = 0;
  let sgst = 0;
  let igst = 0;
  const out: LineResult[] = lines.map((l) => {
    const amount = Math.round(l.qty * toMinor(l.rate));
    const rate = taxable ? l.gst_rate : 0;
    const tax = taxable ? Math.round((amount * rate) / 100) : 0;
    sub += amount;
    if (taxable) {
      const row = rows.get(rate) ?? { taxable: 0, cgst: 0, sgst: 0, igst: 0 };
      row.taxable += amount;
      if (interState) {
        row.igst += tax;
        igst += tax;
      } else {
        const c = Math.floor(tax / 2);
        row.cgst += c;
        row.sgst += tax - c;
        cgst += c;
        sgst += tax - c;
      }
      rows.set(rate, row);
    }
    return { ...l, gst_rate: rate, amount: fromMinor(amount), tax: fromMinor(tax) };
  });
  return {
    taxable,
    interState,
    lines: out,
    subtotal: fromMinor(sub),
    cgst: fromMinor(cgst),
    sgst: fromMinor(sgst),
    igst: fromMinor(igst),
    total: fromMinor(sub + cgst + sgst + igst),
    byRate: [...rows]
      .sort(([a], [b]) => a - b)
      .map(([rate, r]) => ({
        rate,
        taxable: fromMinor(r.taxable),
        cgst: fromMinor(r.cgst),
        sgst: fromMinor(r.sgst),
        igst: fromMinor(r.igst),
      })),
  };
}

/** Financial year label for a YYYY-MM-DD date, Apr–Mar: 2026-11-05 → "2026-27". Mirrors issue_invoice(). */
export function financialYear(isoDate: string): string {
  const [y, m] = isoDate.split("-").map(Number);
  const start = m < 4 ? y - 1 : y;
  return `${start}-${String((start + 1) % 100).padStart(2, "0")}`;
}

/** The number issue_invoice() will produce. */
export function formatInvoiceNumber(prefix: string, fy: string, seq: number): string {
  return `${prefix.trim() || "INV"}/${fy}/${String(seq).padStart(4, "0")}`;
}

const ONES = [
  "", "One", "Two", "Three", "Four", "Five", "Six", "Seven", "Eight", "Nine", "Ten",
  "Eleven", "Twelve", "Thirteen", "Fourteen", "Fifteen", "Sixteen", "Seventeen", "Eighteen", "Nineteen",
];
const TENS = ["", "", "Twenty", "Thirty", "Forty", "Fifty", "Sixty", "Seventy", "Eighty", "Ninety"];

function underHundred(n: number): string {
  if (n < 20) return ONES[n];
  return [TENS[Math.floor(n / 10)], ONES[n % 10]].filter(Boolean).join(" ");
}

function underThousand(n: number): string {
  const h = Math.floor(n / 100);
  const rest = n % 100;
  return [h ? `${ONES[h]} Hundred` : "", rest ? underHundred(rest) : ""].filter(Boolean).join(" ");
}

/** Indian grouping: crore, lakh, thousand. */
function indianWords(n: number): string {
  if (n === 0) return "Zero";
  const parts: string[] = [];
  const crore = Math.floor(n / 10_000_000);
  n %= 10_000_000;
  const lakh = Math.floor(n / 100_000);
  n %= 100_000;
  const thousand = Math.floor(n / 1000);
  n %= 1000;
  if (crore) parts.push(`${indianWords(crore)} Crore`);
  if (lakh) parts.push(`${underHundred(lakh)} Lakh`);
  if (thousand) parts.push(`${underHundred(thousand)} Thousand`);
  if (n) parts.push(underThousand(n));
  return parts.join(" ");
}

/** International grouping: billion, million, thousand. */
function internationalWords(n: number): string {
  if (n === 0) return "Zero";
  const scales: [number, string][] = [
    [1_000_000_000, "Billion"],
    [1_000_000, "Million"],
    [1000, "Thousand"],
  ];
  const parts: string[] = [];
  for (const [size, word] of scales) {
    const chunk = Math.floor(n / size);
    if (chunk) parts.push(`${internationalWords(chunk)} ${word}`);
    n %= size;
  }
  if (n) parts.push(underThousand(n));
  return parts.join(" ");
}

/** "One Lakh Eighty Thousand Rupees Only", "One Hundred US Dollars and Fifty Cents Only". */
export function amountInWords(amount: number, currency: string): string {
  const info = currencyInfo(currency);
  const minor = toMinor(Math.abs(amount));
  const whole = Math.floor(minor / 100);
  const fraction = minor % 100;
  const words = currency === "INR" ? indianWords : internationalWords;
  const head = `${words(whole)} ${info.major}`;
  const tail = fraction && info.minor ? ` and ${underHundred(fraction)} ${info.minor}` : "";
  return `${head}${tail} Only`;
}
