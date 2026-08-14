import {
  ref,
  deleteObject,
  uploadBytes,
  getDownloadURL,
} from "firebase/storage";

import storage from "./storage";
import useDataStore, { newId, byTitle } from "../local/data";
import { evictCachedMedia } from "../utils/mediaCache";

// The theme record is local; its background asset still lives in Firebase
// Storage until step 4 moves assets to a local media folder.
function useThemes() {
  const themes = useDataStore((s) => s.data.themes);
  const write = useDataStore((s) => s.write);

  const addTheme = async ({ title, storagePath, file }) => {
    const storageRef = ref(storage, storagePath);
    await uploadBytes(storageRef, file);
    const url = await getDownloadURL(storageRef);

    const assetType = file.type.startsWith("image/")
      ? "image"
      : file.type.startsWith("video/")
        ? "video"
        : "";

    const theme = {
      id: newId(),
      title: title.trim(),
      backgroundUrl: url,
      storagePath: storageRef.fullPath,
      type: assetType,
    };

    await write({ themes: [...themes, theme].sort(byTitle) });
    return theme;
  };

  const removeTheme = async (theme) => {
    if (theme.storagePath) {
      await deleteObject(ref(storage, theme.storagePath));
    }
    await evictCachedMedia(theme.backgroundUrl);
    await write({ themes: themes.filter((t) => t.id !== theme.id) });
  };

  return {
    themes,
    addTheme,
    removeTheme,
  };
}

export default useThemes;
