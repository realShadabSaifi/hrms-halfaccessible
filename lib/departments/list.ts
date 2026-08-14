import { createAdminClient } from "@/lib/supabase/admin";

export async function departmentNames(): Promise<string[]> {
  const admin = createAdminClient();
  const { data } = await admin.from("departments").select("name").order("sort");
  return (data ?? []).map((row) => row.name as string);
}
