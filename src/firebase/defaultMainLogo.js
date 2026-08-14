import { mediaUrl } from "../local/mediaPath";

export const DEFAULT_MAIN_LOGO_FILENAME = "1784771762871_Logo_Principal.mp4";
export const DEFAULT_MAIN_LOGO_STORAGE_PATH = `general/${DEFAULT_MAIN_LOGO_FILENAME}`;

/**
 * Default program mainLogo — same shape as preview.resource.media.
 * Synchronous now: the URL is derived from the path instead of fetched.
 */
export function buildDefaultMainLogo() {
  return {
    title: DEFAULT_MAIN_LOGO_FILENAME,
    name: DEFAULT_MAIN_LOGO_FILENAME,
    url: mediaUrl(DEFAULT_MAIN_LOGO_STORAGE_PATH),
    storagePath: DEFAULT_MAIN_LOGO_STORAGE_PATH,
    mediaType: "video",
  };
}
