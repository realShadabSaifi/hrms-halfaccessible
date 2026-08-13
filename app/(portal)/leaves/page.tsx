import { LeaveForm } from "@/components/leaves/LeaveForm";
import { LeaveHistory } from "@/components/leaves/LeaveHistory";
import { StepZeroBanner } from "@/components/leaves/StepZeroBanner";
import { TeamRequests } from "@/components/leaves/TeamRequests";
import { requireProfile } from "@/lib/auth";
import { canViewTeamLeaves } from "@/lib/rls/policies";
import { createClient } from "@/lib/supabase/server";
import type { LeaveRow } from "./actions";

export default async function LeavesPage() {
  const profile = await requireProfile();
  const supabase = await createClient();
  const { data: mine } = await supabase
    .from("leave_requests")
    .select("*")
    .eq("requester_id", profile.id)
    .order("created_at", { ascending: false });

  let team: LeaveRow[] = [];
  let names: Record<string, { full_name: string; avatar_color: string }> = {};
  if (canViewTeamLeaves(profile.role)) {
    const { data } = await supabase
      .from("leave_requests")
      .select("*")
      .order("created_at", { ascending: false });
    team = (data ?? []) as LeaveRow[];
    const ids = [...new Set(team.map((t) => t.requester_id))];
    if (ids.length) {
      const { data: people } = await supabase
        .from("profiles")
        .select("id, full_name, avatar_color")
        .in("id", ids);
      names = Object.fromEntries(
        (people ?? []).map((p) => [p.id, { full_name: p.full_name, avatar_color: p.avatar_color }]),
      );
    }
  }

  return (
    <div className="pageEnter">
      <StepZeroBanner />
      <div className="grid items-start gap-5 md:grid-cols-[1.1fr_0.9fr]">
        <LeaveForm />
        <div className="flex flex-col gap-5">
          <LeaveHistory rows={(mine ?? []) as LeaveRow[]} />
          {canViewTeamLeaves(profile.role) ? <TeamRequests rows={team} names={names} /> : null}
        </div>
      </div>
    </div>
  );
}
