import { describe, expect, it } from "vitest";
import { generateTotpSecret, totpCodeAt, verifyTotp } from "./verify";

describe("TOTP verify", () => {
  it("accepts the current code", () => {
    const secret = generateTotpSecret();
    const code = totpCodeAt(secret);
    expect(verifyTotp(secret, code)).toBe(true);
  });

  it("accepts codes within +/- 1 step", () => {
    const secret = generateTotpSecret();
    const previous = totpCodeAt(secret, Date.now() - 30_000);
    const next = totpCodeAt(secret, Date.now() + 30_000);
    expect(verifyTotp(secret, previous)).toBe(true);
    expect(verifyTotp(secret, next)).toBe(true);
  });

  it("rejects a wrong code", () => {
    const secret = generateTotpSecret();
    expect(verifyTotp(secret, "000000")).toBe(false);
  });
});
