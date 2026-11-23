import { SignIn, SignOut } from "@phosphor-icons/react/dist/ssr";
import { ATTENDANCE_TZ, formatDuration } from "@/lib/attendance/day";

export type PunchRow = { id: string; punch_in_at: string; punch_out_at: string | null };

export function punchTime(iso: string) {
  return new Date(iso).toLocaleTimeString("en-IN", {
    hour: "numeric",
    minute: "2-digit",
    timeZone: ATTENDANCE_TZ,
  });
}

/** One line per session: in → out (duration). Newest first. */
export function PunchList({ rows, now }: { rows: PunchRow[]; now: number }) {
  return (
    <ul className="divide-y divide-ha-line">
      {rows.map((r) => {
        const end = r.punch_out_at ? new Date(r.punch_out_at).getTime() : now;
        const dur = formatDuration(Math.max(0, end - new Date(r.punch_in_at).getTime()));
        return (
          <li key={r.id} className="flex flex-wrap items-center gap-x-4 gap-y-1 py-2 text-[13px]">
            <span className="inline-flex items-center gap-1.5 font-semibold">
              <SignIn size={14} weight="bold" className="text-ha-teal" aria-hidden="true" />
              in {punchTime(r.punch_in_at)}
            </span>
            <span className="inline-flex items-center gap-1.5 font-semibold">
              <SignOut size={14} weight="bold" className="text-ha-danger" aria-hidden="true" />
              {r.punch_out_at ? `out ${punchTime(r.punch_out_at)}` : "still in"}
            </span>
            <span className="ml-auto text-xs text-ha-muted">{dur}</span>
          </li>
        );
      })}
    </ul>
  );
}
