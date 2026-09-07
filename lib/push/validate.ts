export function validatePushSubscription(input: {
  endpoint: unknown;
  keys?: { p256dh?: unknown; auth?: unknown };
}): { endpoint: string; p256dh: string; auth: string } | { error: string } {
  const endpoint = typeof input.endpoint === "string" ? input.endpoint.trim() : "";
  const p256dh = typeof input.keys?.p256dh === "string" ? input.keys.p256dh.trim() : "";
  const auth = typeof input.keys?.auth === "string" ? input.keys.auth.trim() : "";
  if (!endpoint || !p256dh || !auth) return { error: "bad subscription" };
  return { endpoint, p256dh, auth };
}
