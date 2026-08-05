import {
  precacheAndRoute,
  cleanupOutdatedCaches,
  createHandlerBoundToURL,
} from "workbox-precaching";
import { registerRoute, NavigationRoute } from "workbox-routing";
import { CacheFirst } from "workbox-strategies";
import { CacheableResponsePlugin } from "workbox-cacheable-response";
import { RangeRequestsPlugin } from "workbox-range-requests";

// Precache the app shell (index.html + main JS/CSS bundle — see
// vite.config.js's globPatterns for what's included and, importantly, what
// isn't) so a reload/reopen without connectivity can still boot the app,
// not just play already-cached media. cleanupOutdatedCaches() removes the
// *previous* build's precached entries once a new one activates, so
// content-hashed chunks from old deploys don't accumulate forever.
precacheAndRoute(self.__WB_MANIFEST);
cleanupOutdatedCaches();

// This is a client-side-routed SPA (react-router's createBrowserRouter) —
// a reload/direct navigation to e.g. /live or /program/abc123 isn't a real
// file; Firebase Hosting's rewrite ("source": "**" -> "/index.html", see
// firebase.json) handles that server-side when online. Offline, there's no
// server to do the rewrite, so the service worker must: any same-origin
// navigation request is answered with the precached index.html, letting
// the already-loaded (or now-booting) client-side router take it from
// there.
registerRoute(new NavigationRoute(createHandlerBoundToURL("index.html")));

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

// No self.skipWaiting() here — deliberately. Now that the app shell itself
// is precached and version-tied to a specific build, letting a newly
// installed worker immediately take over would risk serving a mismatched
// mix of old-version page code and new-version cached assets to a tab
// that's already open (the classic SPA-update version-skew problem). A
// live service can run for hours in an already-open tab; a deploy landing
// mid-service must not be able to disturb it. Default Workbox/SW lifecycle
// already handles this safely: a new worker installs and waits until every
// tab running the previous version has closed, then activates and takes
// over on the next open — no explicit prompt/logic needed. This only
// affects *updates*; a first-ever install has no previous worker to wait
// on, so it activates immediately either way.
self.addEventListener("activate", (event) => {
  event.waitUntil(self.clients.claim());
});
