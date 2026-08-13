import { describe, expect, it } from "vitest";
import { roleForNewUser } from "./firstUser";

describe("first user role", () => {
  it("makes the first profile an admin", () => {
    expect(roleForNewUser(0)).toBe("admin");
  });

  it("makes later profiles employees", () => {
    expect(roleForNewUser(1)).toBe("employee");
    expect(roleForNewUser(12)).toBe("employee");
  });
});
