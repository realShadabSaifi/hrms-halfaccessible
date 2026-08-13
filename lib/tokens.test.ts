import { describe, expect, it } from "vitest";
import { tokens } from "./tokens";

describe("v2 canvas tokens", () => {
  it("uses the canvas canvas, ink, and purple", () => {
    expect(tokens.bg).toBe("#F6F6FA");
    expect(tokens.ink).toBe("#1C1C2E");
    expect(tokens.purple).toBe("#5B2D8E");
    expect(tokens.purpleHover).toBe("#6B3AA3");
  });

  it("restores teal as the second accent", () => {
    expect(tokens.teal).toBe("#00816F");
    expect(tokens.tealBar).toBe("#009B8D");
  });

  it("uses the canvas radius scale", () => {
    expect(tokens.radiusCard).toBe("20px");
    expect(tokens.radiusBtn).toBe("14px");
    expect(tokens.radiusInput).toBe("10px");
  });

  it("does not advertise Geist as the type stack", () => {
    expect(tokens).not.toHaveProperty("fontGeist");
  });
});
