import { useState, useEffect, useCallback } from "react";
import {
  ref,
  listAll,
  getDownloadURL,
  getMetadata,
  uploadBytes,
  deleteObject,
} from "firebase/storage";
import {
  collection,
  query,
  orderBy,
  onSnapshot,
  addDoc,
  doc,
  deleteDoc,
  updateDoc,
  deleteField,
} from "firebase/firestore";

import db from "./firebase";
import storage from "./storage";
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
// PPTX is gated off: dropping it from MEDIA_EXT keeps existing .pptx objects
// in Storage out of the media list entirely, so nothing downstream sees them.
const PDF_EXT = /\.pdf$/i;
const MEDIA_EXT =
  /\.(jpe?g|png|gif|webp|svg|bmp|avif|mp4|webm|mov|m4v|ogv|mp3|wav|m4a|aac|flac|oga|ogg|opus|wma|pdf)$/i;

const YOUTUBE_COLLECTION = "media";

function getMediaType(name) {
  if (PDF_EXT.test(name)) return "pdf";
  if (VIDEO_EXT.test(name)) return "video";
  if (AUDIO_EXT.test(name)) return "audio";
  if (IMAGE_EXT.test(name)) return "image";
  return null;
}

function mergeMediaLists(files, youtubeDocs) {
  const combined = [...files, ...youtubeDocs];
  combined.sort((a, b) =>
    a.name.localeCompare(b.name, undefined, { sensitivity: "base" })
  );
  return combined;
}

function useMedia() {
  const [fileMedia, setFileMedia] = useState([]);
  const [youtubeMedia, setYoutubeMedia] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

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

  useEffect(() => {
    const collectionRef = collection(db, YOUTUBE_COLLECTION);
    const q = query(collectionRef, orderBy("name"));
    const unsubscribe = onSnapshot(
      q,
      (snap) => {
        const items = snap.docs
          .map((docSnap) => {
            const data = docSnap.data() || {};
            if (data.type !== "youtube" || !data.youtubeId) return null;
            const startSeconds =
              Number.isFinite(data.startSeconds) && data.startSeconds > 0
                ? Math.floor(data.startSeconds)
                : parseYouTubeStartSeconds(data.url || "");
            return {
              id: docSnap.id,
              name: data.name || data.title || data.youtubeId,
              url:
                data.url ||
                youtubeWatchUrl(data.youtubeId, startSeconds),
              youtubeId: data.youtubeId,
              thumbnailUrl:
                data.thumbnailUrl || youtubeThumbnailUrl(data.youtubeId),
              type: "youtube",
              source: "youtube",
              ...(startSeconds > 0 ? { startSeconds } : {}),
            };
          })
          .filter(Boolean);
        setYoutubeMedia(items);
      },
      (err) => {
        console.error("Failed to load YouTube media from Firestore", err);
        setYoutubeMedia([]);
      }
    );
    return () => unsubscribe();
  }, []);

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
      const isPdf = PDF_EXT.test(file.name) || PDF_EXT.test(ext);
      await uploadBytes(storageRef, file, {
        ...(isPdf ? { contentType: "application/pdf" } : {}),
        customMetadata: {
          title:
            trimmedTitle ||
            humanizeMediaFileName(file.name) ||
            file.name,
        },
      });
      await loadFileMedia();
      return storageRef.fullPath;
    },
    [loadFileMedia]
  );

  const addYouTubeMedia = useCallback(async ({ url, title }) => {
    const youtubeId = parseYouTubeId(url);
    if (!youtubeId) throw new Error("Invalid YouTube URL");

    const startSeconds = parseYouTubeStartSeconds(url);
    const name =
      (title || "").trim() || `YouTube ${youtubeId}`;
    const payload = {
      type: "youtube",
      name,
      title: name,
      youtubeId,
      url: youtubeWatchUrl(youtubeId, startSeconds),
      thumbnailUrl: youtubeThumbnailUrl(youtubeId),
      createdAt: new Date().toISOString(),
      ...(startSeconds > 0 ? { startSeconds } : {}),
    };
    const docRef = await addDoc(collection(db, YOUTUBE_COLLECTION), payload);
    return docRef.id;
  }, []);

  const updateYouTubeMedia = useCallback(async ({ id, url, title }) => {
    if (!id) throw new Error("Missing YouTube media id");
    const youtubeId = parseYouTubeId(url);
    if (!youtubeId) throw new Error("Invalid YouTube URL");

    const startSeconds = parseYouTubeStartSeconds(url);
    const name = (title || "").trim() || `YouTube ${youtubeId}`;
    await updateDoc(doc(db, YOUTUBE_COLLECTION, id), {
      type: "youtube",
      name,
      title: name,
      youtubeId,
      url: youtubeWatchUrl(youtubeId, startSeconds),
      thumbnailUrl: youtubeThumbnailUrl(youtubeId),
      updatedAt: new Date().toISOString(),
      startSeconds: startSeconds > 0 ? startSeconds : deleteField(),
    });
    return id;
  }, []);

  const removeMedia = useCallback(
    async (item) => {
      if (item?.type === "youtube" || item?.source === "youtube") {
        const id = item.id;
        if (!id) throw new Error("Missing YouTube media id");
        await deleteDoc(doc(db, YOUTUBE_COLLECTION, id));
        return;
      }

      const path = item?.fullPath || item?.id;
      if (!path) throw new Error("Missing media path");
      await deleteObject(ref(storage, path));
      await evictCachedMedia(item?.url);
      await loadFileMedia();
    },
    [loadFileMedia]
  );

  return {
    media,
    loading,
    error,
    filterByValue,
    reload: loadFileMedia,
    uploadMedia,
    addYouTubeMedia,
    updateYouTubeMedia,
    removeMedia,
  };
}

export default useMedia;
