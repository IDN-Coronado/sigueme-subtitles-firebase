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
  initialized: false,
  setInitialized: (val) => set({ initialized: val }),
}));

function useSongs() {
  const { songs, setSongs, initialized, setInitialized } = useSongsStore();

  // Only fetch once
  useEffect(() => {
    if (initialized) return;
    const collectionRef = collection(db, COLLECTION_NAME);
    const q = query(collectionRef, orderBy("title"));
    const unsubscribe = onSnapshot(q, (querySnapshot) => {
      const dbSongs = querySnapshot.docs.map((docSnap) => ({
        ...docSnap.data(),
        id: docSnap.id,
      }));
      setSongs(dbSongs);
      setInitialized(true);
    });
    return () => unsubscribe();
    // eslint-disable-next-line
  }, [initialized, setSongs, setInitialized]);

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
