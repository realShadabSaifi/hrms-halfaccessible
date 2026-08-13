import { describe, expect, it } from "vitest";
import { hashSession, newAnonSession } from "./session";

describe("anon session", () => {
  it("hashes without keeping the raw cookie", () => {
    const raw = newAnonSession();
    expect(raw).toHaveLength(64);
    expect(hashSession(raw)).toHaveLength(64);
    expect(hashSession(raw)).not.toBe(raw);
    expect(hashSession(raw)).toBe(hashSession(raw));
  });
});
