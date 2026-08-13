import { describe, expect, it } from "vitest";
import { tokens } from "./tokens";

describe("overhaul design tokens", () => {
  it("keeps the brand purple accent", () => {
    expect(tokens.purple).toBe("#5B2D8E");
  });

  it("uses a cool zinc canvas", () => {
    expect(tokens.bg).toBe("#f4f4f5");
  });

  it("uses zinc ink", () => {
    expect(tokens.ink).toBe("#18181b");
  });

  it("does not ship a second teal accent", () => {
    expect(tokens).not.toHaveProperty("teal");
    expect(tokens).not.toHaveProperty("tealLink");
  });

  it("uses the overhaul radius scale", () => {
    expect(tokens.radiusCard).toBe("16px");
    expect(tokens.radiusBtn).toBe("12px");
    expect(tokens.radiusShell).toBe("20px");
  });
});
