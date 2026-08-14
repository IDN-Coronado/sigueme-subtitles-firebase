import useDataStore, { newId, byTitle } from "../local/data";
import { toSongWritePayload } from "../utils/songSections";

function useSongs() {
  const songs = useDataStore((s) => s.data.songs);
  const write = useDataStore((s) => s.write);

  // Songs imported from the shared repository keep their Firestore id (see
  // useSongRepository), so program schedule items referencing a songId keep
  // resolving after the migration. Locally created songs get a UUID, which
  // cannot collide with Firestore's 20-character ids.
  const addSong = async (title, sections, id = newId()) => {
    const song = { id, ...toSongWritePayload(title, sections) };
    await write({ songs: [...songs, song].sort(byTitle) });
    return song;
  };

  const updateSong = async (id, title, sections) => {
    const payload = toSongWritePayload(title, sections);
    // Replacing rather than merging drops the legacy `body` field without
    // needing Firestore's deleteField().
    await write({
      songs: songs
        .map((s) => (s.id === id ? { id, ...payload } : s))
        .sort(byTitle),
    });
  };

  const removeSong = async (id) => {
    await write({ songs: songs.filter((s) => s.id !== id) });
  };

  return {
    songs,
    addSong,
    updateSong,
    removeSong,
  };
}

export default useSongs;
