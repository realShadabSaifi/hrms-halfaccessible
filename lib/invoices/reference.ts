/** GST state codes, used for "place of supply" and to pick CGST+SGST vs IGST. */
export const GST_STATES: { code: string; name: string }[] = [
  { code: "01", name: "Jammu and Kashmir" },
  { code: "02", name: "Himachal Pradesh" },
  { code: "03", name: "Punjab" },
  { code: "04", name: "Chandigarh" },
  { code: "05", name: "Uttarakhand" },
  { code: "06", name: "Haryana" },
  { code: "07", name: "Delhi" },
  { code: "08", name: "Rajasthan" },
  { code: "09", name: "Uttar Pradesh" },
  { code: "10", name: "Bihar" },
  { code: "11", name: "Sikkim" },
  { code: "12", name: "Arunachal Pradesh" },
  { code: "13", name: "Nagaland" },
  { code: "14", name: "Manipur" },
  { code: "15", name: "Mizoram" },
  { code: "16", name: "Tripura" },
  { code: "17", name: "Meghalaya" },
  { code: "18", name: "Assam" },
  { code: "19", name: "West Bengal" },
  { code: "20", name: "Jharkhand" },
  { code: "21", name: "Odisha" },
  { code: "22", name: "Chhattisgarh" },
  { code: "23", name: "Madhya Pradesh" },
  { code: "24", name: "Gujarat" },
  { code: "26", name: "Dadra and Nagar Haveli and Daman and Diu" },
  { code: "27", name: "Maharashtra" },
  { code: "29", name: "Karnataka" },
  { code: "30", name: "Goa" },
  { code: "31", name: "Lakshadweep" },
  { code: "32", name: "Kerala" },
  { code: "33", name: "Tamil Nadu" },
  { code: "34", name: "Puducherry" },
  { code: "35", name: "Andaman and Nicobar Islands" },
  { code: "36", name: "Telangana" },
  { code: "37", name: "Andhra Pradesh" },
  { code: "38", name: "Ladakh" },
  { code: "97", name: "Other Territory" },
  { code: "96", name: "Outside India" },
];

export const OUTSIDE_INDIA = "96";

export function stateName(code: string): string {
  return GST_STATES.find((s) => s.code === code)?.name ?? "";
}

/** "DELHI(07)", as on the invoice. */
export function placeOfSupplyLabel(code: string): string {
  const name = stateName(code);
  return name ? `${name.toUpperCase()}(${code})` : "";
}

export type CurrencyInfo = { code: string; major: string; minor: string };

export const CURRENCIES: CurrencyInfo[] = [
  { code: "INR", major: "Rupees", minor: "Paise" },
  { code: "USD", major: "US Dollars", minor: "Cents" },
  { code: "EUR", major: "Euros", minor: "Cents" },
  { code: "GBP", major: "Pounds Sterling", minor: "Pence" },
  { code: "AED", major: "UAE Dirhams", minor: "Fils" },
  { code: "SGD", major: "Singapore Dollars", minor: "Cents" },
  { code: "AUD", major: "Australian Dollars", minor: "Cents" },
  { code: "CAD", major: "Canadian Dollars", minor: "Cents" },
];

export function currencyInfo(code: string): CurrencyInfo {
  return CURRENCIES.find((c) => c.code === code) ?? { code, major: code, minor: "" };
}

export function isKnownCurrency(code: string): boolean {
  return CURRENCIES.some((c) => c.code === code);
}

export const GST_RATES = [0, 5, 12, 18, 28, 40];
