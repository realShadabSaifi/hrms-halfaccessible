import { CultureClient } from "@/components/culture/CultureClient";
import { requireProfile } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";

export default async function CulturePage() {
  const profile = await requireProfile();
  const supabase = await createClient();
  const { data: partyRows } = await supabase
    .from("party_requests")
    .select("id, occasion, vibe, preferred_on, status, requester_id")
    .order("created_at", { ascending: false });
  const ids = [...new Set((partyRows ?? []).map((p) => p.requester_id))];
  const { data: people } = ids.length
    ? await supabase.from("profiles").select("id, full_name").neq("role", "super_admin").in("id", ids)
    : { data: [] };
  const nameOf = Object.fromEntries((people ?? []).map((p) => [p.id, p.full_name]));

  const { data: polls } = await supabase
    .from("trip_polls")
    .select("*")
    .order("created_at", { ascending: false })
    .limit(1);
  const pollRow = polls?.[0] ?? null;
  let poll = null;
  if (pollRow) {
    const { data: options } = await supabase.from("trip_options").select("*").eq("poll_id", pollRow.id);
    const { data: votes } = await supabase.from("trip_votes").select("option_id, voter_id");
    poll = {
      id: pollRow.id,
      open: pollRow.open,
      options: (options ?? []).map((o) => ({
        id: o.id,
        name: o.name,
        votes: (votes ?? []).filter((v) => v.option_id === o.id).length,
        mine: (votes ?? []).some((v) => v.option_id === o.id && v.voter_id === profile.id),
      })),
    };
  }

  return (
    <CultureClient
      role={profile.role}
      parties={(partyRows ?? []).map((p) => ({
        ...p,
        by: nameOf[p.requester_id] ?? "someone",
      }))}
      poll={poll}
    />
  );
}
