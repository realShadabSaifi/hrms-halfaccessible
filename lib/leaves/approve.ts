import { canDecideLeave } from "@/lib/rls/policies";
import type { LeaveStatus, ProfileRole } from "@/lib/types";

export function nextLeaveStatus(
  role: ProfileRole,
  action: "approve" | "reject",
): LeaveStatus | null {
  if (!canDecideLeave(role)) return null;
  return action === "approve" ? "approved" : "rejected";
}
