/**
 * Migration: set default mainLogo on programs missing it.
 *
 * Usage (from project root, with Vite env loaded):
 *   node --env-file=.env scripts/migrate-main-logo.mjs
 *
 * Or with explicit vars:
 *   VITE_API_KEY=... VITE_AUTH_DOMAIN=... VITE_PROJECT_ID=... \
 *   VITE_STORAGE_BUCKET=... VITE_MESSAGING_SENDER_ID=... VITE_APP_ID=... \
 *   node scripts/migrate-main-logo.mjs
 */
import { initializeApp } from "firebase/app";
import {
  getFirestore,
  collection,
  getDocs,
  updateDoc,
  doc,
} from "firebase/firestore";
import { getStorage, ref, getDownloadURL } from "firebase/storage";

const FILENAME = "1786859135635_Logo.mp4";
const STORAGE_PATH = `general/${FILENAME}`;
const STALE_DEFAULTS = new Set(["general/1784771762871_Logo_Principal.mp4"]);

const firebaseConfig = {
  apiKey: process.env.VITE_API_KEY,
  authDomain: process.env.VITE_AUTH_DOMAIN,
  projectId: process.env.VITE_PROJECT_ID,
  storageBucket: process.env.VITE_STORAGE_BUCKET,
  messagingSenderId: process.env.VITE_MESSAGING_SENDER_ID,
  appId: process.env.VITE_APP_ID,
};

if (!firebaseConfig.projectId || !firebaseConfig.apiKey) {
  console.error("Missing Firebase env (VITE_PROJECT_ID / VITE_API_KEY).");
  process.exit(1);
}

const app = initializeApp(firebaseConfig);
const db = getFirestore(app);
const storage = getStorage(app);

async function buildDefaultMainLogo() {
  const url = await getDownloadURL(ref(storage, STORAGE_PATH));
  return {
    title: FILENAME,
    name: FILENAME,
    url,
    storagePath: STORAGE_PATH,
    mediaType: "video",
  };
}

async function main() {
  const mainLogo = await buildDefaultMainLogo();
  const snap = await getDocs(collection(db, "programs"));
  let updated = 0;
  let skipped = 0;

  for (const programDoc of snap.docs) {
    const data = programDoc.data();
    // Repoint programs still on a superseded default logo, but never
    // clobber a custom logo an operator picked via the Logo button.
    const current = data.mainLogo?.storagePath;
    if (current && !STALE_DEFAULTS.has(current)) {
      skipped += 1;
      continue;
    }
    await updateDoc(doc(db, "programs", programDoc.id), { mainLogo });
    updated += 1;
    console.log(`Updated ${programDoc.id}`);
  }

  console.log(`Done. updated=${updated} skipped=${skipped} total=${snap.size}`);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
