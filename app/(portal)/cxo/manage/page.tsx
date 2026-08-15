import { CxoManageClient } from "@/components/cxo/CxoManageClient";
import { requireRole } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";

export default async function CxoManagePage() {
  await requireRole(["admin"]);
  const supabase = await createClient();
  const { data } = await supabase
    .from("cxo_windows")
    .select("id, name, title, tagline, avatar_color, window_label, slots_remaining")
    .order("name")
    .order("window_label");
  return <CxoManageClient windows={data ?? []} />;
}
