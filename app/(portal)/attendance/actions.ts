"use server";

import { revalidatePath } from "next/cache";
import { requireProfile } from "@/lib/auth";
import { cooldownRemainingMs, lastPunchAt } from "@/lib/attendance/day";
import { checkGeofence, type Fix } from "@/lib/attendance/geofence";
import { rateLimit } from "@/lib/rateLimit";
import { createAdminClient } from "@/lib/supabase/admin";

export type PunchResult = { ok: true } | { ok: false; error: string };

function outsideMessage(distance?: number) {
  return distance === undefined
    ? "you're outside the office premises."
    : `you're about ${distance} m from the office, outside the allowed area.`;
}

async function checkCooldown(userId: string, next: "in" | "out") {
  const admin = createAdminClient();
  const { data } = await admin
    .from("attendance_sessions")
    .select("punch_in_at, punch_out_at")
    .eq("user_id", userId)
    .order("punch_in_at", { ascending: false })
    .limit(1);
  const left = cooldownRemainingMs(lastPunchAt(data ?? []), new Date());
  if (left <= 0) return null;
  return `you can punch ${next} in ${Math.ceil(left / 1000)}s.`;
}

async function checkPremises(fix: Fix) {
  const admin = createAdminClient();
  const { data: office } = await admin
    .from("office_location")
    .select("lat, lng, radius_m")
    .eq("id", 1)
    .maybeSingle();
  if (!office) return { ok: false as const, error: "office location isn't set up yet. ask your super admin." };
  const r = checkGeofence(office, fix);
  if (r.ok) return { ok: true as const, admin, distance_m: r.distance_m };
  if (r.error === "imprecise") {
    return {
      ok: false as const,
      error: "your location is too imprecise. turn on precise location / gps and try again.",
    };
  }
  if (r.error === "bad_location") return { ok: false as const, error: "couldn't read your location." };
  return { ok: false as const, error: outsideMessage(r.distance_m) };
}

export async function punchIn(fix: Fix): Promise<PunchResult> {
  const me = await requireProfile();
  if (!rateLimit(`punch:${me.id}`, 6)) return { ok: false, error: "slow down, try again in a minute." };
  const wait = await checkCooldown(me.id, "in");
  if (wait) return { ok: false, error: wait };
  const gate = await checkPremises(fix);
  if (!gate.ok) return gate;
  const { error } = await gate.admin.from("attendance_sessions").insert({
    user_id: me.id,
    punch_in_lat: fix.lat,
    punch_in_lng: fix.lng,
    punch_in_distance_m: gate.distance_m,
  });
  if (error) {
    return { ok: false, error: error.code === "23505" ? "you're already punched in." : error.message };
  }
  revalidatePath("/");
  revalidatePath("/attendance");
  return { ok: true };
}

export async function punchOut(fix: Fix): Promise<PunchResult> {
  const me = await requireProfile();
  if (!rateLimit(`punch:${me.id}`, 6)) return { ok: false, error: "slow down, try again in a minute." };
  const wait = await checkCooldown(me.id, "out");
  if (wait) return { ok: false, error: wait };
  const gate = await checkPremises(fix);
  if (!gate.ok) return gate;
  const { data, error } = await gate.admin
    .from("attendance_sessions")
    .update({
      punch_out_at: new Date().toISOString(),
      punch_out_lat: fix.lat,
      punch_out_lng: fix.lng,
      punch_out_distance_m: gate.distance_m,
    })
    .eq("user_id", me.id)
    .is("punch_out_at", null)
    .select("id");
  if (error) return { ok: false, error: error.message };
  if (!data?.length) return { ok: false, error: "you're not punched in." };
  revalidatePath("/");
  revalidatePath("/attendance");
  return { ok: true };
}
