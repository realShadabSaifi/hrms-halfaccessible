import { describe, expect, it } from "vitest";
import { managerToast } from "./copy";

describe("managerToast", () => {
  it("nests and unassigns with first names", () => {
    expect(managerToast("Zara Khan", "Priya Nair")).toBe("Zara now reports to Priya");
    expect(managerToast("Zara Khan", null)).toBe("Zara is a root");
  });
});
