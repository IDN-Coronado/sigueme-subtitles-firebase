import { initializeApp } from 'firebase/app'
import { getAuth } from "firebase/auth"
import {
  initializeFirestore,
  persistentLocalCache,
  persistentMultipleTabManager,
} from "firebase/firestore"

const firebaseConfig = {
  apiKey: import.meta.env.VITE_API_KEY,
  authDomain: import.meta.env.VITE_AUTH_DOMAIN,
  projectId: import.meta.env.VITE_PROJECT_ID,
  storageBucket: import.meta.env.VITE_STORAGE_BUCKET,
  messagingSenderId: import.meta.env.VITE_MESSAGING_SENDER_ID,
  appId: import.meta.env.VITE_APP_ID,
  measurementId: import.meta.env.VITE_MEASUREMENT_ID,
};

export const app = initializeApp(firebaseConfig);
export const auth = getAuth(app);

// IndexedDB-backed local cache so already-fetched program/song/theme data
// is still readable (and offline-editable, syncing once reconnected) after
// a reload without connectivity — the app shell alone can't show anything
// useful without this. persistentMultipleTabManager is required, not the
// default single-tab manager: this app runs the console and Live view in
// two separate tabs/windows at the same time by design, and single-tab
// persistence would make the second tab fail to open a persistent
// connection at all.
const db = initializeFirestore(app, {
  localCache: persistentLocalCache({
    tabManager: persistentMultipleTabManager(),
  }),
});

export default db;