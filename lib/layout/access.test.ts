import { describe, expect, it } from "vitest";
import { afterAuthPath, canVisitPath } from "./access";

describe("portal access", () => {
  it("sends super_admin to settings and allows user management", () => {
    expect(afterAuthPath("super_admin")).toBe("/settings");
    expect(canVisitPath("super_admin", "/settings")).toBe(true);
    expect(canVisitPath("super_admin", "/users")).toBe(true);
    expect(canVisitPath("super_admin", "/holidays")).toBe(true);
    expect(canVisitPath("super_admin", "/")).toBe(false);
    expect(canVisitPath("super_admin", "/anon")).toBe(false);
  });

  it("keeps admin off settings and on users", () => {
    expect(afterAuthPath("admin")).toBe("/");
    expect(canVisitPath("admin", "/users")).toBe(true);
    expect(canVisitPath("admin", "/settings")).toBe(false);
    expect(canVisitPath("employee", "/users")).toBe(false);
  });

  it("lets everyone visit holidays", () => {
    expect(canVisitPath("employee", "/holidays")).toBe(true);
    expect(canVisitPath("lead", "/holidays")).toBe(true);
    expect(canVisitPath("admin", "/holidays")).toBe(true);
  });

  it("lets only admin visit CXO manage", () => {
    expect(canVisitPath("admin", "/cxo/manage")).toBe(true);
    expect(canVisitPath("admin", "/cxo")).toBe(true);
    expect(canVisitPath("employee", "/cxo/manage")).toBe(false);
    expect(canVisitPath("lead", "/cxo/manage")).toBe(false);
    expect(canVisitPath("super_admin", "/cxo/manage")).toBe(false);
    expect(canVisitPath("employee", "/cxo")).toBe(true);
  });
});
