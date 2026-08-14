import { describe, expect, it } from "vitest";
import { getNavItems } from "@/lib/layout/navItems";

describe("getNavItems", () => {
  it("gives employees 8 items and no user management", () => {
    const items = getNavItems("employee", 0);
    expect(items).toHaveLength(8);
    expect(items.some((i) => i.id === "users")).toBe(false);
  });

  it("gives admins 9 items including user management but not portal config", () => {
    const items = getNavItems("admin", 2);
    expect(items).toHaveLength(9);
    expect(items.some((i) => i.id === "users")).toBe(true);
    expect(items.some((i) => i.id === "settings")).toBe(false);
    expect(items.find((i) => i.id === "ann")?.badge).toBe(2);
  });

  it("gives super_admin portal config and user management", () => {
    const items = getNavItems("super_admin", 2);
    expect(items.map((i) => i.id)).toEqual(["settings", "users"]);
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
