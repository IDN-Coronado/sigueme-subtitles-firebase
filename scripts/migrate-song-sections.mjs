/**
 * Migration: wrap flat song.body into sections[{ name, lines }].
 *
 * Usage (from project root, with Vite env loaded):
 *   node --env-file=.env scripts/migrate-song-sections.mjs
 *
 * Or with explicit vars:
 *   VITE_API_KEY=... VITE_AUTH_DOMAIN=... VITE_PROJECT_ID=... \
 *   VITE_STORAGE_BUCKET=... VITE_MESSAGING_SENDER_ID=... VITE_APP_ID=... \
 *   node scripts/migrate-song-sections.mjs
 */
import { initializeApp } from "firebase/app";
import {
  getFirestore,
  collection,
  getDocs,
  updateDoc,
  doc,
  deleteField,
} from "firebase/firestore";
import { randomUUID } from "node:crypto";

const DEFAULT_SECTION_NAME = "Letra";

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

function bodyToLines(body) {
  if (Array.isArray(body)) {
    return body.map((l) => String(l).trim()).filter(Boolean);
  }
  if (!body) return [];
  return String(body)
    .split(/\r?\n/)
    .map((l) => l.trim())
    .filter(Boolean);
}

function hasSections(data) {
  return Array.isArray(data?.sections) && data.sections.length > 0;
}

async function main() {
  const snap = await getDocs(collection(db, "songs"));
  let updated = 0;
  let skipped = 0;

  for (const songDoc of snap.docs) {
    const data = songDoc.data();
    if (hasSections(data)) {
      skipped += 1;
      continue;
    }

    const lines = bodyToLines(data.body);
    const sections = [
      {
        id: randomUUID(),
        name: DEFAULT_SECTION_NAME,
        lines,
      },
    ];

    await updateDoc(doc(db, "songs", songDoc.id), {
      sections,
      body: deleteField(),
    });
    updated += 1;
    console.log(`Updated ${songDoc.id} (${lines.length} lines)`);
  }

  console.log(`Done. updated=${updated} skipped=${skipped} total=${snap.size}`);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
