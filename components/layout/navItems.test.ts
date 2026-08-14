import { describe, expect, it } from "vitest";
import { getNavItems } from "@/lib/layout/navItems";

describe("getNavItems", () => {
  it("gives employees 9 items including holidays and no user management", () => {
    const items = getNavItems("employee", 0);
    expect(items).toHaveLength(9);
    expect(items.some((i) => i.id === "holidays")).toBe(true);
    expect(items.some((i) => i.id === "users")).toBe(false);
  });

  it("gives admins 10 items including holidays and user management but not portal config", () => {
    const items = getNavItems("admin", 2);
    expect(items).toHaveLength(10);
    expect(items.some((i) => i.id === "holidays")).toBe(true);
    expect(items.some((i) => i.id === "users")).toBe(true);
    expect(items.some((i) => i.id === "settings")).toBe(false);
    expect(items.find((i) => i.id === "ann")?.badge).toBe(2);
  });

  it("gives super_admin portal config, user management, and holidays", () => {
    expect(getNavItems("super_admin", 2).map((i) => i.id)).toEqual([
      "settings",
      "users",
      "holidays",
    ]);
  });

  it("hides portal config from employees", () => {
    expect(getNavItems("employee").some((i) => i.id === "settings")).toBe(false);
  });

  it("uses v2 canvas titles", () => {
    const items = getNavItems("admin");
    expect(items.find((i) => i.id === "burgers")?.title).toBe("burger holidays 🍔");
    expect(items.find((i) => i.id === "users")?.sub).toBe("admin only. handle with care 🧤");
    expect(items.find((i) => i.id === "holidays")?.title).toBe("holiday calendar");
  });
});
