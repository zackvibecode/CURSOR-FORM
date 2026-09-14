/* OneForm service worker — Web Push + notification click handling */
/* global self, clients */

self.addEventListener("install", (event) => {
  self.skipWaiting();
});

self.addEventListener("activate", (event) => {
  event.waitUntil(self.clients.claim());
});

self.addEventListener("push", (event) => {
  let data = {
    title: "New Form Submission",
    body: "You have a new enquiry.",
    url: "/dashboard/submissions",
    icon: "/favicon-icon.png",
    badge: "/favicon-icon.png",
    tag: "oneform-submission",
  };

  try {
    if (event.data) {
      const parsed = event.data.json();
      data = { ...data, ...parsed };
    }
  } catch {
    try {
      const text = event.data && event.data.text();
      if (text) data.body = text;
    } catch {
      // ignore malformed payloads
    }
  }

  const options = {
    body: data.body || "You have a new enquiry.",
    icon: data.icon || "/favicon-icon.png",
    badge: data.badge || "/favicon-icon.png",
    tag: data.tag || "oneform-submission",
    renotify: true,
    data: {
      url: data.url || "/dashboard/submissions",
    },
    requireInteraction: false,
  };

  event.waitUntil(
    self.registration.showNotification(data.title || "New Form Submission", options)
  );
});

self.addEventListener("notificationclick", (event) => {
  event.notification.close();

  const targetPath =
    (event.notification.data && event.notification.data.url) || "/dashboard/submissions";

  event.waitUntil(
    (async () => {
      const absoluteUrl = new URL(targetPath, self.location.origin).href;
      const allClients = await self.clients.matchAll({
        type: "window",
        includeUncontrolled: true,
      });

      for (const client of allClients) {
        if ("focus" in client) {
          try {
            await client.focus();
            if ("navigate" in client && typeof client.navigate === "function") {
              await client.navigate(absoluteUrl);
            }
            return;
          } catch {
            // fall through to openWindow
          }
        }
      }

      if (self.clients.openWindow) {
        await self.clients.openWindow(absoluteUrl);
      }
    })()
  );
});
