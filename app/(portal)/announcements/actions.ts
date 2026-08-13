"use server";

import { revalidatePath } from "next/cache";
import { requireProfile, requireRole } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";

export async function postAnnouncement(input: {
  title: string;
  body: string;
  category: string;
  pinned: boolean;
}) {
  const profile = await requireRole(["lead", "admin"]);
  if (!input.title.trim() || !input.body.trim()) return { ok: false as const, error: "title and body please" };
  const supabase = await createClient();
  const { error } = await supabase.from("announcements").insert({
    author_id: profile.id,
    title: input.title.trim(),
    body: input.body.trim(),
    category: input.category,
    pinned: input.pinned,
  });
  if (error) return { ok: false as const, error: error.message };
  revalidatePath("/announcements");
  revalidatePath("/");
  return { ok: true as const };
}

export async function reactAnnouncement(id: string, emoji: string) {
  const profile = await requireProfile();
  const supabase = await createClient();
  const { data: existing } = await supabase
    .from("announcement_reactions")
    .select("emoji")
    .eq("announcement_id", id)
    .eq("user_id", profile.id)
    .eq("emoji", emoji)
    .maybeSingle();
  if (existing) {
    await supabase
      .from("announcement_reactions")
      .delete()
      .eq("announcement_id", id)
      .eq("user_id", profile.id)
      .eq("emoji", emoji);
  } else {
    await supabase.from("announcement_reactions").insert({
      announcement_id: id,
      user_id: profile.id,
      emoji,
    });
  }
  revalidatePath("/announcements");
  return { ok: true as const };
}

export async function markAnnouncementsSeen() {
  const profile = await requireProfile();
  const supabase = await createClient();
  await supabase.from("profiles").update({ ann_seen_at: new Date().toISOString() }).eq("id", profile.id);
}
