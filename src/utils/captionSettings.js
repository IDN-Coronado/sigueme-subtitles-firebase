const CHANNEL_NAME = "sigueme-console-cc";
const STORAGE_KEY = "sigueme:console-cc";

export const DEFAULT_TEXT_COLOR = "#e0e3e5";
export const DEFAULT_TEXT_SIZE = 3;
export const MIN_TEXT_SIZE = 0;
export const MAX_TEXT_SIZE = 6;

/** Tailwind text classes for console (preview) and live variants. */
export const CONSOLE_TEXT_SIZES = [
  "text-sm",
  "text-base",
  "text-lg",
  "text-xl",
  "text-2xl",
  "text-3xl",
  "text-4xl",
];

export const LIVE_TEXT_SIZES = [
  "text-2xl sm:text-3xl",
  "text-3xl sm:text-4xl",
  "text-4xl sm:text-5xl",
  "text-4xl sm:text-5xl md:text-6xl",
  "text-5xl sm:text-6xl md:text-7xl",
  "text-6xl sm:text-7xl md:text-8xl",
  "text-7xl sm:text-8xl md:text-9xl",
];

export const DEFAULT_CAPTION_SETTINGS = {
  textColor: DEFAULT_TEXT_COLOR,
  textSize: DEFAULT_TEXT_SIZE,
  isCC: true,
  align: "center",
};

let channel;
const localListeners = new Set();

function getChannel() {
  if (typeof BroadcastChannel === "undefined") return null;
  if (!channel) channel = new BroadcastChannel(CHANNEL_NAME);
  return channel;
}

function clampSize(size) {
  const n = Number(size);
  if (!Number.isFinite(n)) return DEFAULT_TEXT_SIZE;
  return Math.min(MAX_TEXT_SIZE, Math.max(MIN_TEXT_SIZE, Math.round(n)));
}

function normalizeAlign(align) {
  return align === "left" || align === "right" || align === "center"
    ? align
    : "center";
}

function normalizeSettings(raw) {
  if (!raw || typeof raw !== "object") {
    return { ...DEFAULT_CAPTION_SETTINGS };
  }
  return {
    textColor:
      typeof raw.textColor === "string" && raw.textColor
        ? raw.textColor
        : DEFAULT_TEXT_COLOR,
    textSize: clampSize(raw.textSize),
    isCC: raw.isCC !== false,
    align: normalizeAlign(raw.align),
  };
}

export function getCaptionSettings() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    return normalizeSettings(raw ? JSON.parse(raw) : null);
  } catch {
    return { ...DEFAULT_CAPTION_SETTINGS };
  }
}

export function saveCaptionSettings(partial) {
  const next = normalizeSettings({ ...getCaptionSettings(), ...partial });
  localStorage.setItem(STORAGE_KEY, JSON.stringify(next));
  publishCaptionSettings(next);
  return next;
}

export function resetCaptionSettings() {
  localStorage.removeItem(STORAGE_KEY);
  const next = { ...DEFAULT_CAPTION_SETTINGS };
  publishCaptionSettings(next);
  return next;
}

export function publishCaptionSettings(settings) {
  const normalized = normalizeSettings(settings);
  localListeners.forEach((handler) => {
    try {
      handler(normalized);
    } catch {
      // ignore subscriber errors
    }
  });
  try {
    getChannel()?.postMessage({ type: "settings", settings: normalized });
  } catch {
    // Channel unavailable
  }
}

/**
 * Subscribe to console/live caption style changes (same window + other windows).
 */
export function subscribeCaptionSettings(handler) {
  localListeners.add(handler);

  const ch = getChannel();
  const onMessage = (event) => {
    if (event?.data?.type === "settings" && event.data.settings) {
      handler(normalizeSettings(event.data.settings));
    }
  };
  const onStorage = (event) => {
    if (event.key === STORAGE_KEY || event.key === null) {
      handler(getCaptionSettings());
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

export function textSizeClass(settings, variant = "console") {
  const size = clampSize(settings?.textSize);
  const list = variant === "live" ? LIVE_TEXT_SIZES : CONSOLE_TEXT_SIZES;
  return list[size] || list[DEFAULT_TEXT_SIZE];
}

export function alignClass(align) {
  if (align === "left") return "text-left";
  if (align === "right") return "text-right";
  return "text-center";
}
