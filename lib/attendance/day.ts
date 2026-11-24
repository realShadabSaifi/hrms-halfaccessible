import { APP_TIME_ZONE } from "@/lib/time";

export const ATTENDANCE_TZ = APP_TIME_ZONE;

/** UTC instant of midnight today in `timeZone` (zones without DST). */
export function startOfDayIso(now: Date, timeZone = ATTENDANCE_TZ): string {
  const parts = new Intl.DateTimeFormat("en-CA", {
    timeZone,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
    hourCycle: "h23",
  }).formatToParts(now);
  const get = (t: string) => Number(parts.find((p) => p.type === t)?.value);
  const localAsUtc = Date.UTC(get("year"), get("month") - 1, get("day"), get("hour"), get("minute"), get("second"));
  const offsetMs = localAsUtc - Math.floor(now.getTime() / 1000) * 1000;
  return new Date(Date.UTC(get("year"), get("month") - 1, get("day")) - offsetMs).toISOString();
}

export type Session = { punch_in_at: string; punch_out_at: string | null };

/** Milliseconds worked since `dayStartIso`; an open session counts up to `now`. */
export function workedMs(sessions: Session[], dayStartIso: string, now: Date): number {
  const dayStart = new Date(dayStartIso).getTime();
  return sessions.reduce((sum, s) => {
    const start = Math.max(new Date(s.punch_in_at).getTime(), dayStart);
    const end = s.punch_out_at ? new Date(s.punch_out_at).getTime() : now.getTime();
    return sum + Math.max(0, end - start);
  }, 0);
}

export function formatDuration(ms: number): string {
  const totalMin = Math.floor(ms / 60_000);
  const h = Math.floor(totalMin / 60);
  const m = totalMin % 60;
  return h > 0 ? `${h}h ${String(m).padStart(2, "0")}m` : `${m}m`;
}

/** Minimum gap between a punch and the next one (in → out, out → in). */
export const PUNCH_COOLDOWN_MS = 60_000;

/** Milliseconds left before the next punch is allowed; 0 when it is allowed now. */
export function cooldownRemainingMs(lastPunchIso: string | null | undefined, now: Date | number): number {
  if (!lastPunchIso) return 0;
  const t = new Date(lastPunchIso).getTime();
  if (!Number.isFinite(t)) return 0;
  const nowMs = typeof now === "number" ? now : now.getTime();
  return Math.max(0, t + PUNCH_COOLDOWN_MS - nowMs);
}

/** The most recent punch event (an open session's punch-in, else the latest punch-out). */
export function lastPunchAt(sessions: Session[]): string | null {
  let best: number | null = null;
  for (const s of sessions) {
    for (const iso of [s.punch_in_at, s.punch_out_at]) {
      if (!iso) continue;
      const t = new Date(iso).getTime();
      if (best === null || t > best) best = t;
    }
  }
  return best === null ? null : new Date(best).toISOString();
}

/** YYYY-MM-DD of an instant in `timeZone`. */
export function localDateKey(iso: string, timeZone = ATTENDANCE_TZ): string {
  return new Intl.DateTimeFormat("en-CA", { timeZone, year: "numeric", month: "2-digit", day: "2-digit" }).format(
    new Date(iso),
  );
}
