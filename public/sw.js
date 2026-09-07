/* eslint-disable no-restricted-globals */
self.activeChat = null;

self.addEventListener("message", (event) => {
  if (event.data && event.data.type === "SET_ACTIVE_CHAT") {
    self.activeChat = event.data.tag ?? null;
  }
});

self.addEventListener("push", (event) => {
  const data = event.data ? event.data.json() : {};
  event.waitUntil(
    self.clients.matchAll({ type: "window", includeUncontrolled: true }).then((clients) => {
      const focused = clients.some((client) => client.focused && self.activeChat && self.activeChat === data.tag);
      if (focused) return undefined;
      return self.registration.showNotification(data.title || "halfAccessible", {
        body: data.body || "",
        data: { url: data.url || "/chat" },
        tag: data.tag,
      });
    }),
  );
});

self.addEventListener("notificationclick", (event) => {
  event.notification.close();
  const url = event.notification.data?.url || "/chat";
  event.waitUntil(
    self.clients.matchAll({ type: "window", includeUncontrolled: true }).then((clients) => {
      const existing = clients.find((client) => client.url.includes(url));
      if (existing) return existing.focus();
      return self.clients.openWindow(url);
    }),
  );
});
