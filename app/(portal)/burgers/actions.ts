"use server";

import { revalidatePath } from "next/cache";
import { requireProfile, requireRole } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";

export async function proposeHoliday(date: string, reason: string) {
  const profile = await requireProfile();
  if (!date || !reason.trim()) return { ok: false as const, error: "date and pitch required" };
  const supabase = await createClient();
  const holidayOn = date;
  const title = reason.trim().slice(0, 80);
  const { error } = await supabase.from("burger_holidays").insert({
    proposed_by: profile.id,
    holiday_on: holidayOn,
    title,
    reason: reason.trim(),
    voting_closes_at: new Date(Date.now() + 48 * 3600_000).toISOString(),
    status: "voting",
  });
  if (error) return { ok: false as const, error: error.message };
  await supabase.from("activity_events").insert({
    verb: "burger",
    body: `${profile.full_name} proposed a burger holiday`,
  });
  revalidatePath("/burgers");
  return { ok: true as const };
}

export async function voteHoliday(id: string, choice: "yes" | "no") {
  const profile = await requireProfile();
  const supabase = await createClient();
  const { error } = await supabase.from("burger_votes").upsert({
    holiday_id: id,
    voter_id: profile.id,
    choice,
  });
  if (error) return { ok: false as const, error: error.message };
  revalidatePath("/burgers");
  return { ok: true as const, rain: choice === "yes" };
}

export async function overrideHoliday(id: string, status: "approved" | "rejected") {
  await requireRole(["admin"]);
  const supabase = await createClient();
  const { error } = await supabase
    .from("burger_holidays")
    .update({ status, admin_override: true })
    .eq("id", id);
  if (error) return { ok: false as const, error: error.message };
  revalidatePath("/burgers");
  return { ok: true as const, rain: status === "approved" };
}
