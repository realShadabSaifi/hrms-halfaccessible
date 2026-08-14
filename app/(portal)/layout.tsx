import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { AppShell } from "@/components/layout/AppShell";
import { requireProfile } from "@/lib/auth";
import { getAppSettings } from "@/lib/branding/settings";
import { createClient } from "@/lib/supabase/server";

export default async function PortalLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const profile = await requireProfile();
  const settings = await getAppSettings();
  const supabase = await createClient();
  let unread = 0;
  if (profile.ann_seen_at) {
    const { count } = await supabase
      .from("announcements")
      .select("id", { count: "exact", head: true })
      .gt("created_at", profile.ann_seen_at);
    unread = count ?? 0;
  } else {
    const { count } = await supabase
      .from("announcements")
      .select("id", { count: "exact", head: true });
    unread = count ?? 0;
  }

  const h = await headers();
  const path = h.get("x-pathname");
  if ((path === "/users" || path === "/settings") && profile.role !== "admin") redirect("/");

  return (
    <AppShell profile={profile} unread={unread} settings={settings}>
      {children}
    </AppShell>
  );
}
