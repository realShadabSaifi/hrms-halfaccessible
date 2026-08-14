"use server";

import { randomBytes } from "node:crypto";
import { revalidatePath } from "next/cache";
import { requireRole } from "@/lib/auth";
import { validateProfileDetails, type ProfileDetails } from "@/lib/profiles/details";
import { ADMIN_ROLES } from "@/lib/rls/policies";
import { createAdminClient } from "@/lib/supabase/admin";
import type { ProfileRole } from "@/lib/types";
import { validateInvite } from "@/lib/users/invite";

export async function addHuman(input: {
  email: string;
  fullName: string;
  designation: string;
  department: string;
  role: ProfileRole;
}) {
  await requireRole(ADMIN_ROLES);
  const err = validateInvite(input);
  if (err) return { ok: false as const, error: err };
  const admin = createAdminClient();
  const { data, error } = await admin.auth.admin.createUser({
    email: input.email.trim().toLowerCase(),
    password: randomBytes(32).toString("base64url"),
    email_confirm: true,
    user_metadata: { full_name: input.fullName },
  });
  if (error || !data.user) return { ok: false as const, error: error?.message ?? "could not create" };
  await admin
    .from("profiles")
    .update({
      full_name: input.fullName,
      designation: input.designation,
      department: input.department,
      role: input.role,
      skills: [],
      bio: "",
      avatar_color: "#7048B6",
    })
    .eq("id", data.user.id);
  revalidatePath("/users");
  revalidatePath("/team");
  return { ok: true as const };
}

export async function updateHumanDetails(userId: string, details: ProfileDetails) {
  await requireRole(ADMIN_ROLES);
  const err = validateProfileDetails(details);
  if (err) return { ok: false as const, error: err };
  const admin = createAdminClient();
  const { data: target } = await admin.from("profiles").select("role").eq("id", userId).maybeSingle();
  if (!target || target.role === "super_admin") return { ok: false as const, error: "invalid role" };
  const { error } = await admin
    .from("profiles")
    .update({
      full_name: details.full_name.trim(),
      designation: details.designation.trim(),
      department: details.department,
      skills: details.skills,
      bio: details.bio.trim(),
      avatar_color: details.avatar_color,
    })
    .eq("id", userId);
  if (error) return { ok: false as const, error: error.message };
  revalidatePath("/users");
  revalidatePath("/team");
  return { ok: true as const };
}

export async function setRole(userId: string, role: ProfileRole) {
  await requireRole(ADMIN_ROLES);
  if (role === "super_admin") return { ok: false as const, error: "invalid role" };
  const admin = createAdminClient();
  const { data: target } = await admin.from("profiles").select("role").eq("id", userId).maybeSingle();
  if (target?.role === "super_admin") return { ok: false as const, error: "invalid role" };
  await admin.from("profiles").update({ role }).eq("id", userId);
  revalidatePath("/users");
  return { ok: true as const };
}

export async function setActive(userId: string, active: boolean) {
  await requireRole(ADMIN_ROLES);
  const admin = createAdminClient();
  await admin.from("profiles").update({ active }).eq("id", userId);
  await admin.auth.admin.updateUserById(userId, {
    app_metadata: { deactivated: !active },
  });
  revalidatePath("/users");
  return { ok: true as const };
}

export async function resetAuthenticator(userId: string) {
  await requireRole(ADMIN_ROLES);
  const admin = createAdminClient();
  await admin.from("totp_credentials").delete().eq("user_id", userId);
  await admin.from("profiles").update({ totp_verified_at: null }).eq("id", userId);
  const { data } = await admin.auth.admin.getUserById(userId);
  await admin.auth.admin.updateUserById(userId, {
    app_metadata: { ...data.user?.app_metadata, totp_verified: false },
  });
  revalidatePath("/users");
  return { ok: true as const };
}
