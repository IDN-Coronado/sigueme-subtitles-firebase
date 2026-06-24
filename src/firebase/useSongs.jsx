import { useEffect, useCallback } from "react";
import { collection, query, orderBy, onSnapshot, addDoc } from "firebase/firestore";
import db from "./firebase";
import { create } from "zustand";

const COLLECTION_NAME = 'songs';

// Zustand store for songs
const useSongsStore = create(set => ({
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
    const unsubscribe = onSnapshot(q, querySnapshot => {
      const dbSongs = querySnapshot.docs.map(doc => ({ ...doc.data(), id: doc.id }));
      setSongs(dbSongs);
      setInitialized(true);
    });
    return () => unsubscribe();
    // eslint-disable-next-line
  }, [initialized, setSongs, setInitialized]);

  const getById = useCallback(id =>
    songs.filter(s => s.id === id).shift() || {}, [songs]);

  const filterByValue = useCallback((value) => {
    return songs.filter(song =>
      song.title
        .normalize('NFD')
        .replace(/[\u0300-\u036f]/g, '')
        .toLowerCase()
        .includes(value.toLowerCase())
    );
  }, [songs]);

  const addSong = async (title, body) => {
    const docRef = await addDoc(collection(db, COLLECTION_NAME), {
      title,
      body
    });
    // Update zustand store immediately with the new song
    setSongs([
      ...songs,
      { id: docRef.id, title, body }
    ]);
    return docRef;
  };

  // Optionally, you can expose a clearFilter or similar if needed

  return {
    songs,
    getById,
    filterByValue,
    addSong,
  };
}

export default useSongs;