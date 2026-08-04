import { MEDIA_CACHE_NAME } from "./mediaCache";

const DEFAULT_CONCURRENCY = 3;

// Walks a program's schedule and returns the Storage-hosted asset URLs it
// references — media items (except YouTube, which isn't Storage-hosted)
// and theme backgrounds. Songs/Bible items have no media asset. Dedupes by
// URL in case the same asset is referenced more than once.
export function collectPrecacheTargets(schedule) {
  const targets = [];
  const seen = new Set();

  for (const item of schedule || []) {
    let url = null;
    if (item?.type === "media" && item.mediaType !== "youtube") {
      url = item.url || null;
    } else if (item?.type === "theme") {
      url = item.backgroundUrl || null;
    }
    if (!url || seen.has(url)) continue;
    seen.add(url);
    targets.push({ id: item.id, url });
  }

  return targets;
}

async function cacheTarget(url) {
  const cache = await caches.open(MEDIA_CACHE_NAME);
  const existing = await cache.match(url);
  if (existing) return;

  const res = await fetch(url);
  if (!res.ok) throw new Error(`HTTP ${res.status}`);

  // Write to Cache Storage ourselves and await it, rather than relying on
  // the service worker's own CacheFirst route to have cached this as a
  // side effect of the fetch above. That write happens inside the SW's
  // fetch handler via event.waitUntil(), independently of when this
  // fetch() promise resolves — a QuotaExceededError or other cache.put()
  // failure there would NOT reject this promise, so a "successful" fetch
  // here is not proof the bytes are actually cached. Doing (and awaiting)
  // the write directly is the only way to know for sure; it's redundant
  // with whatever the SW's route also does for the same request, but
  // that's harmless (same bytes, last write wins).
  await cache.put(url, res);
}

// Forces every Storage-hosted asset referenced by `schedule` into the
// media cache (see cacheTarget above), so playback doesn't hit the network
// cold during a live service. This is the *reliable* way to fully cache a
// video — unlike passively caching from normal <video> playback (see
// src/sw.js comments), a plain fetch() here never carries a Range header,
// so the network always returns a complete, cacheable 200.
//
// Requires an active service worker controlling this page; without one,
// fetch() would just download and discard bytes for nothing (the SW's
// runtime-caching route wouldn't be running at all), so precaching isn't
// attempted — every target is reported "unavailable" rather than silently
// wasting bandwidth or being mistaken for a successful cache.
//
// Returns { status, targets, results } where status is:
//   "success"     — every target is verified cached
//   "partial"     — some targets cached, some failed
//   "error"       — every target failed
//   "unavailable" — no active SW controller; nothing was attempted
// (schedules with zero cacheable targets return "success" trivially).
export async function precacheSchedule(
  schedule,
  { concurrency = DEFAULT_CONCURRENCY, onProgress } = {}
) {
  const targets = collectPrecacheTargets(schedule);
  const total = targets.length;

  if (total === 0) {
    return { status: "success", targets, results: [] };
  }

  if (!("caches" in window) || !navigator.serviceWorker?.controller) {
    const results = targets.map((target) => ({ ...target, status: "unavailable" }));
    results.forEach((result, index) =>
      onProgress?.({ ...result, completed: index + 1, total })
    );
    return { status: "unavailable", targets, results };
  }

  let completed = 0;
  let cursor = 0;
  const results = new Array(total);

  async function worker() {
    while (cursor < targets.length) {
      const index = cursor++;
      const target = targets[index];
      onProgress?.({ ...target, status: "loading", completed, total });

      let status;
      try {
        await cacheTarget(target.url);
        status = "cached";
      } catch {
        status = "error";
      }

      results[index] = { ...target, status };
      completed += 1;
      onProgress?.({ ...target, status, completed, total });
    }
  }

  const workerCount = Math.max(1, Math.min(concurrency, targets.length));
  await Promise.all(Array.from({ length: workerCount }, worker));

  const cachedCount = results.filter((result) => result.status === "cached").length;
  const status =
    cachedCount === total ? "success" : cachedCount === 0 ? "error" : "partial";

  return { status, targets, results };
}
