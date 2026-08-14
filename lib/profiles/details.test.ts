import { describe, expect, it } from "vitest";
import { validateProfileDetails } from "./details";

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
    expect(validateProfileDetails({ ...ok, full_name: "  " })).toBe("name required");
    expect(validateProfileDetails({ ...ok, department: "Sales" })).toBe("invalid department");
    expect(validateProfileDetails({ ...ok, avatar_color: "#000000" })).toBe("invalid color");
    expect(validateProfileDetails({ ...ok, bio: "x".repeat(281) })).toBe("bio too long");
    expect(validateProfileDetails({ ...ok, skills: ["x".repeat(41)] })).toBe("skill too long");
    expect(validateProfileDetails(ok)).toBeNull();
  });
});
