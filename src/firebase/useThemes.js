import { useRef, useEffect, useState, useCallback } from "react";
import { ref, deleteObject, uploadBytes, getDownloadURL } from "firebase/storage";
import { collection, query, orderBy, onSnapshot, addDoc, doc, deleteDoc } from "firebase/firestore";

import db from "./firebase";
import storage from "../firebase/storage";

const COLLECTION_NAME = 'themes';

function useThemes () {
  const allThemes = useRef([]);
  const [themes, setThemes] = useState([]);

  const getThemeById = useCallback(id =>
    themes.find(t => t.id === id) || {}, [themes]);

  const addTheme = async ({ title, storagePath, file }) => {
    const storageRef = ref(storage, storagePath);
    await uploadBytes(storageRef, file);
    const url = await getDownloadURL(storageRef);
    // Determine asset type
    const assetType = file.type.startsWith("image/") ? "image" : file.type.startsWith("video/") ? "video" : "";
    const theme = {
      title: title.trim(),
      backgroundUrl: url,
      storagePath: storageRef.fullPath, // Save storage path for deletion
      type: assetType,
    }
    return await addDoc(collection(db, COLLECTION_NAME), theme);
  };

  const removeTheme = async (theme) => {
    // Remove file from storage if storagePath exists
    if (theme.storagePath) {
      await deleteObject(ref(storage, theme.storagePath));
    }
    const themeRef = doc(db, COLLECTION_NAME, theme.id);
    await deleteDoc(themeRef);
  };

  useEffect(() => {
    const collectionRef = collection(db, COLLECTION_NAME);
    const q = query(collectionRef, orderBy("title"));

    const unsubscribe = onSnapshot(q, querySnapshot => {
      const dbThemes = querySnapshot.docs.map(doc => ({ ...doc.data(), id: doc.id }))
      allThemes.current = dbThemes;
      setThemes(allThemes.current);
    });
    return () => unsubscribe();
  }, []);

  return {
    themes,
    getThemeById,
    addTheme,
    removeTheme,
  };
}

export default useThemes;
