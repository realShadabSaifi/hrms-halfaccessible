import { ActivityFeed } from "@/components/dashboard/ActivityFeed";
import { Greeting } from "@/components/dashboard/Greeting";
import { QuickActions } from "@/components/dashboard/QuickActions";
import { StatCards } from "@/components/dashboard/StatCards";
import { Ticker } from "@/components/dashboard/Ticker";
import { requireProfile } from "@/lib/auth";
import { computeDashboardStats } from "@/lib/dashboard/stats";
import { createClient } from "@/lib/supabase/server";

export default async function DashboardPage() {
  const profile = await requireProfile();
  const supabase = await createClient();

  const [{ count: pendingLeaves }, { data: holidays }, { count: unread }, { data: activity }] =
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
    month: "short",
    day: "numeric",
  });

  const ticker = voting
    ? `burger holiday vote closing soon for "${voting.title}"  ·  be nice, it's free  ·  `
    : "be nice, it's free  ·  inform, handoff, go  ·  ";

  return (
    <div className="pageEnter">
      <Ticker text={ticker} />
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
