import { NextResponse } from "next/server";
import { getCurrentProfile } from "@/lib/auth";
import { getExpenseCategories, getExpenses } from "@/lib/invoices/data";
import { isMonth, monthBounds, toCsv } from "@/lib/invoices/expenses";

export const dynamic = "force-dynamic";

/** ?month=YYYY-MM for one month, or ?from=YYYY-MM&to=YYYY-MM (inclusive) for a range. */
export async function GET(req: Request) {
  const profile = await getCurrentProfile();
  if (!profile || !profile.active || profile.role !== "cxo") {
    return NextResponse.json({ error: "not allowed" }, { status: 403 });
  }
  const p = new URL(req.url).searchParams;
  const fromM = p.get("month") ?? p.get("from");
  const toM = p.get("month") ?? p.get("to");
  if (!isMonth(fromM) || !isMonth(toM) || toM < fromM) {
    return NextResponse.json({ error: "use ?month=YYYY-MM or ?from=YYYY-MM&to=YYYY-MM" }, { status: 400 });
  }
  const [cats, rows] = await Promise.all([
    getExpenseCategories(),
    getExpenses(monthBounds(fromM).from, monthBounds(toM).to),
  ]);
  const name = new Map(cats.map((c) => [c.id, c.name]));
  const sorted = [...rows].sort((a, b) => a.spent_on.localeCompare(b.spent_on));
  const total = sorted.reduce((s, e) => s + Math.round(e.amount * 100), 0) / 100;
  const csv = toCsv([
    ["Date", "Category", "Vendor", "Note", "Amount (INR)"],
    ...sorted.map((e) => [e.spent_on, name.get(e.category_id) ?? "", e.vendor, e.note, e.amount.toFixed(2)]),
    ["", "", "", "Total", total.toFixed(2)],
  ]);
  const label = fromM === toM ? fromM : `${fromM}_to_${toM}`;
  return new NextResponse("﻿" + csv, {
    headers: {
      "Content-Type": "text/csv; charset=utf-8",
      "Content-Disposition": `attachment; filename="expenses-${label}.csv"`,
      "Cache-Control": "private, no-store",
    },
  });
}
