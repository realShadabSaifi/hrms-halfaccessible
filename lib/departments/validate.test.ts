import { describe, expect, it } from "vitest";
import { departmentTaken, removeDepartmentError, validateDepartmentName } from "./validate";

describe("department name", () => {
  it("requires a trimmed name of at most 40 chars", () => {
    expect(validateDepartmentName("  ")).toBe("name required");
    expect(validateDepartmentName("x".repeat(41))).toBe("name too long");
    expect(validateDepartmentName("Sales")).toBeNull();
  });

  it("treats names as taken case-insensitively", () => {
    expect(departmentTaken("engineering", ["Engineering", "Design"])).toBe(true);
    expect(departmentTaken("Sales", ["Engineering"])).toBe(false);
  });

  it("blocks remove when in use or last", () => {
    expect(removeDepartmentError({ inUseCount: 2, totalCount: 5 })).toBe("move people first");
    expect(removeDepartmentError({ inUseCount: 0, totalCount: 1 })).toBe("keep at least one");
    expect(removeDepartmentError({ inUseCount: 0, totalCount: 3 })).toBeNull();
  });
});
