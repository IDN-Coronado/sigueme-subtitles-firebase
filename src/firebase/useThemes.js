import useDataStore, { newId, byTitle } from "../local/data";
import { mediaUrl, newStoragePath } from "../local/mediaPath";

// Theme records and their background assets are both local now. backgroundUrl
// is derived from storagePath on write rather than persisted as an absolute
// URL, so moving the media folder cannot strand a theme.
function useThemes() {
  const themes = useDataStore((s) => s.data.themes);
  const write = useDataStore((s) => s.write);

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

    await write({ themes: [...themes, theme].sort(byTitle) });
    return theme;
  };

  const removeTheme = async (theme) => {
    if (theme.storagePath) {
      await window.desktop.media.remove(theme.storagePath);
    }
    await write({ themes: themes.filter((t) => t.id !== theme.id) });
  };

  return {
    themes,
    addTheme,
    removeTheme,
  };
}

export default useThemes;
