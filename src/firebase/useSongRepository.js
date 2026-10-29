import { useCallback, useState } from "react";
import { collection, doc, getDocs, orderBy, query, setDoc } from "firebase/firestore";

import db from "./firebase";
import useDataStore, { byTitle } from "../local/data";
import { toSongWritePayload } from "../utils/songSections";

const COLLECTION_NAME = "songs";

export async function fetchRepositorySongs() {
  const snap = await getDocs(
    query(collection(db, COLLECTION_NAME), orderBy("title"))
  );
  return snap.docs.map((d) => ({ ...d.data(), id: d.id }));
}

/**
 * Imports repository songs into the local library in a single write.
 *
 * Each song keeps its Firestore id as its local id, so program schedule items
 * that reference a songId keep resolving after the migration — and that id is
 * how "already imported" is answered, with no extra field.
 *
 * Existing songs are skipped rather than overwritten, so a local edit is never
 * silently replaced. To take a newer version, delete the local song first.
 */
export async function importRepositorySongs(items) {
  const { data, write } = useDataStore.getState();
  const existing = new Set(data.songs.map((s) => s.id));

  const additions = items
    .filter((item) => !existing.has(item.id))
    .map((item) => ({
      id: item.id,
      ...toSongWritePayload(item.title, item.sections || item.body),
    }));

  if (additions.length === 0) return 0;
  await write({ songs: [...data.songs, ...additions].sort(byTitle) });
  return additions.length;
}

/**
 * Publishes one local song to the shared repository.
 *
 * Keeps the local id as the document id, which makes this the exact inverse of
 * importRepositorySongs — a song survives a round trip without gaining a
 * duplicate, and programs referencing its songId still resolve.
 *
 * One song per call on purpose: unlike importing, this writes to a collection
 * every other church reads, so it stays a deliberate per-song act rather than
 * a bulk push.
 */
export async function uploadSongToRepository(song) {
  const payload = toSongWritePayload(song.title, song.sections);
  await setDoc(doc(db, COLLECTION_NAME, song.id), payload);
  return { id: song.id, ...payload };
}

/**
 * The Firestore songs collection as a shared catalog: browse and import from
 * it, publish local songs into it. getDocs rather than onSnapshot — a catalog
 * you open, browse and close does not need a live subscription.
 */
export default function useSongRepository() {
  const songs = useDataStore((s) => s.data.songs);
  const [remote, setRemote] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      setRemote(await fetchRepositorySongs());
    } catch (err) {
      console.error("Failed to load the song repository", err);
      setError(err);
      setRemote([]);
    } finally {
      setLoading(false);
    }
  }, []);

  const localIds = new Set(songs.map((s) => s.id));
  const remoteIds = new Set(remote.map((s) => s.id));

  // Reflect the new document locally rather than re-fetching the collection:
  // the upload already knows exactly what it wrote.
  const uploadSong = useCallback(async (song) => {
    const published = await uploadSongToRepository(song);
    setRemote((current) =>
      [...current.filter((s) => s.id !== published.id), published].sort(byTitle)
    );
  }, []);

  return {
    songs,
    remote,
    loading,
    error,
    load,
    importSongs: importRepositorySongs,
    uploadSong,
    isImported: (id) => localIds.has(id),
    isPublished: (id) => remoteIds.has(id),
  };
}
