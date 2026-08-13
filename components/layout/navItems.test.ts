import { describe, expect, it } from "vitest";
import { getNavItems } from "@/lib/layout/navItems";

describe("getNavItems", () => {
  it("gives employees 8 items and no user management", () => {
    const items = getNavItems("employee", 0);
    expect(items).toHaveLength(8);
    expect(items.some((i) => i.id === "users")).toBe(false);
  });

  it("gives admins 9 items including user management", () => {
    const items = getNavItems("admin", 2);
    expect(items).toHaveLength(9);
    expect(items.some((i) => i.id === "users")).toBe(true);
    expect(items.find((i) => i.id === "ann")?.badge).toBe(2);
  });
});
