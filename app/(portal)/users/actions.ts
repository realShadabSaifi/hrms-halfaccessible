"use server";

import { randomBytes } from "node:crypto";
import { revalidatePath } from "next/cache";
import { requireRole } from "@/lib/auth";
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
  await requireRole(["admin"]);
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
    })
    .eq("id", data.user.id);
  revalidatePath("/users");
  revalidatePath("/team");
  return { ok: true as const };
}

export async function setRole(userId: string, role: ProfileRole) {
  await requireRole(["admin"]);
  const admin = createAdminClient();
  await admin.from("profiles").update({ role }).eq("id", userId);
  revalidatePath("/users");
  return { ok: true as const };
}

export async function setActive(userId: string, active: boolean) {
  await requireRole(["admin"]);
  const admin = createAdminClient();
  await admin.from("profiles").update({ active }).eq("id", userId);
  await admin.auth.admin.updateUserById(userId, {
    app_metadata: { deactivated: !active },
  });
  revalidatePath("/users");
  return { ok: true as const };
}

export async function resetAuthenticator(userId: string) {
  await requireRole(["admin"]);
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
