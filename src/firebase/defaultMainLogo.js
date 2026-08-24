import { ref, getDownloadURL } from "firebase/storage";

import storage from "./storage";

export const DEFAULT_MAIN_LOGO_FILENAME = "1786859135635_Logo.mp4";
export const DEFAULT_MAIN_LOGO_STORAGE_PATH = `general/${DEFAULT_MAIN_LOGO_FILENAME}`;

/**
 * Default program mainLogo — same shape as preview.resource.media.
 */
export async function buildDefaultMainLogo() {
  const storageRef = ref(storage, DEFAULT_MAIN_LOGO_STORAGE_PATH);
  const url = await getDownloadURL(storageRef);
  return {
    title: DEFAULT_MAIN_LOGO_FILENAME,
    name: DEFAULT_MAIN_LOGO_FILENAME,
    url,
    storagePath: DEFAULT_MAIN_LOGO_STORAGE_PATH,
    mediaType: "video",
  };
}
