import { collection, getDocs, orderBy, query } from "firebase/firestore";

import db from "../firebase/firebase";
import { buildYouTubeMedia } from "../firebase/useMedia";
import { toSongWritePayload } from "../utils/songSections";
import useDataStore, { byTitle } from "./data";

// One-time pull of everything the console used to keep in Firestore. Runs from
// the first-run screen, so no throwaway script is needed — and because
// documents keep their Firestore ids, every cross-reference already stored in
// a program (songId, themeId) still resolves afterwards.

async function readAll(name, order) {
  const snap = await getDocs(query(collection(db, name), orderBy(order)));
  return snap.docs.map((d) => ({ ...d.data(), id: d.id }));
}

function normalizeProgram(doc) {
  return {
    ...doc,
    // Firestore Timestamps do not survive JSON; store ISO instead.
    ...(doc.date?.toDate
      ? { date: doc.date.toDate().toISOString() }
      : doc.date
        ? { date: new Date(doc.date).toISOString() }
        : {}),
  };
}

export default async function importFromFirebase() {
  const [programs, songs, themes, media] = await Promise.all([
    readAll("programs", "date"),
    readAll("songs", "title"),
    readAll("themes", "title"),
    readAll("media", "name"),
  ]);

  const { data, write } = useDataStore.getState();

  const next = {
    programs: programs.map(normalizeProgram),
    songs: songs
      .map((s) => ({ id: s.id, ...toSongWritePayload(s.title, s.sections || s.body) }))
      .sort(byTitle),
    themes: themes.sort(byTitle),
    media: media
      .filter((m) => m.type === "youtube" && m.youtubeId)
      .map((m) => {
        try {
          return buildYouTubeMedia({ id: m.id, url: m.url, title: m.name || m.title });
        } catch {
          return null; // Unparseable URL — skip rather than fail the import.
        }
      })
      .filter(Boolean),
  };

  // Only ever run against an empty library (the first-run screen is the only
  // caller), so this replaces rather than merges.
  await write({ ...data, ...next });

  return {
    programs: next.programs.length,
    songs: next.songs.length,
    themes: next.themes.length,
  };
}
