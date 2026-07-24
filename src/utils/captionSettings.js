const CHANNEL_NAME = "sigueme-console-cc";
const GLOBAL_STORAGE_KEY = "sigueme:cc-settings:global";
const PROGRAM_STORAGE_PREFIX = "sigueme:cc-settings:program:";
/** Legacy flat key — migrated once into global song+bible. */
const LEGACY_STORAGE_KEY = "sigueme:console-cc";

export const DEFAULT_TEXT_COLOR = "#e0e3e5";
/** Font size in live-stage pixels. */
export const DEFAULT_TEXT_SIZE = 60;
export const MIN_TEXT_SIZE = 24;
export const MAX_TEXT_SIZE = 128;
export const TEXT_SIZE_STEP = 4;

export const CONTENT_TYPES = ["song", "bible"];

/** @deprecated Legacy index → px map (textSize is now pixels). */
const LEGACY_INDEX_PX = [30, 36, 48, 60, 72, 96, 128];

/** @deprecated Prefer textSizePx — kept for reference. */
export const LIVE_FONT_SIZES_PX = LEGACY_INDEX_PX;

/** @deprecated Prefer textSizePx */
export const CONSOLE_TEXT_SIZES = [
  "text-sm",
  "text-base",
  "text-lg",
  "text-xl",
  "text-2xl",
  "text-3xl",
  "text-4xl",
];

/** @deprecated Prefer textSizePx */
export const LIVE_TEXT_SIZES = [
  "text-2xl sm:text-3xl",
  "text-3xl sm:text-4xl",
  "text-4xl sm:text-5xl",
  "text-4xl sm:text-5xl md:text-6xl",
  "text-5xl sm:text-6xl md:text-7xl",
  "text-6xl sm:text-7xl md:text-8xl",
  "text-7xl sm:text-8xl md:text-9xl",
];

/** Hardcoded single-style defaults (before any localStorage). */
export const HARDCODED_STYLE = {
  textColor: DEFAULT_TEXT_COLOR,
  textSize: DEFAULT_TEXT_SIZE,
  isCC: true,
  align: "center",
};

/** Hardcoded global bundle — songs and bible start identical. */
export const HARDCODED_GLOBAL_BUNDLE = {
  song: { ...HARDCODED_STYLE },
  bible: { ...HARDCODED_STYLE },
};

/** @deprecated Use HARDCODED_STYLE / getStyleFromBundle */
export const DEFAULT_CAPTION_SETTINGS = { ...HARDCODED_STYLE };

let channel;
const localListeners = new Set();

function getChannel() {
  if (typeof BroadcastChannel === "undefined") return null;
  if (!channel) channel = new BroadcastChannel(CHANNEL_NAME);
  return channel;
}

function clampSize(size) {
  let n = Number(size);
  if (!Number.isFinite(n)) return DEFAULT_TEXT_SIZE;
  // Migrate legacy discrete indices (0–6) to pixels.
  if (Number.isInteger(n) && n >= 0 && n <= 6) {
    n = LEGACY_INDEX_PX[n];
  }
  const snapped = Math.round(n / TEXT_SIZE_STEP) * TEXT_SIZE_STEP;
  return Math.min(MAX_TEXT_SIZE, Math.max(MIN_TEXT_SIZE, snapped));
}

function normalizeAlign(align) {
  return align === "left" || align === "right" || align === "center"
    ? align
    : "center";
}

function normalizeContentType(type) {
  return type === "bible" ? "bible" : "song";
}

export function normalizeStyle(raw) {
  if (!raw || typeof raw !== "object") {
    return { ...HARDCODED_STYLE };
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

export function normalizeBundle(raw) {
  if (!raw || typeof raw !== "object") {
    return {
      song: { ...HARDCODED_STYLE },
      bible: { ...HARDCODED_STYLE },
    };
  }

  // Legacy flat shape → apply to both content types.
  if (raw.song == null && raw.bible == null && ("textColor" in raw || "textSize" in raw || "isCC" in raw || "align" in raw)) {
    const style = normalizeStyle(raw);
    return { song: { ...style }, bible: { ...style } };
  }

  return {
    song: normalizeStyle(raw.song),
    bible: normalizeStyle(raw.bible),
  };
}

function readJson(key) {
  try {
    const raw = localStorage.getItem(key);
    return raw ? JSON.parse(raw) : null;
  } catch {
    return null;
  }
}

function writeJson(key, value) {
  try {
    localStorage.setItem(key, JSON.stringify(value));
  } catch {
    // ignore quota / private mode
  }
}

function programStorageKey(programId) {
  return `${PROGRAM_STORAGE_PREFIX}${programId}`;
}

function migrateLegacyIfNeeded() {
  if (localStorage.getItem(GLOBAL_STORAGE_KEY)) return;
  const legacy = readJson(LEGACY_STORAGE_KEY);
  if (!legacy) return;
  const bundle = normalizeBundle(legacy);
  writeJson(GLOBAL_STORAGE_KEY, bundle);
  try {
    localStorage.removeItem(LEGACY_STORAGE_KEY);
  } catch {
    // ignore
  }
}

export function getGlobalCaptionBundle() {
  migrateLegacyIfNeeded();
  const stored = readJson(GLOBAL_STORAGE_KEY);
  if (!stored) {
    return {
      song: { ...HARDCODED_STYLE },
      bible: { ...HARDCODED_STYLE },
    };
  }
  return normalizeBundle(stored);
}

export function getProgramCaptionBundle(programId) {
  if (!programId) return null;
  const stored = readJson(programStorageKey(programId));
  return stored ? normalizeBundle(stored) : null;
}

/**
 * Effective styles for a program: program-specific if saved, else global.
 */
export function getEffectiveCaptionBundle(programId) {
  const program = getProgramCaptionBundle(programId);
  if (program) return program;
  return getGlobalCaptionBundle();
}

export function getStyleFromBundle(bundle, contentType) {
  const type = normalizeContentType(contentType);
  return normalizeStyle(bundle?.[type]);
}

export function hasProgramCaptionSettings(programId) {
  if (!programId) return false;
  return Boolean(readJson(programStorageKey(programId)));
}

function notify(payload) {
  localListeners.forEach((handler) => {
    try {
      handler(payload);
    } catch {
      // ignore subscriber errors
    }
  });
  try {
    getChannel()?.postMessage(payload);
  } catch {
    // Channel unavailable
  }
}

export function saveGlobalCaptionStyle(contentType, partial) {
  const type = normalizeContentType(contentType);
  const bundle = getGlobalCaptionBundle();
  bundle[type] = normalizeStyle({ ...bundle[type], ...partial });
  writeJson(GLOBAL_STORAGE_KEY, bundle);
  notify({ type: "settings", scope: "global", bundle });
  return bundle;
}

export function saveProgramCaptionStyle(programId, contentType, partial) {
  if (!programId) {
    return saveGlobalCaptionStyle(contentType, partial);
  }
  const type = normalizeContentType(contentType);
  // First program edit clones current global so the program owns a full bundle.
  const bundle = getProgramCaptionBundle(programId) || getGlobalCaptionBundle();
  const next = {
    song: { ...bundle.song },
    bible: { ...bundle.bible },
  };
  next[type] = normalizeStyle({ ...next[type], ...partial });
  writeJson(programStorageKey(programId), next);
  notify({ type: "settings", scope: "program", programId, bundle: next });
  return next;
}

export function resetGlobalCaptionStyle(contentType) {
  const hardcoded = {
    song: { ...HARDCODED_STYLE },
    bible: { ...HARDCODED_STYLE },
  };
  if (contentType) {
    const type = normalizeContentType(contentType);
    const bundle = getGlobalCaptionBundle();
    bundle[type] = { ...HARDCODED_STYLE };
    writeJson(GLOBAL_STORAGE_KEY, bundle);
    notify({ type: "settings", scope: "global", bundle });
    return bundle;
  }
  writeJson(GLOBAL_STORAGE_KEY, hardcoded);
  notify({ type: "settings", scope: "global", bundle: hardcoded });
  return hardcoded;
}

/** Clear program overrides so the program inherits global again. */
export function resetProgramCaptionStyle(programId, contentType) {
  if (!programId) return resetGlobalCaptionStyle(contentType);

  if (!contentType) {
    try {
      localStorage.removeItem(programStorageKey(programId));
    } catch {
      // ignore
    }
    const bundle = getGlobalCaptionBundle();
    notify({ type: "settings", scope: "program", programId, bundle });
    return bundle;
  }

  const type = normalizeContentType(contentType);
  const global = getGlobalCaptionBundle();
  const existing = getProgramCaptionBundle(programId);
  if (!existing) {
    notify({ type: "settings", scope: "program", programId, bundle: global });
    return global;
  }

  const next = {
    song: { ...existing.song },
    bible: { ...existing.bible },
  };
  next[type] = { ...global[type] };
  writeJson(programStorageKey(programId), next);
  notify({ type: "settings", scope: "program", programId, bundle: next });
  return next;
}

/**
 * Subscribe to caption style changes (same window + other windows).
 * Handler is called with a change payload; re-read effective bundle as needed.
 */
export function subscribeCaptionSettings(handler) {
  localListeners.add(handler);

  const ch = getChannel();
  const onMessage = (event) => {
    if (event?.data?.type === "settings") {
      handler(event.data);
    }
  };
  const onStorage = (event) => {
    if (
      event.key === GLOBAL_STORAGE_KEY ||
      event.key === LEGACY_STORAGE_KEY ||
      (event.key && event.key.startsWith(PROGRAM_STORAGE_PREFIX)) ||
      event.key === null
    ) {
      handler({ type: "settings", scope: "storage" });
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

// --- Backward-compatible flat API (uses global song style) ---

export function getCaptionSettings() {
  return getStyleFromBundle(getGlobalCaptionBundle(), "song");
}

export function saveCaptionSettings(partial) {
  const bundle = saveGlobalCaptionStyle("song", partial);
  return bundle.song;
}

export function resetCaptionSettings() {
  const bundle = resetGlobalCaptionStyle("song");
  return bundle.song;
}

export function publishCaptionSettings(settings) {
  notify({
    type: "settings",
    scope: "global",
    bundle: normalizeBundle({ song: settings, bible: settings }),
  });
}

export function textSizePx(settings) {
  return clampSize(settings?.textSize);
}

export function textSizeClass(settings, variant = "console") {
  const px = clampSize(settings?.textSize);
  let nearest = 0;
  let best = Infinity;
  LEGACY_INDEX_PX.forEach((value, index) => {
    const dist = Math.abs(value - px);
    if (dist < best) {
      best = dist;
      nearest = index;
    }
  });
  const list = variant === "live" ? LIVE_TEXT_SIZES : CONSOLE_TEXT_SIZES;
  return list[nearest] || list[3];
}

export function alignClass(align) {
  if (align === "left") return "text-left";
  if (align === "right") return "text-right";
  return "text-center";
}

export function justifyClass(align) {
  if (align === "left") return "justify-start";
  if (align === "right") return "justify-end";
  return "justify-center";
}
