/**
 * Local assets are served by the Electron main process from a folder on disk,
 * keyed by the same root-relative paths that used to be Storage object paths
 * (general/…, themes/…). Every storagePath already written into a program
 * schedule therefore resolves unchanged — only the root moved.
 *
 * URLs stay relative so the same string works whether the renderer is served
 * by the loopback server (`npm run desktop`) or by vite, which proxies /media
 * to it (`npm run desktop:dev`).
 */
export function mediaUrl(storagePath) {
  if (!storagePath) return "";
  const clean = String(storagePath).replace(/^\/+/, "");
  return `/media/${clean.split("/").map(encodeURIComponent).join("/")}`;
}

/**
 * Resolves an asset reference to its local URL.
 *
 * storagePath is the identifier; a persisted `url` is treated as stale legacy,
 * because records written before the move carry absolute Firebase Storage URLs.
 * Deriving here rather than trusting what was stored means nothing depends on
 * a migration having run — the import's URL rewrite is cleanup, not
 * correctness. YouTube items have no storagePath, so their url passes through.
 */
export function localUrl(storagePath, fallbackUrl) {
  return storagePath ? mediaUrl(storagePath) : fallbackUrl || "";
}

/** Schedule item with its asset URL re-pointed at the local media folder. */
export function localizeScheduleItem(item, themeById) {
  if (!item) return item;

  if (item.storagePath) {
    return { ...item, url: mediaUrl(item.storagePath) };
  }

  // Theme items carry backgroundUrl but no storagePath of their own, so the
  // local path has to come from the theme they reference.
  if (item.type === "theme" && item.themeId) {
    const theme = themeById?.get(item.themeId);
    if (theme?.storagePath) {
      return { ...item, backgroundUrl: mediaUrl(theme.storagePath) };
    }
  }

  return item;
}

/** Storage-compatible object path for a newly added file. */
export function newStoragePath(folder, fileName, title) {
  const trimmed = String(title || "").trim();
  const ext = fileName.includes(".") ? `.${fileName.split(".").pop()}` : "";
  const base = (
    trimmed ||
    fileName.replace(/\.[^.]+$/, "") ||
    "media"
  ).replace(/[^\w.\-]+/g, "_");
  return `${folder}/${Date.now()}_${base}${ext}`;
}
