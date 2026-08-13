import Link from "next/link";
import { AppShell } from "@/components/layout/AppShell";
import { getCurrentProfile } from "@/lib/auth";
import { createAdminClient } from "@/lib/supabase/admin";
import { createClient } from "@/lib/supabase/server";
import { AnonBoard } from "./AnonBoard";

export default async function AnonPage() {
  let posts: { id: string; category: string; body: string; created_at: string }[] = [];
  let ups: { message_id: string }[] = [];
  try {
    const admin = createAdminClient();
    const { data: p } = await admin
      .from("anonymous_messages")
      .select("id, category, body, created_at")
      .order("created_at", { ascending: false });
    const { data: u } = await admin.from("anon_upvotes").select("message_id");
    posts = p ?? [];
    ups = u ?? [];
  } catch {
    posts = [];
  }
  const counts = new Map<string, number>();
  for (const u of ups ?? []) counts.set(u.message_id, (counts.get(u.message_id) ?? 0) + 1);
  const board = (
    <AnonBoard posts={(posts ?? []).map((p) => ({ ...p, up: counts.get(p.id) ?? 0 }))} />
  );

  const profile = await getCurrentProfile();
  if (profile?.totp_verified_at && profile.active) {
    const supabase = await createClient();
    const { count } = await supabase.from("announcements").select("id", { count: "exact", head: true });
    return (
      <AppShell profile={profile} unread={count ?? 0}>
        {board}
      </AppShell>
    );
  }

  return (
    <main id="main" className="min-h-[100dvh] bg-ha-bg px-4 py-10">
      <div className="mx-auto mb-8 flex max-w-[640px] items-center justify-between">
        <Link href="/" className="font-[family-name:var(--font-display)] text-lg font-bold text-ha-accent-text no-underline">
          halfAccessible
        </Link>
        <Link href="/login" className="text-sm font-bold">
          log in
        </Link>
      </div>
      {board}
    </main>
  );
}
