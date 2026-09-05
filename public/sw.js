self.addEventListener("push", (event) => {
  let payload = { title: "SCOOPER", body: "", url: "/" };
  try {
    payload = { ...payload, ...event.data.json() };
  } catch {
    const text = event.data ? event.data.text() : "";
    if (text) payload.body = text;
  }
  event.waitUntil(
    self.registration.showNotification(payload.title || "SCOOPER", {
      body: payload.body || "",
      icon: "/icon-192.png",
      badge: "/icon-192.png",
      data: payload.url || "/",
    }),
  );
});

self.addEventListener("notificationclick", (event) => {
  event.notification.close();
  const url = event.notification.data || "/";
  event.waitUntil(
    self.clients.matchAll({ type: "window", includeUncontrolled: true }).then((clients) => {
      for (const client of clients) {
        if ("focus" in client) {
          client.navigate(url);
          return client.focus();
        }
      }
      return self.clients.openWindow(url);
    }),
  );
});
