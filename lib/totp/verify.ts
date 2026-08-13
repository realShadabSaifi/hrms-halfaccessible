import { Secret, TOTP } from "otpauth";

export const TOTP_ISSUER = "halfAccessible";

export function generateTotpSecret(): string {
  return new Secret({ size: 20 }).base32;
}

export function makeTotp(secretBase32: string, label = "member"): TOTP {
  return new TOTP({
    issuer: TOTP_ISSUER,
    label,
    algorithm: "SHA1",
    digits: 6,
    period: 30,
    secret: Secret.fromBase32(secretBase32.replace(/\s+/g, "")),
  });
}

export function totpUri(email: string, secretBase32: string): string {
  return makeTotp(secretBase32, email).toString();
}

export function totpCodeAt(secretBase32: string, timestamp = Date.now()): string {
  return makeTotp(secretBase32).generate({ timestamp });
}

export function verifyTotp(
  secretBase32: string,
  code: string,
  timestamp = Date.now(),
): boolean {
  const token = code.replace(/\s+/g, "");
  if (!/^\d{6}$/.test(token)) return false;
  return makeTotp(secretBase32).validate({ token, timestamp, window: 1 }) !== null;
}
