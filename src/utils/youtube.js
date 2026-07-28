const YOUTUBE_ID_RE =
  /(?:youtube\.com\/(?:watch\?(?:[^#]*&)?v=|embed\/|v\/|shorts\/)|youtu\.be\/)([A-Za-z0-9_-]{11})/;

/**
 * Parse YouTube time tokens: "90", "90s", "1m30s", "1h2m3s".
 */
export function parseYouTubeTimeToken(value) {
  if (value == null || value === "") return null;
  const s = String(value).trim();
  if (/^\d+(\.\d+)?$/.test(s)) {
    const n = Math.floor(Number(s));
    return Number.isFinite(n) && n >= 0 ? n : null;
  }
  const match = s.match(/^(?:(\d+)h)?(?:(\d+)m)?(?:(\d+)s)?$/i);
  if (!match || (!match[1] && !match[2] && !match[3])) return null;
  const seconds =
    Number(match[1] || 0) * 3600 +
    Number(match[2] || 0) * 60 +
    Number(match[3] || 0);
  return Number.isFinite(seconds) && seconds >= 0 ? seconds : null;
}

/**
 * Extract an 11-char YouTube video id from a watch / short / embed / youtu.be URL.
 */
export function parseYouTubeId(input = "") {
  const raw = String(input).trim();
  if (!raw) return null;
  if (/^[A-Za-z0-9_-]{11}$/.test(raw)) return raw;
  const match = raw.match(YOUTUBE_ID_RE);
  return match?.[1] || null;
}

/**
 * Read start offset (seconds) from `t` / `start` query params or `#t=` hash.
 */
export function parseYouTubeStartSeconds(input = "") {
  const raw = String(input).trim();
  if (!raw) return 0;

  try {
    const href = /^https?:\/\//i.test(raw) ? raw : `https://${raw}`;
    const url = new URL(href);

    for (const key of ["t", "start"]) {
      const fromQuery = parseYouTubeTimeToken(url.searchParams.get(key));
      if (fromQuery != null) return fromQuery;
    }

    const hash = url.hash.replace(/^#/, "");
    if (hash) {
      const hashParams = new URLSearchParams(hash);
      const fromHashParam = parseYouTubeTimeToken(hashParams.get("t"));
      if (fromHashParam != null) return fromHashParam;
      if (hash.startsWith("t=")) {
        const fromHash = parseYouTubeTimeToken(hash.slice(2));
        if (fromHash != null) return fromHash;
      }
    }
  } catch {
    const tMatch = raw.match(/[?&#](?:t|start)=([^&#]+)/i);
    if (tMatch) {
      const fromLoose = parseYouTubeTimeToken(decodeURIComponent(tMatch[1]));
      if (fromLoose != null) return fromLoose;
    }
  }

  return 0;
}

export function youtubeWatchUrl(videoId, startSeconds = 0) {
  const base = `https://www.youtube.com/watch?v=${videoId}`;
  if (startSeconds > 0) return `${base}&t=${Math.floor(startSeconds)}s`;
  return base;
}

export function youtubeThumbnailUrl(videoId) {
  return `https://i.ytimg.com/vi/${videoId}/hqdefault.jpg`;
}

let apiPromise;

/**
 * Load the official YouTube IFrame Player API (enablejsapi) once per page.
 * This is the supported way to control playback programmatically.
 */
export function loadYouTubeIframeAPI() {
  if (typeof window === "undefined") {
    return Promise.reject(new Error("YouTube API requires a browser"));
  }
  if (window.YT?.Player) return Promise.resolve(window.YT);
  if (apiPromise) return apiPromise;

  apiPromise = new Promise((resolve, reject) => {
    const prev = window.onYouTubeIframeAPIReady;
    window.onYouTubeIframeAPIReady = () => {
      try {
        prev?.();
      } catch {
        // ignore previous handler errors
      }
      if (window.YT?.Player) resolve(window.YT);
      else reject(new Error("YouTube IFrame API failed to load"));
    };

    if (!document.getElementById("youtube-iframe-api")) {
      const tag = document.createElement("script");
      tag.id = "youtube-iframe-api";
      tag.src = "https://www.youtube.com/iframe_api";
      tag.async = true;
      tag.onerror = () => {
        apiPromise = null;
        reject(new Error("Failed to load YouTube IFrame API script"));
      };
      document.head.appendChild(tag);
    }
  });

  return apiPromise;
}
