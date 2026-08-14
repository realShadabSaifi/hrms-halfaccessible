import { describe, expect, it } from "vitest";
import { afterAuthPath, canVisitPath } from "./access";

describe("portal access", () => {
  it("sends super_admin to settings and nowhere else", () => {
    expect(afterAuthPath("super_admin")).toBe("/settings");
    expect(canVisitPath("super_admin", "/settings")).toBe(true);
    expect(canVisitPath("super_admin", "/")).toBe(false);
    expect(canVisitPath("super_admin", "/users")).toBe(false);
    expect(canVisitPath("super_admin", "/anon")).toBe(false);
  });

  it("keeps admin off settings and on users", () => {
    expect(afterAuthPath("admin")).toBe("/");
    expect(canVisitPath("admin", "/users")).toBe(true);
    expect(canVisitPath("admin", "/settings")).toBe(false);
    expect(canVisitPath("employee", "/users")).toBe(false);
  });
});
