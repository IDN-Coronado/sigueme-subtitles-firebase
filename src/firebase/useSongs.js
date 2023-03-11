import React, { useContext, createContext, useState, useEffect } from "react";
import { collection, query, orderBy, onSnapshot } from "firebase/firestore";

import db from "./firebase";

const songsContext = createContext();

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
  const [songs, setSongs] = useState([]);

  const get = id =>
    songs.filter(s => s.id === id).shift() || {}

  useEffect(() => {
    const collectionRef = collection(db, 'songs');
    const q = query(collectionRef, orderBy("title"));

    const unsubscribe = onSnapshot(q, querySnapshot => {
      const dbSongs = querySnapshot.docs.map(doc => ({ ...doc.data(), id: doc.id }))
      setSongs(dbSongs)
    });
    return () => unsubscribe();
  }, [ ]);

  // Return the user object and auth methods
  return {
    songs,
    get,
  };
}