import { useEffect, useState } from "react";
import { deleteField, doc, onSnapshot, setDoc } from "firebase/firestore";
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
    await setDoc(
      ref,
      {
        ...data,
        updatedAt: new Date().toISOString(),
      },
      { merge: true }
    );
  };

  const clearPreviewResource = async () => {
    const ref = doc(db, COLLECTION, DOC_ID);
    await setDoc(
      ref,
      {
        resource: deleteField(),
        updatedAt: new Date().toISOString(),
      },
      { merge: true }
    );
  };

  return { preview, setPreview, clearPreviewResource };
}

export default usePreview;
