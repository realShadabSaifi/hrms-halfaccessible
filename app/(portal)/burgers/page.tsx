import { BurgersClient, type HolidayView } from "@/components/burgers/BurgersClient";
import { requireProfile } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";

function countdown(iso: string) {
  const ms = +new Date(iso) - Date.now();
  if (ms <= 0) return "closing…";
  const h = Math.floor(ms / 3600e3);
  const m = Math.floor((ms % 3600e3) / 60e3);
  return `${h}h ${m}m left`;
}

export default async function BurgersPage() {
  const profile = await requireProfile();
  const supabase = await createClient();
  const { data: rows } = await supabase
    .from("burger_holidays")
    .select("*")
    .order("holiday_on", { ascending: false });
  const { data: votes } = await supabase.from("burger_votes").select("holiday_id, voter_id, choice");

  const holidays: HolidayView[] = (rows ?? []).map((h) => {
    const hv = (votes ?? []).filter((v) => v.holiday_id === h.id);
    const mine = hv.find((v) => v.voter_id === profile.id);
    return {
      id: h.id,
      holiday_on: h.holiday_on,
      title: h.title,
      reason: h.reason,
      status: h.status,
      yes: hv.filter((v) => v.choice === "yes").length,
      no: hv.filter((v) => v.choice === "no").length,
      myVote: mine?.choice ?? null,
      countdown: h.status === "voting" ? countdown(h.voting_closes_at) : null,
    };
  });

  return <BurgersClient holidays={holidays} role={profile.role} />;
}
