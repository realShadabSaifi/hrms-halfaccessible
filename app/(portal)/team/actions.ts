"use server";

import { revalidatePath } from "next/cache";
import { requireProfile } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";

export async function saveProfile(bio: string, avatar_color: string) {
  const profile = await requireProfile();
  const supabase = await createClient();
  await supabase.from("profiles").update({ bio, avatar_color }).eq("id", profile.id);
  revalidatePath("/team");
  return { ok: true as const };
}
