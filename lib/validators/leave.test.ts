import { describe, expect, it } from "vitest";
import { leaveStatusOnSubmit, validateLeave } from "./leave";

const base = {
  type: "personal" as const,
  startsOn: "2026-08-20",
  endsOn: "2026-08-21",
  handoff: "Priya covers standup",
  emergency: false,
};

describe("leave validation", () => {
  it("requires a date range", () => {
    expect(validateLeave({ ...base, startsOn: "", endsOn: "" })).toBe("date range required");
  });

  it("requires handoff unless emergency", () => {
    expect(validateLeave({ ...base, handoff: "" })).toBe("handoff required");
    expect(validateLeave({ ...base, handoff: "", emergency: true })).toBeNull();
    expect(validateLeave({ ...base, type: "emergency", handoff: "" })).toBeNull();
  });

  it("auto-approves emergency", () => {
    expect(leaveStatusOnSubmit({ ...base, emergency: true })).toBe("approved");
    expect(leaveStatusOnSubmit(base)).toBe("pending");
  });
});
