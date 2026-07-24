const CHANNEL_NAME = "sigueme-live-view-size";
const STORAGE_KEY = "sigueme:live-view-size";

/** Fallback when live view has never reported a size. */
export const DEFAULT_LIVE_VIEW_SIZE = { width: 1920, height: 1080 };

let channel;
const localListeners = new Set();

function getChannel() {
  if (typeof BroadcastChannel === "undefined") return null;
  if (!channel) channel = new BroadcastChannel(CHANNEL_NAME);
  return channel;
}

function normalizeSize(raw) {
  const width = Number(raw?.width);
  const height = Number(raw?.height);
  if (
    !Number.isFinite(width) ||
    !Number.isFinite(height) ||
    width < 1 ||
    height < 1
  ) {
    return null;
  }
  return { width: Math.round(width), height: Math.round(height) };
}

export function getLiveViewSize() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    return normalizeSize(raw ? JSON.parse(raw) : null) || {
      ...DEFAULT_LIVE_VIEW_SIZE,
    };
  } catch {
    return { ...DEFAULT_LIVE_VIEW_SIZE };
  }
}

export function publishLiveViewSize(size) {
  const normalized = normalizeSize(size);
  if (!normalized) return null;

  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(normalized));
  } catch {
    // ignore quota / private mode
  }

  localListeners.forEach((handler) => {
    try {
      handler(normalized);
    } catch {
      // ignore subscriber errors
    }
  });

  try {
    getChannel()?.postMessage({ type: "size", ...normalized });
  } catch {
    // Channel unavailable
  }

  return normalized;
}

/** Ask the live view window to re-broadcast its current size. */
export function requestLiveViewSize() {
  try {
    getChannel()?.postMessage({ type: "request-size" });
  } catch {
    // Channel unavailable
  }
}

/**
 * Subscribe to live viewport size updates (same window + other windows).
 * Handler receives `{ width, height }`.
 */
export function subscribeLiveViewSize(handler) {
  localListeners.add(handler);

  const ch = getChannel();
  const onMessage = (event) => {
    const data = event?.data;
    if (!data || data.type === "request-size") return;
    const size = normalizeSize(data);
    if (size) handler(size);
  };
  const onStorage = (event) => {
    if (event.key === STORAGE_KEY || event.key === null) {
      handler(getLiveViewSize());
    }
  };

  ch?.addEventListener("message", onMessage);
  window.addEventListener("storage", onStorage);

  return () => {
    localListeners.delete(handler);
    ch?.removeEventListener("message", onMessage);
    window.removeEventListener("storage", onStorage);
  };
}

/**
 * Live window: publish size on resize and answer console requests.
 * Returns an unsubscribe function.
 */
export function startLiveViewSizeReporter() {
  const publish = () => {
    publishLiveViewSize({
      width: window.innerWidth,
      height: window.innerHeight,
    });
  };

  publish();

  const onResize = () => publish();
  const onMessage = (event) => {
    if (event?.data?.type === "request-size") publish();
  };

  window.addEventListener("resize", onResize);
  window.addEventListener("fullscreenchange", onResize);
  getChannel()?.addEventListener("message", onMessage);

  return () => {
    window.removeEventListener("resize", onResize);
    window.removeEventListener("fullscreenchange", onResize);
    getChannel()?.removeEventListener("message", onMessage);
  };
}
