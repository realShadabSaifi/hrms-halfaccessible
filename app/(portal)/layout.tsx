import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { AppShell } from "@/components/layout/AppShell";
import { requireProfile } from "@/lib/auth";
import { getAppSettings } from "@/lib/branding/settings";
import { afterAuthPath, canVisitPath } from "@/lib/layout/access";
import { createClient } from "@/lib/supabase/server";

export default async function PortalLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const [profile, h] = await Promise.all([requireProfile(), headers()]);
  const path = h.get("x-pathname") ?? "/";
  if (!canVisitPath(profile.role, path)) {
    redirect(afterAuthPath(profile.role));
  }

  const supabase = await createClient();
  let announcements = supabase.from("announcements").select("id", { count: "exact", head: true });
  if (profile.ann_seen_at) announcements = announcements.gt("created_at", profile.ann_seen_at);
  // independent lookups, so fetch them together rather than one after another
  const [settings, { count: unread }, { data: unreadChat }] = await Promise.all([
    getAppSettings(),
    announcements,
    supabase.rpc("unread_chat_count"),
  ]);

  return (
    <AppShell profile={profile} unread={unread ?? 0} unreadChat={unreadChat ?? 0} settings={settings}>
      {children}
    </AppShell>
  );
}
