import { useState, useEffect, useCallback } from "react";

import useDataStore, { newId } from "../local/data";
import { mediaUrl, newStoragePath } from "../local/mediaPath";
import { humanizeMediaFileName } from "../utils/mediaTitle";
import {
  parseYouTubeId,
  parseYouTubeStartSeconds,
  youtubeThumbnailUrl,
  youtubeWatchUrl,
} from "../utils/youtube";

const IMAGE_EXT = /\.(jpe?g|png|gif|webp|svg|bmp|avif)$/i;
const VIDEO_EXT = /\.(mp4|webm|mov|m4v|ogv)$/i;
const AUDIO_EXT = /\.(mp3|wav|m4a|aac|flac|oga|ogg|opus|wma)$/i;
const PPTX_EXT = /\.pptx$/i;

function getMediaType(name) {
  if (PPTX_EXT.test(name)) return "pptx";
  if (VIDEO_EXT.test(name)) return "video";
  if (AUDIO_EXT.test(name)) return "audio";
  if (IMAGE_EXT.test(name)) return "image";
  return null;
}

function mergeMediaLists(files, youtubeItems) {
  const combined = [...files, ...youtubeItems];
  combined.sort((a, b) =>
    a.name.localeCompare(b.name, undefined, { sensitivity: "base" })
  );
  return combined;
}

/**
 * Display shape for a YouTube entry, stored as-is in the local store so reads
 * need no mapping. Also used by the Firebase import (src/local/migrate.js).
 */
export function buildYouTubeMedia({ id, url, title }) {
  const youtubeId = parseYouTubeId(url);
  if (!youtubeId) throw new Error("Invalid YouTube URL");

  const startSeconds = parseYouTubeStartSeconds(url);
  const name = String(title || "").trim() || `YouTube ${youtubeId}`;

  return {
    id: id || newId(),
    type: "youtube",
    source: "youtube",
    name,
    title: name,
    youtubeId,
    url: youtubeWatchUrl(youtubeId, startSeconds),
    thumbnailUrl: youtubeThumbnailUrl(youtubeId),
    ...(startSeconds > 0 ? { startSeconds } : {}),
  };
}

// Files come from the local media folder via the preload bridge; titles live
// in data.json under mediaTitles, replacing Storage's customMetadata.
function useMedia() {
  const [fileMedia, setFileMedia] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const youtubeMedia = useDataStore((s) => s.data.media);
  const write = useDataStore((s) => s.write);

  const media = mergeMediaLists(fileMedia, youtubeMedia);

  const loadFileMedia = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const files = await window.desktop.media.list();
      const titles = useDataStore.getState().data.mediaTitles || {};

      const items = files.map((file) => ({
        id: file.storagePath,
        name:
          titles[file.storagePath] ||
          humanizeMediaFileName(file.fileName) ||
          file.fileName,
        fileName: file.fileName,
        fullPath: file.storagePath,
        url: mediaUrl(file.storagePath),
        type: getMediaType(file.fileName),
        source: "local",
      }));

      items.sort((a, b) =>
        a.name.localeCompare(b.name, undefined, { sensitivity: "base" })
      );
      setFileMedia(items);
    } catch (err) {
      console.error("Failed to read the local media folder", err);
      setError(err);
      setFileMedia([]);
    } finally {
      setLoading(false);
    }
  }, []);

  // Only on mount: upload and remove call loadFileMedia themselves, and it
  // reads titles through getState(), so it always sees the fresh map.
  useEffect(() => {
    loadFileMedia();
  }, [loadFileMedia]);

  const uploadMedia = useCallback(
    async ({ file, title }) => {
      const storagePath = newStoragePath("general", file.name, title);
      await window.desktop.media.save(storagePath, await file.arrayBuffer());

      const trimmed = String(title || "").trim();
      const { data } = useDataStore.getState();
      await write({
        mediaTitles: {
          ...(data.mediaTitles || {}),
          [storagePath]:
            trimmed || humanizeMediaFileName(file.name) || file.name,
        },
      });

      await loadFileMedia();
      return storagePath;
    },
    [loadFileMedia, write]
  );

  const addYouTubeMedia = async ({ url, title }) => {
    const item = buildYouTubeMedia({ url, title });
    await write({ media: [...youtubeMedia, item] });
    return item.id;
  };

  const updateYouTubeMedia = async ({ id, url, title }) => {
    if (!id) throw new Error("Missing YouTube media id");
    const item = buildYouTubeMedia({ id, url, title });
    await write({ media: youtubeMedia.map((m) => (m.id === id ? item : m)) });
    return id;
  };

  const removeMedia = useCallback(
    async (item) => {
      if (item?.type === "youtube" || item?.source === "youtube") {
        if (!item.id) throw new Error("Missing YouTube media id");
        await write({ media: youtubeMedia.filter((m) => m.id !== item.id) });
        return;
      }

      const storagePath = item?.fullPath || item?.id;
      if (!storagePath) throw new Error("Missing media path");
      await window.desktop.media.remove(storagePath);

      const { data } = useDataStore.getState();
      const titles = { ...(data.mediaTitles || {}) };
      delete titles[storagePath];
      await write({ mediaTitles: titles });

      await loadFileMedia();
    },
    [loadFileMedia, write, youtubeMedia]
  );

  return {
    media,
    loading,
    error,
    reload: loadFileMedia,
    uploadMedia,
    addYouTubeMedia,
    updateYouTubeMedia,
    removeMedia,
  };
}

export default useMedia;
