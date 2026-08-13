import { describe, expect, it } from "vitest";
import { matchesMember } from "./search";

const priya = {
  full_name: "Priya Nair",
  designation: "Design Lead",
  department: "Design",
  skills: ["Figma", "Motion"],
};

describe("team search", () => {
  it("matches name, role, dept, and skills", () => {
    expect(matchesMember(priya, "priya")).toBe(true);
    expect(matchesMember(priya, "figma")).toBe(true);
    expect(matchesMember(priya, "engineering")).toBe(false);
  });
});
