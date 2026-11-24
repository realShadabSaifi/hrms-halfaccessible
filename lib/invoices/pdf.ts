import "server-only";
import { readFile } from "node:fs/promises";
import path from "node:path";
import fontkit from "@pdf-lib/fontkit";
import { PDFDocument, type PDFFont, type PDFImage, type PDFPage, degrees, rgb } from "pdf-lib";
import { amountInWords, computeTotals, formatAmount } from "./money";
import { placeOfSupplyLabel } from "./reference";
import type { ClientInput, CompanyInput } from "./validate";

export type InvoiceDoc = {
  status: "draft" | "issued" | "paid" | "cancelled";
  number: string | null;
  currency: string;
  invoice_date: string;
  due_date: string;
  payment_terms: string;
  place_of_supply: string;
  notes: string;
  company: CompanyInput;
  client: ClientInput;
  items: { name: string; description: string; hsn_sac: string; qty: number; rate: number; gst_rate: number }[];
  logo: { bytes: Uint8Array; type: "png" | "jpg" } | null;
};

// A4 in points; layout measured from the sample invoice
const W = 595.28;
const H = 841.89;
const L = 36;
const R = W - 34;
const INK = rgb(0.067, 0.094, 0.153); // #111827
const MUTED = rgb(0.58, 0.62, 0.68); // grey labels
const SOFT = rgb(0.93, 0.95, 0.965); // #eef2f6 table header / bank box
const LINE = rgb(0.84, 0.86, 0.89);
const NAVY = rgb(0.043, 0.157, 0.267); // #0b2844 total box
const WHITE = rgb(1, 1, 1);

const FONT_DIR = path.join(process.cwd(), "node_modules/@fontsource/inter/files");

type Fonts = { regular: PDFFont; medium: PDFFont; bold: PDFFont; black: PDFFont };

async function loadFonts(doc: PDFDocument): Promise<Fonts> {
  doc.registerFontkit(fontkit);
  const load = async (weight: number) =>
    doc.embedFont(new Uint8Array(await readFile(path.join(FONT_DIR, `inter-latin-${weight}-normal.woff`))), { subset: true });
  const [regular, medium, bold, black] = await Promise.all([load(400), load(500), load(700), load(800)]);
  return { regular, medium, bold, black };
}

/** Word-wrap to a width; long words are broken. */
function wrap(text: string, font: PDFFont, size: number, maxWidth: number): string[] {
  const out: string[] = [];
  for (const para of text.split(/\r?\n/)) {
    let line = "";
    for (const word of para.split(/\s+/).filter(Boolean)) {
      const next = line ? `${line} ${word}` : word;
      if (font.widthOfTextAtSize(next, size) <= maxWidth) {
        line = next;
        continue;
      }
      if (line) out.push(line);
      let w = word;
      while (font.widthOfTextAtSize(w, size) > maxWidth && w.length > 1) {
        let cut = w.length - 1;
        while (cut > 1 && font.widthOfTextAtSize(w.slice(0, cut), size) > maxWidth) cut--;
        out.push(w.slice(0, cut));
        w = w.slice(cut);
      }
      line = w;
    }
    out.push(line);
  }
  return out.length ? out : [""];
}

function roundedRect(page: PDFPage, x: number, yTop: number, w: number, h: number, r: number, color = SOFT) {
  // pdf-lib has no rounded rect primitive; draw with an SVG path (origin at top-left of the box)
  const p = `M ${r} 0 H ${w - r} Q ${w} 0 ${w} ${r} V ${h - r} Q ${w} ${h} ${w - r} ${h} H ${r} Q 0 ${h} 0 ${h - r} V ${r} Q 0 0 ${r} 0 Z`;
  page.drawSvgPath(p, { x, y: H - yTop, color });
}

export async function renderInvoicePdf(inv: InvoiceDoc): Promise<Uint8Array> {
  const doc = await PDFDocument.create();
  doc.setTitle(inv.number ? `Invoice ${inv.number}` : "Draft invoice");
  doc.setAuthor(inv.company.name);
  doc.setProducer("halfAccessible portal");
  const f = await loadFonts(doc);
  let logo: PDFImage | null = null;
  if (inv.logo) {
    logo = inv.logo.type === "png" ? await doc.embedPng(inv.logo.bytes) : await doc.embedJpg(inv.logo.bytes);
  }

  const totals = computeTotals(inv.items, {
    currency: inv.currency,
    companyState: inv.company.state_code,
    placeOfSupply: inv.place_of_supply,
  });
  const gst = totals.taxable;
  const cur = inv.currency;

  const pages: PDFPage[] = [];
  let page!: PDFPage;
  // y is measured from the top of the page, like the design
  const text = (
    s: string,
    x: number,
    y: number,
    size: number,
    font: PDFFont,
    color = INK,
    align: "left" | "right" | "center" = "left",
  ) => {
    const w = font.widthOfTextAtSize(s, size);
    const dx = align === "right" ? x - w : align === "center" ? x - w / 2 : x;
    page.drawText(s, { x: dx, y: H - y - size * 0.8, size, font, color });
    return w;
  };
  const newPage = () => {
    page = doc.addPage([W, H]);
    pages.push(page);
  };

  // ---------- columns ----------
  const hasHsn = gst && inv.items.some((i) => i.hsn_sac.trim());
  const col = gst
    ? hasHsn
      ? { num: 48, item: 78, itemW: 140, hsn: 226, qty: 290, rate: 395, tax: 450, amount: 549 }
      : { num: 48, item: 78, itemW: 190, hsn: 0, qty: 285, rate: 390, tax: 450, amount: 549 }
    : { num: 48, item: 78, itemW: 150, hsn: 0, qty: 238, rate: 393, tax: 0, amount: 549 };

  const tableHeader = (y: number) => {
    roundedRect(page, L, y, R - L, 28, 5);
    const ty = y + 10;
    text("#", col.num, ty, 9, f.bold);
    text("Items", col.item, ty, 9, f.bold);
    if (col.hsn) text("HSN/SAC", col.hsn, ty, 9, f.bold);
    text("Qty", col.qty, ty, 9, f.bold);
    const head = (label: string, x: number) => {
      const unit = `(${cur})`;
      const uw = f.bold.widthOfTextAtSize(unit, 9);
      text(unit, x, ty, 9, f.bold, MUTED, "right");
      text(label, x - uw, ty, 9, f.bold, INK, "right");
    };
    head("Rate", col.rate);
    if (gst) text("GST", col.tax, ty, 9, f.bold, INK, "right");
    head("Amount", col.amount);
    return y + 28;
  };

  // ---------- page 1 header ----------
  newPage();
  let y = 36;
  if (logo) {
    const s = Math.min(52 / logo.width, 52 / logo.height);
    page.drawImage(logo, { x: L, y: H - y - logo.height * s, width: logo.width * s, height: logo.height * s });
  }
  const title = gst ? "TAX INVOICE" : "INVOICE";
  text(title, R, 38, 23, f.black, INK, "right");
  const meta = [
    `Invoice #:${inv.number ?? "DRAFT"}`,
    `Invoice Date: ${inv.invoice_date}`,
    `Due Date: ${inv.due_date}`,
    `Payment terms: ${inv.payment_terms || "Immediate"}`,
  ];
  meta.forEach((m, i) => text(m, R, 76 + i * 16, 9, f.bold, INK, "right"));

  y = logo ? 98 : 60;
  const leftW = 270;
  text(inv.company.name.toUpperCase(), L, y, 9, f.bold);
  y += 15;
  for (const ln of wrap(inv.company.address, f.regular, 9, leftW)) {
    text(ln, L, y, 9, f.regular);
    y += 12;
  }
  y += 4;
  if (inv.company.pan) {
    text(`PAN: ${inv.company.pan.toUpperCase()}`, L, y, 9, f.regular);
    y += 13;
  }
  if (inv.company.gstin) {
    text(`GSTIN: ${inv.company.gstin.toUpperCase()}`, L, y, 9, f.regular);
    y += 13;
  }

  y = Math.max(y, 140) + 24;
  page.drawLine({ start: { x: L, y: H - y }, end: { x: R, y: H - y }, thickness: 0.8, color: LINE });

  // ---------- bill to ----------
  y += 24;
  text("Bill to:", L, y, 9, f.regular, MUTED);
  y += 15;
  text(inv.client.name, L, y, 9.5, f.bold);
  y += 15;
  for (const ln of wrap(inv.client.address, f.regular, 9, R - L)) {
    if (!ln) continue;
    text(ln, L, y, 9, f.regular);
    y += 15;
  }
  const countryLine = [inv.client.country, inv.client.pincode].filter(Boolean).join(" - ");
  if (countryLine) {
    text(countryLine, L, y, 9, f.regular);
    y += 15;
  }
  if (inv.client.gstin) {
    text(`GSTIN: ${inv.client.gstin.toUpperCase()}`, L, y, 9, f.regular);
    y += 15;
  }
  const pos = placeOfSupplyLabel(inv.place_of_supply);
  if (pos) {
    text(`Place of supply : ${pos}`, L, y, 9, f.regular);
    y += 15;
  }

  // ---------- items ----------
  y += 18;
  y = tableHeader(y);
  const BOTTOM = H - 70; // keep clear of the footer
  const BANK_TOP = H - 56 - 10 - 78; // bank box ends just above the footer line, as in the sample
  totals.lines.forEach((line, i) => {
    const it = inv.items[i];
    const nameLines = wrap(it.name, f.bold, 9, col.itemW);
    const descLines = it.description ? wrap(it.description, f.regular, 9, col.itemW) : [];
    const rowH = 22 + (nameLines.length + descLines.length - 1) * 12 + (descLines.length ? 6 : 0);
    if (y + rowH > BOTTOM) {
      newPage();
      y = tableHeader(36);
    }
    let ty = y + 14;
    text(`${i + 1}.`, col.num, ty, 9, f.regular);
    if (col.hsn) text(it.hsn_sac, col.hsn, ty, 9, f.regular);
    text(String(+line.qty.toFixed(3)), col.qty, ty, 9, f.regular);
    text(formatAmount(line.rate), col.rate, ty, 9, f.regular, INK, "right");
    if (gst) text(`${+line.gst_rate.toFixed(2)}%`, col.tax, ty, 9, f.regular, INK, "right");
    text(formatAmount(line.amount), col.amount, ty, 9, f.regular, INK, "right");
    for (const ln of nameLines) {
      text(ln, col.item, ty, 9, f.bold);
      ty += 12;
    }
    ty += 3;
    for (const ln of descLines) {
      text(ln, col.item, ty, 9, f.regular, MUTED);
      ty += 12;
    }
    y += rowH + 8;
    page.drawLine({ start: { x: L, y: H - y }, end: { x: R, y: H - y }, thickness: 0.8, color: LINE });
  });

  // ---------- totals ----------
  const taxRows: [string, number][] = gst
    ? totals.byRate.flatMap((r) =>
        totals.interState
          ? [[`IGST @${+r.rate.toFixed(2)}%`, r.igst] as [string, number]]
          : [
              [`CGST @${+(r.rate / 2).toFixed(2)}%`, r.cgst] as [string, number],
              [`SGST @${+(r.rate / 2).toFixed(2)}%`, r.sgst] as [string, number],
            ],
      )
    : [];
  const summaryH = (gst ? 22 + taxRows.length * 16 : 0) + 27;
  const notesLines = inv.notes ? wrap(inv.notes, f.regular, 9, R - L) : [];
  const wordsH = 14 + wrap(amountInWords(totals.total, cur), f.regular, 11, 299 - L - 16).length * 14;
  const blockH = 24 + Math.max(summaryH, wordsH + (gst ? 22 + taxRows.length * 16 : 0)) + 16 + (notesLines.length ? 22 + notesLines.length * 12 : 0);
  // the bank box sits at a fixed spot above the footer (top at BANK_TOP, label 16pt above)
  const limit = inv.company.bank_account ? BANK_TOP - 30 : BOTTOM;
  if (y + blockH > limit) {
    newPage();
    y = 36;
  }

  y += 24;
  const boxX = 299;
  if (gst) {
    text("Subtotal", boxX + 16, y, 9, f.regular, MUTED);
    text(`${cur} ${formatAmount(totals.subtotal)}`, R - 16, y, 9, f.regular, INK, "right");
    y += 18;
    for (const [label, amt] of taxRows) {
      text(label, boxX + 16, y, 9, f.regular, MUTED);
      text(`${cur} ${formatAmount(amt)}`, R - 16, y, 9, f.regular, INK, "right");
      y += 16;
    }
    y += 4;
  }
  text("Total in words", L, y - 2, 9, f.regular, MUTED);
  const words = wrap(amountInWords(totals.total, cur), f.regular, 11, boxX - L - 16);
  words.forEach((ln, i) => text(ln, L, y + 14 + i * 14, 11, f.regular));
  roundedRect(page, boxX, y, R - boxX, 27, 4, NAVY);
  text("Total", boxX + 112, y + 8, 11, f.regular, WHITE);
  text(`${cur} ${formatAmount(totals.total)}`, R - 13, y + 8, 11, f.medium, WHITE, "right");
  y += Math.max(27, 14 + words.length * 14) + 16;

  if (notesLines.length) {
    y += 8;
    text("Notes", L, y, 9, f.regular, MUTED);
    y += 14;
    for (const ln of notesLines) {
      text(ln, L, y, 9, f.regular);
      y += 12;
    }
  }

  // ---------- bank details, anchored above the footer like the sample ----------
  if (inv.company.bank_account) {
    const by = Math.max(y + 16, BANK_TOP);
    text("Bank details:", L, by - 16, 9, f.regular, MUTED);
    roundedRect(page, L, by, 401, 78, 6);
    const rows: [string, string][] = [
      ["Account holder name: ", inv.company.bank_holder.toUpperCase()],
      ["Account number: ", inv.company.bank_account],
      ["IFSC code: ", inv.company.bank_ifsc.toUpperCase()],
      ["Bank name: ", inv.company.bank_name],
    ];
    rows.forEach(([k, v], i) => {
      const ry = by + 14 + i * 14;
      const kw = text(k, L + 16, ry, 9, f.bold);
      text(v, L + 16 + kw, ry, 9, f.regular);
    });
  }

  // ---------- watermark, footer and page numbers on every page ----------
  const mark = inv.status === "draft" ? "DRAFT" : inv.status === "cancelled" ? "CANCELLED" : null;
  pages.forEach((p, i) => {
    page = p;
    if (mark) {
      p.drawText(mark, {
        x: 120,
        y: 300,
        size: 96,
        font: f.black,
        color: rgb(0.9, 0.2, 0.2),
        opacity: 0.08,
        rotate: degrees(35),
      });
    }
    const fy = H - 56;
    p.drawLine({ start: { x: 24, y: H - fy }, end: { x: W - 24, y: H - fy }, thickness: 0.8, color: LINE });
    const contact = [inv.company.phone, inv.company.email].filter(Boolean).join("     ");
    if (contact) text(contact, L - 12, fy + 12, 9, f.regular, MUTED);
    if (inv.company.website) text(inv.company.website, L - 12, fy + 28, 9, f.regular, MUTED);
    text(`Page ${i + 1}/${pages.length}`, W - 24, fy + 20, 9, f.regular, MUTED, "right");
  });

  return doc.save();
}
