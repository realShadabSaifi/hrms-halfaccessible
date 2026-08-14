import { UsersClient } from "@/components/users/UsersClient";
import { requireRole } from "@/lib/auth";
import { canManageDepartments, USER_MANAGER_ROLES } from "@/lib/rls/policies";
import { createClient } from "@/lib/supabase/server";
import type { Department, Profile } from "@/lib/types";

export default async function UsersPage() {
  const me = await requireRole(USER_MANAGER_ROLES);
  const supabase = await createClient();
  const [{ data }, { data: depts }] = await Promise.all([
    supabase.from("profiles").select("*").order("full_name"),
    supabase.from("departments").select("id, name, sort").order("sort"),
  ]);
  return (
    <UsersClient
      rows={(data ?? []) as Profile[]}
      me={me.id}
      departments={(depts ?? []) as Department[]}
      canManageDepartments={canManageDepartments(me.role)}
    />
  );
}
