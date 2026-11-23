import { createClient } from "@/lib/supabase/server";

export type OfficeLocation = { label: string; lat: number; lng: number; radius_m: number };

export async function getOfficeLocation(): Promise<OfficeLocation | null> {
  const supabase = await createClient();
  const { data } = await supabase
    .from("office_location")
    .select("label, lat, lng, radius_m")
    .eq("id", 1)
    .maybeSingle();
  return data ?? null;
}
