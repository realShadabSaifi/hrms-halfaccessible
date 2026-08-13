import { describe, expect, it } from "vitest";
import { validateInvite } from "./invite";

describe("admin invite", () => {
  it("requires name and email", () => {
    expect(
      validateInvite({ fullName: "", email: "a@b.com", role: "employee" }),
    ).toBe("name required");
    expect(
      validateInvite({ fullName: "Zara Khan", email: "nope", role: "employee" }),
    ).toBe("invalid_email");
    expect(
      validateInvite({
        fullName: "Zara Khan",
        email: "zara@halfaccessible.com",
        role: "lead",
      }),
    ).toBeNull();
  });
});
