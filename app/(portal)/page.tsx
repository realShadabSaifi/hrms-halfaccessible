import { ActivityFeed } from "@/components/dashboard/ActivityFeed";
import { Greeting } from "@/components/dashboard/Greeting";
import { QuickActions } from "@/components/dashboard/QuickActions";
import { StatCards } from "@/components/dashboard/StatCards";
import { Ticker } from "@/components/dashboard/Ticker";
import { requireProfile } from "@/lib/auth";
import { computeDashboardStats } from "@/lib/dashboard/stats";
import { buildTickerChips } from "@/lib/dashboard/ticker";
import { createClient } from "@/lib/supabase/server";

function hoursUntil(iso: string | null | undefined): string | null {
  if (!iso) return null;
  const ms = new Date(iso).getTime() - Date.now();
  if (!Number.isFinite(ms) || ms <= 0) return null;
  return `${Math.max(1, Math.ceil(ms / 3_600_000))}h`;
}

function shortHoliday(iso: string): string {
  return new Date(`${iso}T00:00:00`).toLocaleDateString("en-US", {
    weekday: "short",
    month: "short",
    day: "numeric",
  });
}

export default async function DashboardPage() {
  const profile = await requireProfile();
  const supabase = await createClient();

  const [{ count: pendingLeaves }, { data: holidays }, { count: unread }, { data: activity }, { data: tripPoll }] =
    await Promise.all([
      supabase
        .from("leave_requests")
        .select("id", { count: "exact", head: true })
        .eq("requester_id", profile.id)
        .eq("status", "pending"),
      supabase.from("burger_holidays").select("holiday_on, status, voting_closes_at").eq("status", "approved"),
      supabase
        .from("announcements")
        .select("id", { count: "exact", head: true })
        .gt("created_at", profile.ann_seen_at ?? "1970-01-01"),
      supabase
        .from("activity_events")
        .select("id, body, created_at")
        .order("created_at", { ascending: false })
        .limit(5),
      supabase.from("trip_polls").select("id, open").eq("open", true).limit(1).maybeSingle(),
    ]);

  const { data: voting } = await supabase
    .from("burger_holidays")
    .select("voting_closes_at, title")
    .eq("status", "voting")
    .order("voting_closes_at")
    .limit(1)
    .maybeSingle();

  const today = new Date().toLocaleDateString("en-IN", {
    weekday: "long",
    month: "long",
    day: "numeric",
  });

  return (
    <div className="pageEnter">
      <Ticker
        items={buildTickerChips({
          votingTitle: voting?.title ?? null,
          countdown: hoursUntil(voting?.voting_closes_at),
          confirmed: (holidays ?? []).map((h) => shortHoliday(h.holiday_on)),
          tripOpen: Boolean(tripPoll?.open),
        })}
      />
      <Greeting fullName={profile.full_name} today={today} />
      <StatCards
        cards={computeDashboardStats({
          pendingLeaves: pendingLeaves ?? 0,
          upcomingHolidays: holidays?.length ?? 0,
          unreadAnnouncements: unread ?? 0,
        })}
      />
      <QuickActions />
      <ActivityFeed
        items={(activity ?? []).map((a) => ({
          id: a.id,
          body: a.body,
          time: new Date(a.created_at).toLocaleDateString("en-IN", { month: "short", day: "numeric" }),
        }))}
      />
    </div>
  );
}
