import { useEffect, useCallback } from "react";
import {
  collection,
  query,
  orderBy,
  onSnapshot,
  addDoc,
  doc,
  updateDoc,
  deleteDoc,
  deleteField,
} from "firebase/firestore";
import db from "./firebase";
import { create } from "zustand";
import { toSongWritePayload } from "../utils/songSections";

const COLLECTION_NAME = "songs";

// Zustand store for songs
const useSongsStore = create((set) => ({
  songs: [],
  setSongs: (songs) => set({ songs }),
}));

function useSongs() {
  const { songs, setSongs } = useSongsStore();

  // No "fetch once" guard here, matching useThemes/usePrograms. Firestore is
  // configured with persistentLocalCache (see firebase.js), so the first
  // snapshot is served from IndexedDB and the server's version arrives in a
  // later one — a listener torn down after the first snapshot pins the app to
  // whatever was cached, and song edits made elsewhere never show up.
  // Identical query listeners are collapsed onto one stream by Firestore, so
  // the two useSongs() callers cost nothing extra.
  useEffect(() => {
    const collectionRef = collection(db, COLLECTION_NAME);
    const q = query(collectionRef, orderBy("title"));
    return onSnapshot(q, (querySnapshot) => {
      setSongs(
        querySnapshot.docs.map((docSnap) => ({
          ...docSnap.data(),
          id: docSnap.id,
        }))
      );
    });
  }, [setSongs]);

  const getById = useCallback(
    (id) => songs.filter((s) => s.id === id).shift() || {},
    [songs]
  );

  const filterByValue = useCallback(
    (value) => {
      return songs.filter((song) =>
        song.title
          .normalize("NFD")
          .replace(/[\u0300-\u036f]/g, "")
          .toLowerCase()
          .includes(value.toLowerCase())
      );
    },
    [songs]
  );

  const addSong = async (title, sections) => {
    const payload = toSongWritePayload(title, sections);
    const docRef = await addDoc(collection(db, COLLECTION_NAME), payload);
    setSongs([...songs, { id: docRef.id, ...payload }]);
    return docRef;
  };

  const updateSong = async (id, title, sections) => {
    const payload = toSongWritePayload(title, sections);
    await updateDoc(doc(db, COLLECTION_NAME, id), {
      ...payload,
      body: deleteField(),
    });
    setSongs(songs.map((s) => (s.id === id ? { ...s, ...payload, body: undefined } : s)));
  };

  const removeSong = async (id) => {
    await deleteDoc(doc(db, COLLECTION_NAME, id));
    setSongs(songs.filter((s) => s.id !== id));
  };

  return {
    songs,
    getById,
    filterByValue,
    addSong,
    updateSong,
    removeSong,
  };
}

export default useSongs;
