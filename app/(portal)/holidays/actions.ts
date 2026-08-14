"use server";

import { revalidatePath } from "next/cache";
import { requireRole } from "@/lib/auth";
import { holidayDateTaken, validateHolidayDate, validateHolidayTitle } from "@/lib/holidays/validate";
import { USER_MANAGER_ROLES } from "@/lib/rls/policies";
import { createAdminClient } from "@/lib/supabase/admin";
import { createClient } from "@/lib/supabase/server";

export async function markHoliday(formData: FormData) {
  const me = await requireRole(USER_MANAGER_ROLES);
  const holidayOn = String(formData.get("holiday_on") ?? "");
  const title = String(formData.get("title") ?? "");
  const dateErr = validateHolidayDate(holidayOn);
  if (dateErr) return { ok: false as const, error: dateErr };
  const titleErr = validateHolidayTitle(title);
  if (titleErr) return { ok: false as const, error: titleErr };
  const supabase = await createClient();
  const { data: existing } = await supabase.from("company_holidays").select("holiday_on");
  if (holidayDateTaken(holidayOn, (existing ?? []).map((r) => r.holiday_on))) {
    return { ok: false as const, error: "already a holiday" };
  }
  const admin = createAdminClient();
  const { error } = await admin.from("company_holidays").insert({
    holiday_on: holidayOn,
    title: title.trim(),
    created_by: me.id,
  });
  if (error) return { ok: false as const, error: error.message };
  revalidatePath("/holidays");
  revalidatePath("/leaves");
  return { ok: true as const };
}

export async function unmarkHoliday(id: string) {
  await requireRole(USER_MANAGER_ROLES);
  if (!id) return { ok: false as const, error: "missing holiday" };
  const admin = createAdminClient();
  const { error } = await admin.from("company_holidays").delete().eq("id", id);
  if (error) return { ok: false as const, error: error.message };
  revalidatePath("/holidays");
  revalidatePath("/leaves");
  return { ok: true as const };
}
