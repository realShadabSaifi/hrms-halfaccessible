import { createHash, randomBytes } from "node:crypto";

export const ANON_COOKIE = "ha_anon";

export function newAnonSession(): string {
  return randomBytes(32).toString("hex");
}

export function hashSession(raw: string): string {
  return createHash("sha256").update(raw).digest("hex");
}
