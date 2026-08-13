"use server";

import { revalidatePath } from "next/cache";
import { requireProfile } from "@/lib/auth";
import { canBookCxo } from "@/lib/cxo/book";
import { createClient } from "@/lib/supabase/server";

export async function bookCxo(cxoId: string, topic: string, note: string) {
  const profile = await requireProfile();
  const supabase = await createClient();
  const { data: cxo } = await supabase.from("cxo_windows").select("*").eq("id", cxoId).single();
  if (!cxo || !canBookCxo(cxo.slots_remaining)) {
    return { ok: false as const, error: "no slots left" };
  }
  const { error } = await supabase.from("cxo_bookings").insert({
    cxo_id: cxoId,
    booker_id: profile.id,
    topic,
    note,
    status: "approved",
  });
  if (error) return { ok: false as const, error: error.message };
  await supabase
    .from("cxo_windows")
    .update({ slots_remaining: cxo.slots_remaining - 1 })
    .eq("id", cxoId);
  revalidatePath("/cxo");
  return { ok: true as const };
}
