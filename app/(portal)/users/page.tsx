import { UsersClient } from "@/components/users/UsersClient";
import { requireRole } from "@/lib/auth";
import { ADMIN_ROLES } from "@/lib/rls/policies";
import { createClient } from "@/lib/supabase/server";
import type { Profile } from "@/lib/types";

export default async function UsersPage() {
  const me = await requireRole(ADMIN_ROLES);
  const supabase = await createClient();
  const { data } = await supabase.from("profiles").select("*").order("full_name");
  return <UsersClient rows={(data ?? []) as Profile[]} me={me.id} />;
}
