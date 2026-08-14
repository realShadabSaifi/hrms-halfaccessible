"use server";

import { revalidatePath } from "next/cache";
import { requireProfile, requireRole } from "@/lib/auth";
import { nextLeaveStatus } from "@/lib/leaves/approve";
import { LEAD_OR_ADMIN_ROLES } from "@/lib/rls/policies";
import { createClient } from "@/lib/supabase/server";
import {
  leaveStatusOnSubmit,
  validateLeave,
  type LeaveInput,
} from "@/lib/validators/leave";
import type { LeaveType } from "@/lib/types";

export async function submitLeave(input: LeaveInput) {
  const profile = await requireProfile();
  const supabase = await createClient();
  const { data: holidayRows } = await supabase.from("company_holidays").select("holiday_on");
  const holidayDates = (holidayRows ?? []).map((r) => r.holiday_on);
  const error = validateLeave(input, holidayDates);
  if (error) return { ok: false as const, error };
  const status = leaveStatusOnSubmit(input);
  const { error: dbError } = await supabase.from("leave_requests").insert({
    requester_id: profile.id,
    type: input.type,
    starts_on: input.startsOn,
    ends_on: input.endsOn,
    reason: input.reason ?? "",
    handoff: input.handoff ?? "",
    emergency: input.emergency || input.type === "emergency",
    status,
  });
  if (dbError) return { ok: false as const, error: dbError.message };
  await supabase.from("activity_events").insert({
    verb: "leave",
    body: `${profile.full_name} submitted ${input.type} leave`,
  });
  revalidatePath("/leaves");
  revalidatePath("/");
  return { ok: true as const };
}

export async function decideLeave(
  id: string,
  action: "approve" | "reject",
  note: string,
) {
  const profile = await requireRole(LEAD_OR_ADMIN_ROLES);
  const status = nextLeaveStatus(profile.role, action);
  if (!status) return { ok: false as const, error: "nope" };
  const supabase = await createClient();
  const { error } = await supabase
    .from("leave_requests")
    .update({
      status,
      decision_note: note,
      decided_by: profile.id,
      decided_at: new Date().toISOString(),
    })
    .eq("id", id);
  if (error) return { ok: false as const, error: error.message };
  revalidatePath("/leaves");
  return { ok: true as const };
}

export type LeaveRow = {
  id: string;
  type: LeaveType;
  starts_on: string;
  ends_on: string;
  reason: string;
  status: "pending" | "approved" | "rejected";
  decision_note: string;
  requester_id: string;
  emergency: boolean;
};
