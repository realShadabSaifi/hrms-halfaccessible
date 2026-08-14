import { describe, expect, it } from "vitest";
import { isVisiblePerson } from "./visible";

describe("isVisiblePerson", () => {
  it("hides only super_admin", () => {
    expect(isVisiblePerson("super_admin")).toBe(false);
    expect(isVisiblePerson("admin")).toBe(true);
    expect(isVisiblePerson("lead")).toBe(true);
    expect(isVisiblePerson("employee")).toBe(true);
  });
});
