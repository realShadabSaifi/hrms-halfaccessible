import { Fingerprint } from "@phosphor-icons/react/dist/ssr";
import { PunchList, type PunchRow } from "@/components/attendance/PunchList";
import { Card } from "@/components/ui/Card";
import { EmptyState } from "@/components/ui/EmptyState";
import { requireProfile } from "@/lib/auth";
import { formatDuration, localDateKey } from "@/lib/attendance/day";
import { createClient } from "@/lib/supabase/server";

const HISTORY_DAYS = 90;

function dayTitle(key: string) {
  return new Date(`${key}T00:00:00Z`).toLocaleDateString("en-IN", {
    weekday: "short",
    day: "numeric",
    month: "short",
    year: "numeric",
    timeZone: "UTC",
  });
}

export default async function AttendancePage() {
  const profile = await requireProfile();
  const supabase = await createClient();
  const since = new Date(Date.now() - HISTORY_DAYS * 86_400_000).toISOString();
  const { data } = await supabase
    .from("attendance_sessions")
    .select("id, punch_in_at, punch_out_at")
    .eq("user_id", profile.id)
    .gte("punch_in_at", since)
    .order("punch_in_at", { ascending: false })
    .limit(1000);

  const rows: PunchRow[] = data ?? [];
  const now = Date.now();
  const days = new Map<string, PunchRow[]>();
  for (const r of rows) {
    const key = localDateKey(r.punch_in_at);
    days.set(key, [...(days.get(key) ?? []), r]);
  }

  return (
    <div className="pageEnter grid max-w-[720px] gap-4">
      <p className="text-xs text-ha-muted">every punch from the last {HISTORY_DAYS} days, newest first.</p>
      {days.size === 0 ? (
        <Card>
          <EmptyState icon={<Fingerprint size={28} />} title="no punches yet. punch in from the home page." />
        </Card>
      ) : (
        [...days].map(([key, list]) => {
          const total = list.reduce((sum, r) => {
            const end = r.punch_out_at ? new Date(r.punch_out_at).getTime() : now;
            return sum + Math.max(0, end - new Date(r.punch_in_at).getTime());
          }, 0);
          return (
            <Card key={key} as="section">
              <div className="mb-1 flex items-baseline justify-between gap-3">
                <h3 className="font-[family-name:var(--font-display)] text-base font-bold">{dayTitle(key)}</h3>
                <span className="text-xs font-semibold text-ha-muted">
                  {formatDuration(total)} · {list.length} {list.length === 1 ? "session" : "sessions"}
                </span>
              </div>
              <PunchList rows={list} now={now} />
            </Card>
          );
        })
      )}
    </div>
  );
}
