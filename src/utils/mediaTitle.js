/**
 * Turn a Storage object name like "1722123456789_My_Title.mp4" into "My Title".
 * Falls back to the original string when it doesn't look like our upload pattern.
 */
export function humanizeMediaFileName(fileName = "") {
  const raw = String(fileName || "").trim();
  if (!raw) return "";

  const withoutExt = raw.replace(/\.[^.]+$/, "");
  const stripped = withoutExt.replace(/^\d{10,}_/, "");
  const spaced = stripped.replace(/_+/g, " ").trim();
  return spaced || withoutExt || raw;
}

/**
 * Prefer an explicit title, otherwise humanize a storage / schedule name.
 */
export function mediaDisplayTitle(item) {
  if (!item) return "";
  if (item.mediaType === "youtube" || item.type === "youtube") {
    return item.title || item.name || "";
  }

  const explicit = String(item.title || "").trim();
  const name = String(item.name || "").trim();

  // Stored title that still looks like a storage object name.
  if (explicit && !/^\d{10,}_/.test(explicit)) return explicit;
  if (name && !/^\d{10,}_/.test(name) && !/\.[a-z0-9]+$/i.test(name)) {
    return name;
  }

  return (
    humanizeMediaFileName(explicit) ||
    humanizeMediaFileName(name) ||
    explicit ||
    name
  );
}
