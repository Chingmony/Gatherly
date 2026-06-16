"use client";

import { useEffect } from "react";

/**
 * In development, next-pwa is disabled so no service worker is registered — but a
 * worker registered during a previous production build (or on another device like
 * a phone) persists and keeps serving STALE precached JS. That stale bundle can
 * call old API endpoints and surface confusing 401s. This unregisters any leftover
 * worker, drops its caches, and reloads once so the page runs fresh code.
 */
export function ServiceWorkerCleanup() {
  useEffect(() => {
    if (process.env.NODE_ENV !== "development") return;
    if (!("serviceWorker" in navigator)) return;

    navigator.serviceWorker.getRegistrations().then(async (regs) => {
      if (regs.length === 0) return; // nothing stale → no reload loop
      await Promise.all(regs.map((r) => r.unregister()));
      if ("caches" in window) {
        const keys = await caches.keys();
        await Promise.all(keys.map((k) => caches.delete(k)));
      }
      window.location.reload();
    });
  }, []);

  return null;
}
