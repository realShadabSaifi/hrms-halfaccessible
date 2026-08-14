import { TeamClient } from "@/components/team/TeamClient";
import { requireProfile } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import type { Department, Profile } from "@/lib/types";

export default async function TeamPage() {
  const me = await requireProfile();
  const supabase = await createClient();
  const [{ data }, { data: depts }] = await Promise.all([
    supabase.from("profiles").select("*").eq("active", true).neq("role", "super_admin").order("full_name"),
    supabase.from("departments").select("id, name, sort").order("sort"),
  ]);
  return (
    <TeamClient
      members={(data ?? []) as Profile[]}
      me={me.id}
      departments={(depts ?? []) as Department[]}
    />
  );
}
