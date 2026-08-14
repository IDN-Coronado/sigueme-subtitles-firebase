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
