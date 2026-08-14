import { describe, expect, it } from "vitest";
import { TOTP_ISSUER, generateTotpSecret, totpCodeAt, totpUri, verifyTotp } from "./verify";

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

  it("labels new authenticator entries as HRMS Portal", () => {
    const secret = generateTotpSecret();
    const uri = totpUri("zara@halfaccessible.com", secret);
    expect(TOTP_ISSUER).toBe("HRMS Portal");
    expect(uri).toContain("issuer=HRMS%20Portal");
  });
});
