import { describe, expect, it } from "vitest";
import { getNavItems } from "@/lib/layout/navItems";

describe("getNavItems", () => {
  it("gives employees 8 items and no user management", () => {
    const items = getNavItems("employee", 0);
    expect(items).toHaveLength(8);
    expect(items.some((i) => i.id === "users")).toBe(false);
  });

  it("gives admins 10 items including user management and portal config", () => {
    const items = getNavItems("admin", 2);
    expect(items).toHaveLength(10);
    expect(items.some((i) => i.id === "users")).toBe(true);
    expect(items.some((i) => i.id === "settings")).toBe(true);
    expect(items.find((i) => i.id === "ann")?.badge).toBe(2);
  });

  it("hides portal config from employees", () => {
    expect(getNavItems("employee").some((i) => i.id === "settings")).toBe(false);
  });

  it("uses v2 canvas titles", () => {
    const items = getNavItems("admin");
    expect(items.find((i) => i.id === "burgers")?.title).toBe("burger holidays 🍔");
    expect(items.find((i) => i.id === "users")?.sub).toBe("admin only. handle with care 🧤");
  });
});
