"use client";

import { useEffect } from "react";
import { canUseChat } from "@/lib/rls/policies";
import { syncPushIfGranted } from "@/lib/push/register";
import type { ProfileRole } from "@/lib/types";

export function PushSync({ role }: { role: ProfileRole }) {
  useEffect(() => {
    if (!canUseChat(role)) return;
    void syncPushIfGranted();
  }, [role]);
  return null;
}
