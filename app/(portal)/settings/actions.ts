"use server";

import { randomBytes } from "node:crypto";
import { revalidatePath } from "next/cache";
import { requireRole } from "@/lib/auth";
import { logoExtension, validateAppName, validateLogoFile } from "@/lib/branding/validate";
import { createAdminClient } from "@/lib/supabase/admin";

function revalidateBrand() {
  revalidatePath("/", "layout");
  revalidatePath("/login");
  revalidatePath("/signup");
  revalidatePath("/anon");
  revalidatePath("/settings");
}

export async function updateAppName(formData: FormData) {
  const me = await requireRole(["super_admin"]);
  const err = validateAppName(String(formData.get("app_name") ?? ""));
  if (err) return { ok: false as const, error: err };
  const admin = createAdminClient();
  const { error } = await admin
    .from("app_settings")
    .update({
      app_name: String(formData.get("app_name")).trim(),
      updated_at: new Date().toISOString(),
      updated_by: me.id,
    })
    .eq("id", 1);
  if (error) return { ok: false as const, error: error.message };
  revalidateBrand();
  return { ok: true as const };
}

export async function uploadLogo(formData: FormData) {
  const me = await requireRole(["super_admin"]);
  const file = formData.get("logo");
  if (!(file instanceof File)) return { ok: false as const, error: "file required" };
  const err = validateLogoFile({ type: file.type, size: file.size });
  if (err) return { ok: false as const, error: err };
  const ext = logoExtension(file.type);
  if (!ext) return { ok: false as const, error: "unsupported file type" };

  const admin = createAdminClient();
  const { data: current } = await admin
    .from("app_settings")
    .select("logo_path")
    .eq("id", 1)
    .maybeSingle();

  const path = `logo-${randomBytes(8).toString("hex")}.${ext}`;
  const { error: upErr } = await admin.storage.from("branding").upload(path, file, {
    contentType: file.type,
    upsert: false,
  });
  if (upErr) return { ok: false as const, error: upErr.message };

  const { error } = await admin
    .from("app_settings")
    .update({
      logo_path: path,
      updated_at: new Date().toISOString(),
      updated_by: me.id,
    })
    .eq("id", 1);
  if (error) return { ok: false as const, error: error.message };

  if (current?.logo_path) {
    await admin.storage.from("branding").remove([current.logo_path]);
  }
  revalidateBrand();
  return { ok: true as const };
}

export async function removeLogo() {
  const me = await requireRole(["super_admin"]);
  const admin = createAdminClient();
  const { data: current } = await admin
    .from("app_settings")
    .select("logo_path")
    .eq("id", 1)
    .maybeSingle();
  if (current?.logo_path) {
    await admin.storage.from("branding").remove([current.logo_path]);
  }
  const { error } = await admin
    .from("app_settings")
    .update({
      logo_path: null,
      updated_at: new Date().toISOString(),
      updated_by: me.id,
    })
    .eq("id", 1);
  if (error) return { ok: false as const, error: error.message };
  revalidateBrand();
  return { ok: true as const };
}
