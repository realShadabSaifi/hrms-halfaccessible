"use server";

import { getCurrentProfile } from "@/lib/auth";
import { afterAuthPath } from "@/lib/layout/access";

export async function pathAfterAuth(): Promise<"/settings" | "/"> {
  const profile = await getCurrentProfile();
  return afterAuthPath(profile?.role ?? "employee");
}
