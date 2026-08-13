import { CxoClient } from "@/components/cxo/CxoClient";
import { requireProfile } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";

export default async function CxoPage() {
  const profile = await requireProfile();
  const supabase = await createClient();
  const { data: cxos } = await supabase.from("cxo_windows").select("*");
  const { data: bookings } = await supabase
    .from("cxo_bookings")
    .select("id, topic, status, created_at, cxo_id")
    .eq("booker_id", profile.id)
    .order("created_at", { ascending: false });
  const nameOf = Object.fromEntries((cxos ?? []).map((c) => [c.id, `${c.title} · ${c.name}`]));
  return (
    <CxoClient
      cxos={cxos ?? []}
      mine={(bookings ?? []).map((b) => ({
        id: b.id,
        who: nameOf[b.cxo_id] ?? "CXO",
        topic: b.topic,
        when: new Date(b.created_at).toLocaleDateString("en-IN", { month: "short", day: "numeric" }),
        status: b.status,
      }))}
    />
  );
}
