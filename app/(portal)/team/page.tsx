import { TeamClient } from "@/components/team/TeamClient";
import { requireProfile } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import type { Profile } from "@/lib/types";

export default async function TeamPage() {
  const me = await requireProfile();
  const supabase = await createClient();
  const { data } = await supabase.from("profiles").select("*").eq("active", true).order("full_name");
  return <TeamClient members={(data ?? []) as Profile[]} me={me.id} />;
}
