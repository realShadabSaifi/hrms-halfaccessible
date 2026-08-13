import { describe, expect, it } from "vitest";
import { tokens } from "./tokens";

describe("v2 design tokens", () => {
  it("matches the prototype purple accent", () => {
    expect(tokens.purple).toBe("#5B2D8E");
  });

  it("matches the prototype light canvas", () => {
    expect(tokens.bg).toBe("#F6F6FA");
  });

  it("matches the prototype ink", () => {
    expect(tokens.ink).toBe("#1C1C2E");
  });

  it("matches the prototype teal", () => {
    expect(tokens.teal).toBe("#009B8D");
  });
});
