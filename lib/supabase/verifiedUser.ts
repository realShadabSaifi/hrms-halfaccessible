/**
 * Internal request header the middleware sets after it has verified the session with
 * Supabase Auth. Server code reads it instead of calling auth.getUser() again.
 * The middleware always overwrites or deletes it, so clients can't spoof it.
 */
export const VERIFIED_USER_HEADER = "x-ha-verified-user";

const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

export function parseVerifiedUser(value: string | null | undefined): string | null {
  return value && UUID_RE.test(value) ? value : null;
}
