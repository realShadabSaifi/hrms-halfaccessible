import "server-only";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import type { Profile, ProfileRole } from "@/lib/types";

export async function getCurrentProfile(): Promise<Profile | null> {
  if (!process.env.NEXT_PUBLIC_SUPABASE_URL || !process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY) {
    return null;
  }
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return null;
  const { data } = await supabase
    .from("profiles")
    .select(
      "id, full_name, designation, department, skills, bio, avatar_color, role, active, joined_at, totp_verified_at, ann_seen_at",
    )
    .eq("id", user.id)
    .maybeSingle();
  return (data as Profile | null) ?? null;
}

export async function requireProfile(): Promise<Profile> {
  const profile = await getCurrentProfile();
  if (!profile || !profile.active) redirect("/login");
  if (!profile.totp_verified_at) redirect("/signup");
  return profile;
}

export async function requireRole(roles: ProfileRole[]): Promise<Profile> {
  const profile = await requireProfile();
  if (!roles.includes(profile.role)) redirect("/");
  return profile;
}
