import { describe, expect, it } from "vitest";
import { getNavItems } from "@/lib/layout/navItems";

describe("getNavItems", () => {
  it("gives employees 9 items including holidays and no user management", () => {
    const items = getNavItems("employee", 0);
    expect(items).toHaveLength(9);
    expect(items.some((i) => i.id === "holidays")).toBe(true);
    expect(items.some((i) => i.id === "users")).toBe(false);
    expect(items.some((i) => i.id === "cxo-windows")).toBe(false);
  });

  it("gives admins 11 items including holidays, user management, and CXO windows", () => {
    const items = getNavItems("admin", 2);
    expect(items).toHaveLength(11);
    expect(items.some((i) => i.id === "holidays")).toBe(true);
    expect(items.some((i) => i.id === "users")).toBe(true);
    expect(items.some((i) => i.id === "settings")).toBe(false);
    expect(items.find((i) => i.id === "ann")?.badge).toBe(2);
    const ids = items.map((i) => i.id);
    expect(ids.indexOf("cxo-windows")).toBe(ids.indexOf("users") + 1);
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

  it("gives cxo the same nav as admin", () => {
    const admin = getNavItems("admin", 2).map((i) => i.id);
    const cxo = getNavItems("cxo", 2).map((i) => i.id);
    expect(cxo).toHaveLength(11);
    expect(cxo).toEqual(admin);
    expect(cxo.indexOf("cxo-windows")).toBe(cxo.indexOf("users") + 1);
  });

  it("uses v2 canvas titles", () => {
    const items = getNavItems("admin");
    expect(items.find((i) => i.id === "burgers")?.title).toBe("burger holidays 🍔");
    expect(items.find((i) => i.id === "users")?.sub).toBe("admin only. handle with care 🧤");
    expect(items.find((i) => i.id === "holidays")?.title).toBe("holiday calendar");
    expect(items.find((i) => i.id === "cxo-windows")?.title).toBe("CXO windows");
    expect(items.find((i) => i.id === "cxo-windows")?.sub).toBe("drop a window. add slots.");
    expect(items.find((i) => i.id === "cxo-windows")?.href).toBe("/cxo/manage");
  });
});
