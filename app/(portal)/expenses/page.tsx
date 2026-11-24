import { ExpensesClient } from "@/components/expenses/ExpensesClient";
import { requireRole } from "@/lib/auth";
import { localDateKey } from "@/lib/attendance/day";
import { getExpenseCategories, getExpenses } from "@/lib/invoices/data";
import { isMonth, monthBounds, shiftMonth } from "@/lib/invoices/expenses";

export default async function ExpensesPage({ searchParams }: { searchParams: Promise<{ month?: string }> }) {
  await requireRole(["cxo"]);
  const today = localDateKey(new Date().toISOString());
  const current = today.slice(0, 7);
  const { month: m } = await searchParams;
  const month = isMonth(m) ? m : current;
  const { from, to } = monthBounds(month);
  const sixAgo = monthBounds(shiftMonth(month, -5)).from;
  const [categories, expenses, recent] = await Promise.all([
    getExpenseCategories(),
    getExpenses(from, to),
    getExpenses(sixAgo, to),
  ]);
  const byMonth = new Map<string, number>();
  for (let i = 5; i >= 0; i--) byMonth.set(shiftMonth(month, -i), 0);
  for (const e of recent) {
    const k = e.spent_on.slice(0, 7);
    byMonth.set(k, (byMonth.get(k) ?? 0) + e.amount);
  }
  return (
    <ExpensesClient
      month={month}
      isCurrent={month === current}
      today={today}
      categories={categories}
      expenses={expenses}
      trend={[...byMonth].map(([k, v]) => ({ month: k, total: Math.round(v * 100) / 100 }))}
    />
  );
}
