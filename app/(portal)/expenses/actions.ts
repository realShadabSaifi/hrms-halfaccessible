"use server";

import { revalidatePath } from "next/cache";
import { requireRole } from "@/lib/auth";
import { type ExpenseInput, validateExpense } from "@/lib/invoices/validate";
import { createAdminClient } from "@/lib/supabase/admin";

type Result = { ok: true } | { ok: false; error: string };

export async function addExpense(input: ExpenseInput): Promise<Result> {
  const me = await requireRole(["cxo"]);
  const err = validateExpense(input);
  if (err) return { ok: false, error: err };
  const admin = createAdminClient();
  const { error } = await admin.from("expenses").insert({
    spent_on: input.spent_on,
    amount: Math.round(input.amount * 100) / 100,
    category_id: input.category_id,
    vendor: input.vendor.trim().slice(0, 120),
    note: input.note.trim().slice(0, 500),
    created_by: me.id,
  });
  if (error) return { ok: false, error: error.message };
  revalidatePath("/expenses");
  return { ok: true };
}

export async function deleteExpense(id: string): Promise<Result> {
  await requireRole(["cxo"]);
  const admin = createAdminClient();
  const { error } = await admin.from("expenses").delete().eq("id", id);
  if (error) return { ok: false, error: error.message };
  revalidatePath("/expenses");
  return { ok: true };
}

export async function addCategory(name: string): Promise<Result> {
  await requireRole(["cxo"]);
  const n = name.trim();
  if (!n) return { ok: false, error: "category name is required" };
  if (n.length > 40) return { ok: false, error: "category name too long" };
  const admin = createAdminClient();
  const { error } = await admin.from("expense_categories").insert({ name: n, sort: 50 });
  if (error) return { ok: false, error: error.code === "23505" ? "that category already exists" : error.message };
  revalidatePath("/expenses");
  return { ok: true };
}
