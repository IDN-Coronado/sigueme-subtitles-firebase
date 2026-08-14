import { useMemo } from "react";

import useDataStore, { newId, byTitle } from "../local/data";
import { localUrl, mediaUrl, newStoragePath } from "../local/mediaPath";

// Theme records and their background assets are both local now. backgroundUrl
// is derived from storagePath on write rather than persisted as an absolute
// URL, so moving the media folder cannot strand a theme.
function useThemes() {
  const stored = useDataStore((s) => s.data.themes);
  const write = useDataStore((s) => s.write);

  // Derived on read, so a theme imported with an absolute Storage URL still
  // renders from disk without waiting on the media import to rewrite it.
  const themes = useMemo(
    () =>
      stored.map((theme) => ({
        ...theme,
        backgroundUrl: localUrl(theme.storagePath, theme.backgroundUrl),
      })),
    [stored]
  );

  const addTheme = async ({ title, file }) => {
    const storagePath = newStoragePath("themes", file.name, title);
    await window.desktop.media.save(storagePath, await file.arrayBuffer());

    const assetType = file.type.startsWith("image/")
      ? "image"
      : file.type.startsWith("video/")
        ? "video"
        : "";

    const theme = {
      id: newId(),
      title: title.trim(),
      storagePath,
      backgroundUrl: mediaUrl(storagePath),
      type: assetType,
    };

    // Written from `stored`, not the derived list, so the computed
    // backgroundUrl never gets persisted back into the file.
    await write({ themes: [...stored, theme].sort(byTitle) });
    return theme;
  };

  const removeTheme = async (theme) => {
    if (theme.storagePath) {
      await window.desktop.media.remove(theme.storagePath);
    }
    await write({ themes: stored.filter((t) => t.id !== theme.id) });
  };

  return {
    themes,
    addTheme,
    removeTheme,
  };
}

export default useThemes;
