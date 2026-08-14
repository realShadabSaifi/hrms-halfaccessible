import { Suspense } from "react";
import { getAppSettings } from "@/lib/branding/settings";
import { LoginFlow } from "./LoginFlow";

export default async function LoginPage() {
  const settings = await getAppSettings();
  return (
    <Suspense>
      <LoginFlow settings={settings} />
    </Suspense>
  );
}
