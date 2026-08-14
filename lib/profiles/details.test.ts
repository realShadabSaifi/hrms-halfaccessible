import { describe, expect, it } from "vitest";
import { validateProfileDetails } from "./details";

const depts = ["Engineering", "Design"];
const ok = {
  full_name: "Zara Khan",
  designation: "Chaos Coordinator",
  department: "Design",
  skills: ["Figma", "Motion"],
  bio: "makes things move",
  avatar_color: "#7048B6",
};

describe("profile details", () => {
  it("requires name and a known department and swatch", () => {
    expect(validateProfileDetails({ ...ok, full_name: "  " }, depts)).toBe("name required");
    expect(validateProfileDetails({ ...ok, department: "Sales" }, depts)).toBe("invalid department");
    expect(validateProfileDetails({ ...ok, avatar_color: "#000000" }, depts)).toBe("invalid color");
    expect(validateProfileDetails({ ...ok, bio: "x".repeat(281) }, depts)).toBe("bio too long");
    expect(validateProfileDetails({ ...ok, skills: ["x".repeat(41)] }, depts)).toBe("skill too long");
    expect(validateProfileDetails(ok, depts)).toBeNull();
    expect(validateProfileDetails({ ...ok, department: "Sales" }, ["Sales"])).toBeNull();
    expect(validateProfileDetails({ ...ok, department: "Design" }, ["Sales"])).toBe("invalid department");
  });
});
