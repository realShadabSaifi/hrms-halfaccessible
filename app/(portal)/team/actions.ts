"use server";

import { revalidatePath } from "next/cache";
import { requireProfile } from "@/lib/auth";
import { validateProfileDetails, type ProfileDetails } from "@/lib/profiles/details";
import { createClient } from "@/lib/supabase/server";

export async function saveProfile(details: ProfileDetails) {
  const profile = await requireProfile();
  const err = validateProfileDetails(details);
  if (err) return { ok: false as const, error: err };
  const supabase = await createClient();
  const { error } = await supabase
    .from("profiles")
    .update({
      full_name: details.full_name.trim(),
      designation: details.designation.trim(),
      department: details.department,
      skills: details.skills,
      bio: details.bio.trim(),
      avatar_color: details.avatar_color,
    })
    .eq("id", profile.id);
  if (error) return { ok: false as const, error: error.message };
  revalidatePath("/team");
  revalidatePath("/");
  return { ok: true as const };
}
