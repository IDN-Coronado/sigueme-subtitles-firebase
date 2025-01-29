import React, { useContext, createContext, useRef, useEffect, useState } from "react";
import { collection, query, orderBy, onSnapshot, addDoc } from "firebase/firestore";

import db from "./firebase";

const COLLECTION_NAME = 'songs';

const songsContext = createContext();

const removeAccents = (strWithAccents) => {
  return strWithAccents.normalize('NFD').replace(/[\u0300-\u036f]/g, '');
}

export function ProvideSongs({ children }) {
  const songsHook = useProvideSongs();
  return <songsContext.Provider value={songsHook}>{children}</songsContext.Provider>;
}

// Hook for child components to get the auth object ...
// ... and re-render when it changes.
export const useSongs = () => {
  return useContext(songsContext);
};

// Provider hook that creates auth object and handles state
function useProvideSongs() {
  const allSongs = useRef([]);
  const [songs, setSongs] = useState([]);

  const getById = id =>
    songs.filter(s => s.id === id).shift() || {};

  const filterByValue = (value) => {
    setSongs(allSongs.current.filter(song =>
      removeAccents(song.title).toLowerCase().includes(value.toLowerCase())
    ));
  };

  const clearFilter = () => {
    setSongs(allSongs.current);
  };

  const addSong = async (title, body) => {
    return await addDoc(collection(db, COLLECTION_NAME), {
      title,
      body
    });
  };

  useEffect(() => {
    const collectionRef = collection(db, COLLECTION_NAME);
    const q = query(collectionRef, orderBy("title"));

    const unsubscribe = onSnapshot(q, querySnapshot => {
      const dbSongs = querySnapshot.docs.map(doc => ({ ...doc.data(), id: doc.id }))
      allSongs.current = dbSongs;
      setSongs(allSongs.current);
    });
    return () => unsubscribe();
  }, [ ]);

  // Return the user object and auth methods
  return {
    songs,
    getById,
    filterByValue,
    clearFilter,
    addSong,
  };
}
