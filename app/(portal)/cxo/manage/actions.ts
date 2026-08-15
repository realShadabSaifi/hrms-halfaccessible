"use server";

import { revalidatePath } from "next/cache";
import { requireRole } from "@/lib/auth";
import {
  cxoSlotCount,
  formatCxoWindowLabel,
  nextSlotsRemaining,
  validateCxoSlotCount,
  validateCxoWindow,
} from "@/lib/cxo/validate";
import { createAdminClient } from "@/lib/supabase/admin";

function revalidateCxo() {
  revalidatePath("/cxo");
  revalidatePath("/cxo/manage");
}

export async function createCxoWindow(formData: FormData) {
  await requireRole(["admin"]);
  const name = String(formData.get("name") ?? "");
  const title = String(formData.get("title") ?? "");
  const tagline = String(formData.get("tagline") ?? "");
  const date = String(formData.get("date") ?? "");
  const note = String(formData.get("note") ?? "");
  const slots = formData.get("slots");
  const color = String(formData.get("color") ?? "");
  const error = validateCxoWindow({ name, title, tagline, date, note, slots, color });
  if (error) return { ok: false as const, error };
  const admin = createAdminClient();
  const { error: insertError } = await admin.from("cxo_windows").insert({
    name: name.trim(),
    title: title.trim(),
    tagline: tagline.trim(),
    avatar_color: color,
    window_label: formatCxoWindowLabel(date, note),
    slots_remaining: cxoSlotCount(slots),
  });
  if (insertError) return { ok: false as const, error: insertError.message };
  revalidateCxo();
  return { ok: true as const };
}

export async function addCxoSlots(id: string, count: unknown) {
  await requireRole(["admin"]);
  if (!id) return { ok: false as const, error: "missing window" };
  if (validateCxoSlotCount(count)) return { ok: false as const, error: "slots must be 1-20" };
  const admin = createAdminClient();
  const { data } = await admin.from("cxo_windows").select("slots_remaining").eq("id", id).maybeSingle();
  if (!data) return { ok: false as const, error: "missing window" };
  const { error } = await admin
    .from("cxo_windows")
    .update({ slots_remaining: nextSlotsRemaining(data.slots_remaining, cxoSlotCount(count)) })
    .eq("id", id);
  if (error) return { ok: false as const, error: error.message };
  revalidateCxo();
  return { ok: true as const };
}
