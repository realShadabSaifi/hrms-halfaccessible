import { createClient } from "@/lib/supabase/server";
import type { AppSettings } from "@/lib/types";

export const DEFAULT_APP_NAME = "halfAccessible";

export function logoPublicUrl(path: string | null): string | null {
  if (!path) return null;
  const base = process.env.NEXT_PUBLIC_SUPABASE_URL?.replace(/\/$/, "");
  if (!base) return null;
  return `${base}/storage/v1/object/public/branding/${path}`;
}

export function normalizeSettings(
  row: { app_name?: string | null; logo_path?: string | null } | null,
): AppSettings {
  const app_name = row?.app_name?.trim() || DEFAULT_APP_NAME;
  const logo_path = row?.logo_path ?? null;
  return { app_name, logo_path, logo_url: logoPublicUrl(logo_path) };
}

export async function getAppSettings(): Promise<AppSettings> {
  try {
    const supabase = await createClient();
    const { data } = await supabase
      .from("app_settings")
      .select("app_name, logo_path")
      .eq("id", 1)
      .maybeSingle();
    return normalizeSettings(data);
  } catch {
    return normalizeSettings(null);
  }
}
