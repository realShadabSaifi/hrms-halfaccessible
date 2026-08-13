import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import type { Profile, ProfileRole } from "@/lib/types";

export async function getCurrentProfile(): Promise<Profile | null> {
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

export function initials(name: string): string {
  const parts = name.trim().split(/\s+/).filter(Boolean);
  if (parts.length === 0) return "?";
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
  return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
}
