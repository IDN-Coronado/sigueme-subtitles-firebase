import { precacheAndRoute } from "workbox-precaching";
import { registerRoute } from "workbox-routing";
import { CacheFirst } from "workbox-strategies";
import { CacheableResponsePlugin } from "workbox-cacheable-response";
import { RangeRequestsPlugin } from "workbox-range-requests";

// App-shell files are intentionally not precached (globPatterns: [] in
// vite.config.js) — this worker only ever caches Firebase Storage media.
// self.__WB_MANIFEST is required by workbox-precaching even when empty.
precacheAndRoute(self.__WB_MANIFEST);

// Every upload gets a unique, timestamped Storage path (see
// src/firebase/useMedia.js / useThemes.js), so a cached URL's bytes never
// change — cache-first with no expiry is correct. Cache lifetime is managed
// explicitly (eviction on delete / program deactivation) elsewhere, not by
// a TTL here.
//
// RangeRequestsPlugin lets <video> seeking work against a cached entry by
// slicing 206 responses out of a cached full 200 — but it can only slice a
// *complete* cached response. <video preload="auto"> commonly issues its
// very first request with a Range header already attached (to probe
// Accept-Ranges support); a 206 network response is never cached (statuses
// below only allow 0/200), so casual playback alone does not reliably
// populate the cache for video. Images/audio (plain GET) do cache
// opportunistically from normal use. The reliable way to fully cache a
// video is an explicit `fetch(url)` with no Range header — that's what the
// precache-on-activate flow (added in a later PR) does; once an entry is
// fully cached that way, subsequent <video> Range requests are correctly
// sliced from it (verified manually: seeking to multiple offsets and
// playing back all resolve with zero network bytes served from cache).
//
// Media elements must also set crossOrigin="anonymous" (see every <video>/
// <img>/<audio> reading a Storage URL in src/components) — without it, the
// browser fetches in opaque no-cors mode, which RangeRequestsPlugin cannot
// slice at all (opaque responses hide their bytes from the Cache/Fetch
// APIs), corrupting playback once a Range request hits an opaque cache
// entry.
export const MEDIA_CACHE_NAME = "sigueme-media-v1";

// Match only actual media downloads (getDownloadURL() responses carry
// ?alt=media), never the Storage REST API's listAll()/getMetadata() calls
// (plain /o/<path> or /o?prefix=... requests) — those must always hit the
// network so uploads/deletes/renames show up immediately in the UI.
registerRoute(
  ({ url }) =>
    url.hostname === "firebasestorage.googleapis.com" &&
    url.searchParams.get("alt") === "media",
  new CacheFirst({
    cacheName: MEDIA_CACHE_NAME,
    plugins: [
      new CacheableResponsePlugin({ statuses: [0, 200] }),
      new RangeRequestsPlugin(),
    ],
  })
);

self.skipWaiting();
self.addEventListener("activate", (event) => {
  event.waitUntil(self.clients.claim());
});
