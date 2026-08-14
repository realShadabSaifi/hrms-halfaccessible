import { describe, expect, it } from "vitest";
import { tokens } from "./tokens";

describe("refined canvas tokens", () => {
  it("uses the refined canvas, ink, and lilac", () => {
    expect(tokens.bg).toBe("#F7F5FC");
    expect(tokens.ink).toBe("#39325A");
    expect(tokens.purple).toBe("#7463D4");
    expect(tokens.purpleHover).toBe("#8577E0");
    expect(tokens.soft).toBe("#564AA5");
  });

  it("keeps teal as the portal link and bar accent", () => {
    expect(tokens.teal).toBe("#00816F");
    expect(tokens.tealBar).toBe("#009B8D");
  });

  it("uses the refined radius scale", () => {
    expect(tokens.radiusCard).toBe("12px");
    expect(tokens.radiusBtn).toBe("8px");
    expect(tokens.radiusInput).toBe("6px");
    expect(tokens.radiusAuthBtn).toBe("14px");
    expect(tokens.radiusAuthInput).toBe("10px");
  });
});
