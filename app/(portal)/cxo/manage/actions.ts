"use server";

import { revalidatePath } from "next/cache";
import { requireRole } from "@/lib/auth";
import { cxoNameFromRoster } from "@/lib/cxo/person";
import {
  CXO_SLOT_TAGLINE,
  cxoColorFromProfile,
  cxoSlotCount,
  cxoSlotStarts,
  cxoTitleFromDesignation,
  validateCxoWindow,
} from "@/lib/cxo/validate";
import { ADMIN_ROLES } from "@/lib/rls/policies";
import { createAdminClient } from "@/lib/supabase/admin";

function revalidateCxo() {
  revalidatePath("/cxo");
  revalidatePath("/cxo/manage");
}

export async function createCxoWindow(formData: FormData) {
  await requireRole(ADMIN_ROLES);
  const cxoId = String(formData.get("cxo_id") ?? "");
  const start = String(formData.get("start") ?? "");
  const slots = formData.get("slots");
  const admin = createAdminClient();
  const { data: person } = await admin
    .from("profiles")
    .select("id, full_name, role, designation, avatar_color, active")
    .eq("id", cxoId)
    .maybeSingle();
  if (!person?.active) return { ok: false as const, error: "cxo required" };
  const name = cxoNameFromRoster(cxoId, [person]);
  if (!name) return { ok: false as const, error: "cxo required" };
  const error = validateCxoWindow({ name, start, slots });
  if (error) return { ok: false as const, error };
  const rows = cxoSlotStarts(start, cxoSlotCount(slots)).map((window_label) => ({
    name,
    title: cxoTitleFromDesignation(person.designation),
    tagline: CXO_SLOT_TAGLINE,
    avatar_color: cxoColorFromProfile(person.avatar_color),
    window_label,
    slots_remaining: 1,
  }));
  const { error: insertError } = await admin.from("cxo_windows").insert(rows);
  if (insertError) return { ok: false as const, error: insertError.message };
  revalidateCxo();
  return { ok: true as const };
}
