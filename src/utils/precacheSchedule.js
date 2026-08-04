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

// Forces every Storage-hosted asset referenced by `schedule` into the
// service worker's media cache (see src/sw.js's CacheFirst route), so
// playback doesn't hit the network cold during a live service. This is the
// *reliable* way to fully cache a video — unlike passively caching from
// normal <video> playback (see src/sw.js comments), a plain fetch() here
// never carries a Range header, so the network always returns a complete,
// cacheable 200.
//
// Requires an active service worker controlling this page; without one,
// fetch() would just download and discard bytes for nothing, so precaching
// is skipped entirely (every target reported "skipped") rather than
// silently wasting bandwidth.
export async function precacheSchedule(
  schedule,
  { concurrency = DEFAULT_CONCURRENCY, onProgress } = {}
) {
  const targets = collectPrecacheTargets(schedule);

  if (!("caches" in window) || !navigator.serviceWorker?.controller) {
    targets.forEach((target) =>
      onProgress?.({ ...target, status: "skipped", completed: 0, total: targets.length })
    );
    return targets;
  }

  const total = targets.length;
  let completed = 0;
  let cursor = 0;

  async function worker() {
    while (cursor < targets.length) {
      const target = targets[cursor++];
      onProgress?.({ ...target, status: "loading", completed, total });
      try {
        const alreadyCached = await caches.match(target.url);
        if (!alreadyCached) {
          const res = await fetch(target.url);
          if (!res.ok) throw new Error(`HTTP ${res.status}`);
        }
        completed += 1;
        onProgress?.({ ...target, status: "cached", completed, total });
      } catch (err) {
        completed += 1;
        onProgress?.({ ...target, status: "error", completed, total, error: err });
      }
    }
  }

  const workerCount = Math.max(1, Math.min(concurrency, targets.length));
  await Promise.all(Array.from({ length: workerCount }, worker));

  return targets;
}
