"use server";

import { randomBytes } from "node:crypto";
import { revalidatePath } from "next/cache";
import { requireRole } from "@/lib/auth";
import { departmentNames } from "@/lib/departments/list";
import { departmentTaken, validateDepartmentName } from "@/lib/departments/validate";
import { validateManager } from "@/lib/hierarchy/validate";
import { validateProfileDetails, type ProfileDetails } from "@/lib/profiles/details";
import { isVisiblePerson } from "@/lib/profiles/visible";
import { USER_MANAGER_ROLES } from "@/lib/rls/policies";
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
  await requireRole(USER_MANAGER_ROLES);
  const err = validateInvite(input);
  if (err) return { ok: false as const, error: err };
  const names = await departmentNames();
  if (!names.includes(input.department)) return { ok: false as const, error: "invalid department" };
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
  await requireRole(USER_MANAGER_ROLES);
  const err = validateProfileDetails(details, await departmentNames());
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
  await requireRole(USER_MANAGER_ROLES);
  if (role === "super_admin") return { ok: false as const, error: "invalid role" };
  const admin = createAdminClient();
  const { data: target } = await admin.from("profiles").select("role").eq("id", userId).maybeSingle();
  if (target?.role === "super_admin") return { ok: false as const, error: "invalid role" };
  await admin.from("profiles").update({ role }).eq("id", userId);
  revalidatePath("/users");
  return { ok: true as const };
}

export async function setManager(personId: string, managerId: string | null) {
  await requireRole(USER_MANAGER_ROLES);
  const admin = createAdminClient();
  const { data } = await admin.from("profiles").select("id, manager_id, role");
  const people = (data ?? []).filter((p) => isVisiblePerson(p.role as ProfileRole));
  const err = validateManager(personId, managerId, people);
  if (err) return { ok: false as const, error: err };
  const current = people.find((p) => p.id === personId);
  if ((current?.manager_id ?? null) === managerId) return { ok: true as const };
  const { error } = await admin.from("profiles").update({ manager_id: managerId }).eq("id", personId);
  if (error) return { ok: false as const, error: error.message };
  revalidatePath("/users");
  revalidatePath("/team");
  return { ok: true as const };
}

export async function setActive(userId: string, active: boolean) {
  await requireRole(USER_MANAGER_ROLES);
  const admin = createAdminClient();
  const { error } = await admin.rpc("set_profile_active", { p_id: userId, p_active: active });
  if (error) return { ok: false as const, error: error.message };
  await admin.auth.admin.updateUserById(userId, {
    app_metadata: { deactivated: !active },
  });
  revalidatePath("/users");
  revalidatePath("/team");
  return { ok: true as const };
}

export async function resetAuthenticator(userId: string) {
  await requireRole(USER_MANAGER_ROLES);
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

export async function addDepartment(name: string) {
  await requireRole(["super_admin"]);
  const err = validateDepartmentName(name);
  if (err) return { ok: false as const, error: err };
  const admin = createAdminClient();
  const names = await departmentNames();
  if (departmentTaken(name, names)) return { ok: false as const, error: "name taken" };
  const { data: last } = await admin
    .from("departments")
    .select("sort")
    .order("sort", { ascending: false })
    .limit(1)
    .maybeSingle();
  const { error } = await admin.from("departments").insert({
    name: name.trim(),
    sort: (last?.sort ?? 0) + 1,
  });
  if (error) return { ok: false as const, error: error.message };
  revalidatePath("/users");
  revalidatePath("/team");
  return { ok: true as const };
}

export async function renameDepartment(id: string, name: string) {
  await requireRole(["super_admin"]);
  const err = validateDepartmentName(name);
  if (err) return { ok: false as const, error: err };
  const admin = createAdminClient();
  const others = (await admin.from("departments").select("name").neq("id", id)).data ?? [];
  if (departmentTaken(name, others.map((r) => r.name))) {
    return { ok: false as const, error: "name taken" };
  }
  const { error } = await admin.rpc("rename_department", {
    p_id: id,
    p_name: name.trim(),
  });
  if (error) return { ok: false as const, error: error.message };
  revalidatePath("/users");
  revalidatePath("/team");
  return { ok: true as const };
}

export async function removeDepartment(id: string) {
  await requireRole(["super_admin"]);
  const admin = createAdminClient();
  const { error } = await admin.rpc("remove_department", { p_id: id });
  if (error) return { ok: false as const, error: error.message };
  revalidatePath("/users");
  revalidatePath("/team");
  return { ok: true as const };
}
