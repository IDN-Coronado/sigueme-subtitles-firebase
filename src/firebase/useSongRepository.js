import { useCallback, useState } from "react";
import { collection, getDocs, orderBy, query } from "firebase/firestore";

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
 * The Firestore songs collection as a shared read-only catalog. getDocs rather
 * than onSnapshot: a catalog you open, browse and close does not need a live
 * subscription.
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

  return {
    remote,
    loading,
    error,
    load,
    importSongs: importRepositorySongs,
    isImported: (id) => localIds.has(id),
  };
}
