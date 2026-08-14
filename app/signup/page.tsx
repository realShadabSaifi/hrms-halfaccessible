import { getAppSettings } from "@/lib/branding/settings";
import { SignupFlow } from "./SignupFlow";

export default async function SignupPage() {
  const settings = await getAppSettings();
  return <SignupFlow settings={settings} />;
}
