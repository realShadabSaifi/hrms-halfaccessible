import { Badge } from "@/components/ui/Badge";
import { Card } from "@/components/ui/Card";
import { LEAVE_TYPES } from "@/lib/validators/leave";
import type { LeaveRow } from "@/app/(portal)/leaves/actions";

function range(from: string, to: string) {
  const f = (d: string) =>
    new Date(d + "T00:00").toLocaleDateString("en-IN", { month: "short", day: "numeric" });
  return from === to ? f(from) : `${f(from)} - ${f(to)}`;
}

export function LeaveHistory({ rows }: { rows: LeaveRow[] }) {
  return (
    <Card>
      <div className="mb-3 font-[family-name:var(--font-display)] text-base font-bold">
        your leave history 🧾
      </div>
      {rows.length === 0 ? (
        <p className="text-sm text-[rgba(28,28,46,0.55)]">no leaves yet. touch grass sometime.</p>
      ) : (
        rows.map((l) => {
          const meta = LEAVE_TYPES.find((t) => t.type === l.type);
          const status =
            l.status === "pending"
              ? "Pending"
              : l.status === "approved"
                ? "Approved"
                : "Rejected";
          return (
            <div key={l.id} className="flex items-center gap-3 border-b border-[rgba(28,28,46,0.06)] py-2.5">
              <span className="text-lg">{meta?.emoji}</span>
              <span className="min-w-0 flex-1">
                <span className="block text-[13.5px] font-semibold">
                  {meta?.name} · {range(l.starts_on, l.ends_on)}
                </span>
                <span className="block truncate text-xs text-[rgba(28,28,46,0.55)]">
                  {l.reason || "no reason given (valid)"}
                </span>
              </span>
              <Badge status={l.emergency && l.status === "approved" ? "Emergency" : status} />
            </div>
          );
        })
      )}
    </Card>
  );
}
