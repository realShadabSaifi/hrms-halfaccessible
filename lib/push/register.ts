"use client";

import { registerPush, unregisterPush } from "@/app/(portal)/chat/actions";
import { urlBase64ToUint8Array } from "./vapid";

export async function enablePush(): Promise<{ ok: true } | { ok: false; error: string }> {
  if (!("serviceWorker" in navigator) || !("PushManager" in window) || !("Notification" in window)) {
    return { ok: false, error: "blocked in the browser. allow notifications for this site." };
  }
  const key = process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY;
  if (!key) return { ok: false, error: "blocked in the browser. allow notifications for this site." };
  const permission = await Notification.requestPermission();
  if (permission !== "granted") {
    return { ok: false, error: "blocked in the browser. allow notifications for this site." };
  }
  const reg = await navigator.serviceWorker.register("/sw.js");
  const sub = await reg.pushManager.subscribe({
    userVisibleOnly: true,
    applicationServerKey: urlBase64ToUint8Array(key) as BufferSource,
  });
  const json = sub.toJSON();
  return registerPush({ endpoint: json.endpoint, keys: json.keys });
}

export async function disablePush(): Promise<{ ok: true } | { ok: false; error: string }> {
  if (!("serviceWorker" in navigator)) return { ok: true };
  const reg = await navigator.serviceWorker.getRegistration();
  const sub = await reg?.pushManager.getSubscription();
  if (!sub) return { ok: true };
  const endpoint = sub.endpoint;
  await sub.unsubscribe();
  return unregisterPush(endpoint);
}

export async function syncPushIfGranted(): Promise<void> {
  if (!("Notification" in window) || Notification.permission !== "granted") return;
  await enablePush().catch(() => {});
}
