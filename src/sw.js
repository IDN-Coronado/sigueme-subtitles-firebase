import { precacheAndRoute } from "workbox-precaching";

// App-shell files are intentionally not precached (globPatterns: [] in
// vite.config.js) — this worker only ever caches Firebase Storage media,
// added in a later PR. self.__WB_MANIFEST is required by workbox-precaching
// even when empty.
precacheAndRoute(self.__WB_MANIFEST);

self.skipWaiting();
self.addEventListener("activate", (event) => {
  event.waitUntil(self.clients.claim());
});
