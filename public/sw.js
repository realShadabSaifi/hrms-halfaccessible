/* eslint-disable no-restricted-globals */

function pathOf(url) {
  try {
    return new URL(url, self.location.origin).pathname;
  } catch {
    return "";
  }
}

function shouldSuppress(focusedPaths, dest) {
  const target = (dest || "").split("?")[0];
  if (!target || target === "/") return false;
  return focusedPaths.some((path) => path.split("?")[0] === target);
}

self.addEventListener("push", (event) => {
  const data = event.data ? event.data.json() : {};
  event.waitUntil(
    self.clients.matchAll({ type: "window", includeUncontrolled: true }).then((clients) => {
      const focusedPaths = clients.filter((client) => client.focused).map((client) => pathOf(client.url));
      if (shouldSuppress(focusedPaths, data.url)) return undefined;
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
  const dest = event.notification.data?.url || "/chat";
  event.waitUntil(
    self.clients.matchAll({ type: "window", includeUncontrolled: true }).then((clients) => {
      const destPath = pathOf(dest) || dest;
      const same = clients.find((client) => pathOf(client.url) === destPath);
      if (same) return same.focus();
      const existing = clients.find((client) => client.url.startsWith(self.location.origin));
      if (existing?.navigate) {
        return existing.navigate(dest).then((client) => (client || existing).focus());
      }
      return self.clients.openWindow(dest);
    }),
  );
});
