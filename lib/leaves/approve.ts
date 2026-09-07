import { canDecideLeave } from "@/lib/rls/policies";
import type { ProfileRole } from "@/lib/types";

export function nextLeaveStatus(
  role: ProfileRole,
  action: "approve" | "reject",
): "approved" | "rejected" | null {
  if (!canDecideLeave(role)) return null;
  return action === "approve" ? "approved" : "rejected";
}
