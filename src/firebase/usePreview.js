import { useEffect, useState } from "react";
import {
  deleteField,
  doc,
  onSnapshot,
  setDoc,
  updateDoc,
} from "firebase/firestore";
import db from "./firebase";

const COLLECTION = "preview";
const DOC_ID = "preview";

function usePreview() {
  const [preview, setPreviewState] = useState(null);

  useEffect(() => {
    const ref = doc(db, COLLECTION, DOC_ID);
    return onSnapshot(ref, (snap) => {
      setPreviewState(snap.exists() ? { id: snap.id, ...snap.data() } : null);
    });
  }, []);

  const setPreview = async (data) => {
    const ref = doc(db, COLLECTION, DOC_ID);
    const payload = {
      ...data,
      updatedAt: new Date().toISOString(),
    };

    // setDoc({ merge: true }) deep-merges nested maps, so leftover media
    // fields (e.g. youtubeId after selecting an image) can stick around.
    // updateDoc replaces top-level fields like `resource` wholesale.
    try {
      await updateDoc(ref, payload);
    } catch (err) {
      if (err?.code === "not-found") {
        await setDoc(ref, payload);
        return;
      }
      throw err;
    }
  };

  const clearPreviewResource = async () => {
    const ref = doc(db, COLLECTION, DOC_ID);
    try {
      await updateDoc(ref, {
        resource: deleteField(),
        updatedAt: new Date().toISOString(),
      });
    } catch (err) {
      if (err?.code === "not-found") return;
      throw err;
    }
  };

  return { preview, setPreview, clearPreviewResource };
}

export default usePreview;
