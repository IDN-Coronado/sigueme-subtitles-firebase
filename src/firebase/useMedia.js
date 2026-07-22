import { useState, useEffect, useCallback } from "react";
import { ref, listAll, getDownloadURL, uploadBytes } from "firebase/storage";
import storage from "./storage";

const IMAGE_EXT = /\.(jpe?g|png|gif|webp|svg|bmp|avif)$/i;
const VIDEO_EXT = /\.(mp4|webm|mov|m4v|ogv)$/i;
const AUDIO_EXT = /\.(mp3|wav|m4a|aac|flac|oga|ogg|opus|wma)$/i;
const MEDIA_EXT = /\.(jpe?g|png|gif|webp|svg|bmp|avif|mp4|webm|mov|m4v|ogv|mp3|wav|m4a|aac|flac|oga|ogg|opus|wma)$/i;

function getMediaType(name) {
  if (VIDEO_EXT.test(name)) return "video";
  if (AUDIO_EXT.test(name)) return "audio";
  if (IMAGE_EXT.test(name)) return "image";
  return null;
}

function useMedia() {
  const [media, setMedia] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const loadMedia = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const folderRef = ref(storage, "general");
      const result = await listAll(folderRef);
      const mediaRefs = result.items.filter((item) => MEDIA_EXT.test(item.name));

      const items = await Promise.all(
        mediaRefs.map(async (itemRef) => {
          const url = await getDownloadURL(itemRef);
          return {
            id: itemRef.fullPath,
            name: itemRef.name,
            fullPath: itemRef.fullPath,
            url,
            type: getMediaType(itemRef.name),
          };
        })
      );

      items.sort((a, b) => a.name.localeCompare(b.name, undefined, { sensitivity: "base" }));
      setMedia(items);
    } catch (err) {
      console.error("Failed to load media from Storage general/", err);
      setError(err);
      setMedia([]);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadMedia();
  }, [loadMedia]);

  const filterByValue = useCallback(
    (value) => {
      const q = value.trim().toLowerCase();
      if (!q) return media;
      return media.filter((item) => item.name.toLowerCase().includes(q));
    },
    [media]
  );

  const uploadMedia = useCallback(
    async ({ file, title }) => {
      const ext = file.name.includes(".") ? `.${file.name.split(".").pop()}` : "";
      const baseName = (title || file.name.replace(/\.[^.]+$/, "") || "media")
        .replace(/[^\w.\-]+/g, "_");
      const storagePath = `general/${Date.now()}_${baseName}${ext}`;
      const storageRef = ref(storage, storagePath);
      await uploadBytes(storageRef, file);
      await loadMedia();
      return storageRef.fullPath;
    },
    [loadMedia]
  );

  return { media, loading, error, filterByValue, reload: loadMedia, uploadMedia };
}

export default useMedia;
