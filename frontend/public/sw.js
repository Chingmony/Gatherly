// Self-destroying service worker (kill-switch).
//
// A previous production build committed a next-pwa/workbox service worker here that
// served `/_next/static/*.js` with a CacheFirst strategy. In development that SW kept
// serving stale precached chunks (e.g. an old dashboard bundle importing AlertTriangle),
// so rebuilds never reached the browser.
//
// This replacement unregisters itself and purges every cache on the next page load.
// Once it has run on a client, that browser no longer has any SW intercepting requests.

self.addEventListener("install", () => {
  self.skipWaiting();
});

self.addEventListener("activate", (event) => {
  event.waitUntil(
    (async () => {
      // Drop every Cache Storage entry the old SW created.
      const keys = await caches.keys();
      await Promise.all(keys.map((key) => caches.delete(key)));

      // Remove this service worker registration entirely.
      await self.registration.unregister();

      // Force every open tab to reload from the network (now SW-free).
      const clients = await self.clients.matchAll({ type: "window" });
      for (const client of clients) {
        client.navigate(client.url);
      }
    })()
  );
});
