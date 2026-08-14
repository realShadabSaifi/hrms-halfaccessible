import { describe, expect, it } from "vitest";
import { nextLeaveStatus } from "./approve";

describe("leave approval", () => {
  it("blocks employees", () => {
    expect(nextLeaveStatus("employee", "approve")).toBeNull();
  });

  it("lets leads approve or reject", () => {
    expect(nextLeaveStatus("lead", "approve")).toBe("approved");
    expect(nextLeaveStatus("admin", "reject")).toBe("rejected");
    expect(nextLeaveStatus("super_admin", "approve")).toBeNull();
  });
});
