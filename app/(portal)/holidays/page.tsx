import { HolidaysClient } from "@/components/holidays/HolidaysClient";
import { requireProfile } from "@/lib/auth";
import { canManageHolidays } from "@/lib/rls/policies";
import { createClient } from "@/lib/supabase/server";
import type { CompanyHoliday } from "@/lib/types";

export default async function HolidaysPage() {
  const me = await requireProfile();
  const supabase = await createClient();
  const { data } = await supabase
    .from("company_holidays")
    .select("id, holiday_on, title, created_by, created_at")
    .order("holiday_on");
  return (
    <HolidaysClient
      holidays={(data ?? []) as CompanyHoliday[]}
      canManage={canManageHolidays(me.role)}
    />
  );
}
