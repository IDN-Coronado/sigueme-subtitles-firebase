import { useState, useEffect, useCallback } from "react";
import {
  ref,
  listAll,
  getDownloadURL,
  getMetadata,
  uploadBytes,
  deleteObject,
} from "firebase/storage";

import storage from "./storage";
import useDataStore, { newId } from "../local/data";
import { humanizeMediaFileName } from "../utils/mediaTitle";
import { evictCachedMedia } from "../utils/mediaCache";
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
const MEDIA_EXT =
  /\.(jpe?g|png|gif|webp|svg|bmp|avif|mp4|webm|mov|m4v|ogv|mp3|wav|m4a|aac|flac|oga|ogg|opus|wma|pptx)$/i;

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

// File media still comes from Firebase Storage; step 4 moves it to a local
// folder. YouTube entries are local already — they were never more than a row
// of metadata.
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
      const folderRef = ref(storage, "general");
      const result = await listAll(folderRef);
      const mediaRefs = result.items.filter((item) => MEDIA_EXT.test(item.name));

      const items = await Promise.all(
        mediaRefs.map(async (itemRef) => {
          const [url, meta] = await Promise.all([
            getDownloadURL(itemRef),
            getMetadata(itemRef).catch(() => null),
          ]);
          const storedTitle = String(meta?.customMetadata?.title || "").trim();
          const name =
            storedTitle || humanizeMediaFileName(itemRef.name) || itemRef.name;
          return {
            id: itemRef.fullPath,
            name,
            fileName: itemRef.name,
            fullPath: itemRef.fullPath,
            url,
            type: getMediaType(itemRef.name),
            source: "storage",
          };
        })
      );

      items.sort((a, b) =>
        a.name.localeCompare(b.name, undefined, { sensitivity: "base" })
      );
      setFileMedia(items);
    } catch (err) {
      console.error("Failed to load media from Storage general/", err);
      setError(err);
      setFileMedia([]);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadFileMedia();
  }, [loadFileMedia]);

  const uploadMedia = useCallback(
    async ({ file, title }) => {
      const trimmedTitle = String(title || "").trim();
      const ext = file.name.includes(".")
        ? `.${file.name.split(".").pop()}`
        : "";
      const baseName = (
        trimmedTitle ||
        file.name.replace(/\.[^.]+$/, "") ||
        "media"
      ).replace(/[^\w.\-]+/g, "_");
      const storagePath = `general/${Date.now()}_${baseName}${ext}`;
      const storageRef = ref(storage, storagePath);
      const isPptx = PPTX_EXT.test(file.name) || PPTX_EXT.test(ext);
      await uploadBytes(storageRef, file, {
        ...(isPptx
          ? {
              contentType:
                "application/vnd.openxmlformats-officedocument.presentationml.presentation",
            }
          : {}),
        customMetadata: {
          title: trimmedTitle || humanizeMediaFileName(file.name) || file.name,
        },
      });
      await loadFileMedia();
      return storageRef.fullPath;
    },
    [loadFileMedia]
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

      const path = item?.fullPath || item?.id;
      if (!path) throw new Error("Missing media path");
      await deleteObject(ref(storage, path));
      await evictCachedMedia(item?.url);
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
