import { describe, expect, it } from "vitest";
import { amountInWords, computeTotals, financialYear, formatAmount, formatInvoiceNumber } from "./money";
import { placeOfSupplyLabel } from "./reference";

const lines = [
  { qty: 1, rate: 50_000, gst_rate: 18 },
  { qty: 1, rate: 30_000, gst_rate: 18 },
  { qty: 1, rate: 40_000, gst_rate: 18 },
  { qty: 1, rate: 60_000, gst_rate: 18 },
];

describe("computeTotals", () => {
  it("splits GST into CGST + SGST within the same state", () => {
    const t = computeTotals(lines, { currency: "INR", companyState: "07", placeOfSupply: "07" });
    expect(t.subtotal).toBe(180_000);
    expect(t.cgst).toBe(16_200);
    expect(t.sgst).toBe(16_200);
    expect(t.igst).toBe(0);
    expect(t.total).toBe(212_400);
    expect(t.byRate).toEqual([{ rate: 18, taxable: 180_000, cgst: 16_200, sgst: 16_200, igst: 0 }]);
  });

  it("uses IGST across states", () => {
    const t = computeTotals(lines, { currency: "INR", companyState: "09", placeOfSupply: "07" });
    expect(t.interState).toBe(true);
    expect(t.igst).toBe(32_400);
    expect(t.cgst + t.sgst).toBe(0);
    expect(t.total).toBe(212_400);
  });

  it("applies no tax to non-INR invoices", () => {
    const t = computeTotals(lines, { currency: "USD", companyState: "07", placeOfSupply: "07" });
    expect(t.taxable).toBe(false);
    expect(t.total).toBe(180_000);
    expect(t.byRate).toEqual([]);
    expect(t.lines.every((l) => l.tax === 0 && l.gst_rate === 0)).toBe(true);
  });

  it("works in paise without float drift and splits odd paise fairly", () => {
    const t = computeTotals([{ qty: 3, rate: 33.33, gst_rate: 5 }], {
      currency: "INR",
      companyState: "07",
      placeOfSupply: "07",
    });
    expect(t.subtotal).toBe(99.99);
    // 5% of 99.99 = 5.00 (4.9995 rounded)
    expect(t.cgst + t.sgst).toBe(5);
    expect(t.total).toBe(104.99);
    const odd = computeTotals([{ qty: 1, rate: 0.1, gst_rate: 18 }], {
      currency: "INR",
      companyState: "07",
      placeOfSupply: "07",
    });
    expect(odd.cgst).toBe(0.01);
    expect(odd.sgst).toBe(0.01);
  });

  it("supports fractional quantities", () => {
    const t = computeTotals([{ qty: 1.5, rate: 1000, gst_rate: 0 }], {
      currency: "INR",
      companyState: "07",
      placeOfSupply: "09",
    });
    expect(t.subtotal).toBe(1500);
    expect(t.total).toBe(1500);
  });
});

describe("numbering", () => {
  it("labels the April–March financial year", () => {
    expect(financialYear("2026-11-05")).toBe("2026-27");
    expect(financialYear("2027-03-31")).toBe("2026-27");
    expect(financialYear("2027-04-01")).toBe("2027-28");
    expect(financialYear("2099-06-01")).toBe("2099-00");
  });

  it("formats invoice numbers", () => {
    expect(formatInvoiceNumber("INV", "2026-27", 1)).toBe("INV/2026-27/0001");
    expect(formatInvoiceNumber("  ", "2026-27", 32)).toBe("INV/2026-27/0032");
    expect(formatInvoiceNumber("MHM", "2026-27", 12345)).toBe("MHM/2026-27/12345");
  });
});

describe("amountInWords", () => {
  it("uses lakh and crore for rupees", () => {
    expect(amountInWords(180_000, "INR")).toBe("One Lakh Eighty Thousand Rupees Only");
    expect(amountInWords(212_400, "INR")).toBe("Two Lakh Twelve Thousand Four Hundred Rupees Only");
    expect(amountInWords(12_345_678.5, "INR")).toBe(
      "One Crore Twenty Three Lakh Forty Five Thousand Six Hundred Seventy Eight Rupees and Fifty Paise Only",
    );
  });

  it("uses million for other currencies", () => {
    expect(amountInWords(1_250_000, "USD")).toBe("One Million Two Hundred Fifty Thousand US Dollars Only");
    expect(amountInWords(99.05, "EUR")).toBe("Ninety Nine Euros and Five Cents Only");
    expect(amountInWords(0, "GBP")).toBe("Zero Pounds Sterling Only");
  });
});

describe("formatting", () => {
  it("matches the invoice's number style", () => {
    expect(formatAmount(180000)).toBe("180,000.00");
    expect(formatAmount(0.5)).toBe("0.50");
    expect(placeOfSupplyLabel("07")).toBe("DELHI(07)");
    expect(placeOfSupplyLabel("xx")).toBe("");
  });
});
