import { overlappingHolidays } from "@/lib/holidays/dates";
import type { LeaveType } from "@/lib/types";

export type LeaveInput = {
  type: LeaveType;
  startsOn: string;
  endsOn: string;
  reason?: string;
  handoff?: string;
  emergency: boolean;
};

export function isEmergencyLeave(input: Pick<LeaveInput, "type" | "emergency">): boolean {
  return input.emergency || input.type === "emergency";
}

export function validateLeave(input: LeaveInput, holidayDates: string[] = []): string | null {
  if (!input.startsOn || !input.endsOn) return "date range required";
  if (input.endsOn < input.startsOn) return "end before start";
  if (!isEmergencyLeave(input) && !input.handoff?.trim()) return "handoff required";
  if (overlappingHolidays(input.startsOn, input.endsOn, holidayDates).length) {
    return "that's already a holiday";
  }
  return null;
}

export function leaveStatusOnSubmit(input: LeaveInput): "pending" | "approved" {
  return isEmergencyLeave(input) ? "approved" : "pending";
}

export const LEAVE_TYPES: { type: LeaveType; name: string; emoji: string; note: string }[] = [
  { type: "sick", name: "Sick", emoji: "🤒", note: "self-certified. no questions asked. seriously." },
  { type: "personal", name: "Personal", emoji: "🌴", note: "inform + pass your work along. then vanish." },
  { type: "festival", name: "Festival", emoji: "🪔", note: "all festivals are holidays. submit via portal." },
  { type: "emergency", name: "Emergency", emoji: "🚨", note: "just go. inform later if you can. zero compromise." },
  { type: "other", name: "Other", emoji: "🎲", note: "life is weird. this covers it." },
];
