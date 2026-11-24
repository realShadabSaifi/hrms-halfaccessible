import "server-only";
import { cache } from "react";
import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { VERIFIED_USER_HEADER, parseVerifiedUser } from "@/lib/supabase/verifiedUser";
import type { Profile, ProfileRole } from "@/lib/types";

/**
 * The signed-in user's profile. Cached for the request, so the layout, the page and any
 * helpers share one lookup. The middleware has already verified the session with Supabase
 * Auth and passes the user id along, so we only fall back to auth.getUser() if it didn't.
 */
export const getCurrentProfile = cache(async (): Promise<Profile | null> => {
  if (!process.env.NEXT_PUBLIC_SUPABASE_URL || !process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY) {
    return null;
  }
  const supabase = await createClient();
  let userId = parseVerifiedUser((await headers()).get(VERIFIED_USER_HEADER));
  if (!userId) {
    const {
      data: { user },
    } = await supabase.auth.getUser();
    userId = user?.id ?? null;
  }
  if (!userId) return null;
  const { data } = await supabase
    .from("profiles")
    .select(
      "id, manager_id, full_name, designation, department, skills, bio, avatar_color, role, active, joined_at, totp_verified_at, ann_seen_at",
    )
    .eq("id", userId)
    .maybeSingle();
  return (data as Profile | null) ?? null;
});

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
