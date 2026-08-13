"use server";

import { revalidatePath } from "next/cache";
import { requireProfile, requireRole } from "@/lib/auth";
import { validateParty } from "@/lib/culture/party";
import { createClient } from "@/lib/supabase/server";

export async function submitParty(occasion: string, vibe: string, date: string) {
  const profile = await requireProfile();
  const err = validateParty(occasion);
  if (err) return { ok: false as const, error: err };
  const supabase = await createClient();
  const { error } = await supabase.from("party_requests").insert({
    requester_id: profile.id,
    occasion: occasion.trim(),
    vibe,
    preferred_on: date || null,
  });
  if (error) return { ok: false as const, error: error.message };
  revalidatePath("/culture");
  return { ok: true as const };
}

export async function approveParty(id: string) {
  const profile = await requireRole(["lead", "admin"]);
  const supabase = await createClient();
  const { data: req } = await supabase.from("party_requests").select("*").eq("id", id).single();
  if (!req) return { ok: false as const, error: "missing" };
  await supabase
    .from("party_requests")
    .update({ status: "approved", approved_by: profile.id })
    .eq("id", id);
  await supabase.from("announcements").insert({
    author_id: profile.id,
    title: `party: ${req.occasion}`,
    body: `${req.vibe} · ${req.preferred_on ?? "TBD"} · on the company card.`,
    category: "Event",
    pinned: false,
  });
  revalidatePath("/culture");
  revalidatePath("/announcements");
  return { ok: true as const };
}

export async function voteTrip(optionId: string) {
  const profile = await requireProfile();
  const supabase = await createClient();
  await supabase.from("trip_votes").insert({ option_id: optionId, voter_id: profile.id });
  revalidatePath("/culture");
  return { ok: true as const };
}

export async function closeTrip(pollId: string) {
  const profile = await requireRole(["admin"]);
  const supabase = await createClient();
  const { data: options } = await supabase.from("trip_options").select("id, name").eq("poll_id", pollId);
  const { data: votes } = await supabase.from("trip_votes").select("option_id");
  const counts = (options ?? []).map((o) => ({
    ...o,
    votes: (votes ?? []).filter((v) => v.option_id === o.id).length,
  }));
  const winner = [...counts].sort((a, b) => b.votes - a.votes)[0];
  await supabase.from("trip_polls").update({ open: false }).eq("id", pollId);
  if (winner) {
    await supabase.from("announcements").insert({
      author_id: profile.id,
      title: `FY27 trip: ${winner.name} WINS`,
      body: `the people have spoken - ${winner.name} takes it with ${winner.votes} votes.`,
      category: "Event",
      pinned: true,
    });
  }
  revalidatePath("/culture");
  revalidatePath("/announcements");
  return { ok: true as const };
}
