import { AnnouncementsClient, type AnnView } from "@/components/announcements/AnnouncementsClient";
import { requireProfile } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";

export default async function AnnouncementsPage() {
  const profile = await requireProfile();
  const supabase = await createClient();
  const { data: rows } = await supabase
    .from("announcements")
    .select("*")
    .order("created_at", { ascending: false });
  const { data: reacts } = await supabase
    .from("announcement_reactions")
    .select("announcement_id, emoji");
  const items: AnnView[] = (rows ?? []).map((r) => {
    const reactsFor = (reacts ?? []).filter((x) => x.announcement_id === r.id);
    const counts: Record<string, number> = {};
    for (const x of reactsFor) counts[x.emoji] = (counts[x.emoji] ?? 0) + 1;
    return { ...r, reacts: counts };
  });
  return <AnnouncementsClient role={profile.role} items={items} />;
}
