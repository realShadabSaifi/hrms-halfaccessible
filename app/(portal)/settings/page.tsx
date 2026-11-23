import { SettingsClient } from "@/components/settings/SettingsClient";
import { requireRole } from "@/lib/auth";
import { getOfficeLocation } from "@/lib/attendance/office";
import { getAppSettings } from "@/lib/branding/settings";

export default async function SettingsPage() {
  await requireRole(["super_admin"]);
  const [settings, office] = await Promise.all([getAppSettings(), getOfficeLocation()]);
  return <SettingsClient settings={settings} office={office} />;
}
