import { SettingsClient } from "@/components/settings/SettingsClient";
import { requireRole } from "@/lib/auth";
import { getAppSettings } from "@/lib/branding/settings";

export default async function SettingsPage() {
  await requireRole(["super_admin"]);
  const settings = await getAppSettings();
  return <SettingsClient settings={settings} />;
}
