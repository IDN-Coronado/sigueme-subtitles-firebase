import { useEffect, useState } from "react";
import { doc, getDoc, onSnapshot, setDoc } from "firebase/firestore";

import db from "../firebase/firebase";

const COLLECTION = "operators";

/**
 * Registers the signed-in user as a pending operator (once) and tracks
 * whether an admin has approved them. undefined = resolving.
 */
export default function useOperatorStatus(user) {
  const [approved, setApproved] = useState(undefined);

  useEffect(() => {
    if (!user) {
      setApproved(undefined);
      return;
    }

    const ref = doc(db, COLLECTION, user.uid);

    getDoc(ref)
      .then((snap) => {
        if (snap.exists()) return;
        return setDoc(ref, {
          email: user.email,
          name: user.displayName || "",
          requestedAt: new Date().toISOString(),
        });
      })
      .catch(() => {});

    return onSnapshot(ref, (snap) => setApproved(snap.data()?.approved === true));
  }, [user]);

  return approved;
}
