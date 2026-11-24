"use client";

import { useEffect, useState, useTransition } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { MapPin, SignIn, SignOut, Timer } from "@phosphor-icons/react";
import { punchIn, punchOut } from "@/app/(portal)/attendance/actions";
import { PunchList, punchTime, type PunchRow } from "@/components/attendance/PunchList";
import { Button } from "@/components/ui/Button";
import { cooldownRemainingMs, formatDuration } from "@/lib/attendance/day";
import styles from "./PunchCard.module.scss";

function getFix(): Promise<{ lat: number; lng: number; accuracy: number }> {
  return new Promise((resolve, reject) => {
    if (!navigator.geolocation) {
      reject(new Error("this browser can't share location."));
      return;
    }
    navigator.geolocation.getCurrentPosition(
      (pos) =>
        resolve({ lat: pos.coords.latitude, lng: pos.coords.longitude, accuracy: pos.coords.accuracy }),
      (err) =>
        reject(
          new Error(
            err.code === err.PERMISSION_DENIED
              ? "allow location access to punch in or out."
              : "couldn't get your location. try again.",
          ),
        ),
      { enableHighAccuracy: true, timeout: 15_000, maximumAge: 0 },
    );
  });
}

function mmss(ms: number) {
  const s = Math.ceil(ms / 1000);
  return `${Math.floor(s / 60)}:${String(s % 60).padStart(2, "0")}`;
}

export function PunchCard({
  officeLabel,
  openSince,
  openCountedFrom,
  closedMs,
  lastPunch,
  today,
}: {
  /** null when the super admin hasn't set an office yet */
  officeLabel: string | null;
  /** punch-in time of the open session, if punched in */
  openSince: string | null;
  /** where today's count for the open session starts (punch-in, or midnight if it began yesterday) */
  openCountedFrom: string | null;
  /** time already worked today in closed sessions */
  closedMs: number;
  /** most recent punch event; the next punch unlocks a minute after it */
  lastPunch: string | null;
  /** today's sessions, newest first */
  today: PunchRow[];
}) {
  const router = useRouter();
  const [now, setNow] = useState(() => Date.now());
  const [locating, setLocating] = useState(false);
  const [pending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);
  const punchedIn = Boolean(openSince);
  const cooldown = cooldownRemainingMs(lastPunch, now);
  const cooling = cooldown > 0;

  useEffect(() => {
    setNow(Date.now());
    // tick every second through the cooldown, then every 30s while the worked-time counter runs
    if (!cooling && !punchedIn) return;
    const t = setInterval(() => setNow(Date.now()), cooling ? 1000 : 30_000);
    return () => clearInterval(t);
  }, [punchedIn, lastPunch, cooling]);

  const worked = closedMs + (openCountedFrom ? Math.max(0, now - new Date(openCountedFrom).getTime()) : 0);

  async function onPunch() {
    setError(null);
    setLocating(true);
    let fix;
    try {
      fix = await getFix();
    } catch (e) {
      setError((e as Error).message);
      return;
    } finally {
      setLocating(false);
    }
    startTransition(async () => {
      const r = punchedIn ? await punchOut(fix) : await punchIn(fix);
      if (!r.ok) setError(r.error);
      else router.refresh();
    });
  }

  const busy = locating || pending;

  return (
    <section className={styles.card} aria-labelledby="punch-title">
      <div className={styles.top}>
        <div className={styles.main}>
          <div className={styles.label} id="punch-title">
            attendance
          </div>
          <div className={styles.status}>
            <span className={`${styles.dot} ${punchedIn ? styles.on : ""}`} aria-hidden="true" />
            {punchedIn ? `punched in since ${punchTime(openSince!)}` : "not punched in"}
          </div>
          <div className={styles.sub}>
            {formatDuration(worked)} today
            {officeLabel ? (
              <>
                {" · "}
                <MapPin size={13} weight="bold" aria-hidden="true" /> {officeLabel}
              </>
            ) : null}
          </div>
          {error ? (
            <p className={styles.error} role="alert">
              {error}
            </p>
          ) : null}
        </div>
        {!officeLabel ? (
          <p className={styles.sub}>office location isn&apos;t set up yet. ask your super admin.</p>
        ) : cooldown > 0 && !busy ? (
          <div className={styles.wait} role="status" aria-live="polite">
            <Timer size={18} weight="bold" aria-hidden="true" />
            <span>
              {punchedIn ? "punch out" : "punch in"} available in <strong>{mmss(cooldown)}</strong>
            </span>
          </div>
        ) : (
          <Button
            variant={punchedIn ? "danger" : "primary"}
            onClick={onPunch}
            pending={busy}
            className={styles.btn}
          >
            {punchedIn ? <SignOut size={18} weight="bold" /> : <SignIn size={18} weight="bold" />}
            {locating ? "checking location…" : pending ? "saving…" : punchedIn ? "punch out" : "punch in"}
          </Button>
        )}
      </div>
      {today.length > 0 ? (
        <div className={styles.today}>
          <div className={styles.todayHead}>
            <span className={styles.label}>today&apos;s punches</span>
            <Link href="/attendance" className={styles.all}>
              see all punches →
            </Link>
          </div>
          <PunchList rows={today} now={now} />
        </div>
      ) : (
        <Link href="/attendance" className={`${styles.all} ${styles.allSolo}`}>
          see all punches →
        </Link>
      )}
    </section>
  );
}
