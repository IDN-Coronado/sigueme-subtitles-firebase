// Must stay in sync with MEDIA_CACHE_NAME in src/sw.js — duplicated rather
// than imported because the service worker is bundled as a separate entry.
export const MEDIA_CACHE_NAME = "sigueme-media-v1";

// Evicts a single cached media response by its exact download URL. Safe to
// call even when nothing is cached (no SW, cache miss, browser without
// Cache Storage support) — eviction is best-effort cleanup, not correctness
// critical, since a stale cache entry only affects a deleted file that no
// longer has any UI path pointing back at it.
export async function evictCachedMedia(url) {
  if (!url || !("caches" in window)) return;
  try {
    const cache = await caches.open(MEDIA_CACHE_NAME);
    await cache.delete(url, { ignoreVary: true });
  } catch {
    // Cache Storage unavailable or errored — nothing to clean up.
  }
}
