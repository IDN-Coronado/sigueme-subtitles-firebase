import { ref, listAll, getDownloadURL } from "firebase/storage";
import { collection, getDocs, orderBy, query } from "firebase/firestore";

import db from "../firebase/firebase";
import storage from "../firebase/storage";
import useDataStore, { byTitle } from "./data";
import { mediaUrl } from "./mediaPath";

// One-time pull of the Storage bucket into the local media folder. This is the
// last code in the app that touches Firebase Storage; storage.rules and
// storage.cors.json exist only to let it run. Once every machine has migrated,
// this file and both configs can go.
//
// Safe to re-run: files already present are skipped, so an interrupted import
// resumes where it stopped.

async function fetchThemes() {
  const snap = await getDocs(query(collection(db, "themes"), orderBy("title")));
  return snap.docs.map((d) => ({ ...d.data(), id: d.id }));
}

async function listFolder(folder) {
  const result = await listAll(ref(storage, folder));
  return Promise.all(
    result.items.map(async (item) => ({
      storagePath: item.fullPath,
      url: await getDownloadURL(item),
    }))
  );
}

async function download(target) {
  const response = await fetch(target.url);
  if (!response.ok) {
    throw new Error(`${response.status} ${response.statusText}`);
  }
  const bytes = await response.arrayBuffer();
  await window.desktop.media.save(target.storagePath, bytes);
}

/**
 * @param onProgress called with { done, total, storagePath }
 * @returns { copied, skipped, failed: [{ storagePath, error }] }
 */
export default async function importMediaFromStorage(onProgress) {
  // Theme records come across with the files. The backgrounds copied out of
  // themes/ are inert on their own — nothing points at them until the theme
  // that owns the storagePath exists locally. Fetched before the downloads so
  // a permission error fails in a second rather than after 400 MB.
  const remoteThemes = await fetchThemes();

  const folders = await Promise.all([listFolder("general"), listFolder("themes")]);
  const targets = folders.flat();

  let done = 0;
  let copied = 0;
  let skipped = 0;
  const failed = [];

  for (const target of targets) {
    try {
      if (await window.desktop.media.exists(target.storagePath)) {
        skipped += 1;
      } else {
        await download(target);
        copied += 1;
      }
    } catch (err) {
      console.error("Failed to copy", target.storagePath, err);
      failed.push({ storagePath: target.storagePath, error: String(err.message || err) });
    }
    done += 1;
    onProgress?.({ done, total: targets.length, storagePath: target.storagePath });
  }

  const { data, write } = useDataStore.getState();

  // Records written before this step hold an absolute Storage download URL.
  // Rewriting them is cleanup, not correctness: readers derive from
  // storagePath and ignore the stored url (src/local/mediaPath.js), so assets
  // resolve locally whether or not this ever runs. This just stops stale
  // Firebase URLs sitting in the file confusing whoever reads it next.
  // Merged by id, not replaced: a theme already on this machine keeps its local
  // edits, same rule as the song repository import. Ids are the Firestore ones,
  // so a program's themeId still resolves after the copy.
  const local = data.themes || [];
  const known = new Set(local.map((theme) => theme.id));
  const merged = [
    ...local,
    ...remoteThemes.filter((theme) => !known.has(theme.id)),
  ].sort(byTitle);

  const themes = merged.map((theme) =>
    theme.storagePath
      ? { ...theme, backgroundUrl: mediaUrl(theme.storagePath) }
      : theme
  );

  const themeById = new Map(themes.map((theme) => [theme.id, theme]));

  const relinkItem = (item) => {
    if (item?.storagePath) {
      return { ...item, url: mediaUrl(item.storagePath) };
    }
    // Theme schedule items carry backgroundUrl but no storagePath, so the
    // local path has to come from the theme they point at.
    if (item?.type === "theme" && item.themeId) {
      const theme = themeById.get(item.themeId);
      if (theme?.storagePath) {
        return { ...item, backgroundUrl: mediaUrl(theme.storagePath) };
      }
    }
    return item;
  };

  const programs = (data.programs || []).map((program) => ({
    ...program,
    ...(program.mainLogo?.storagePath
      ? {
          mainLogo: {
            ...program.mainLogo,
            url: mediaUrl(program.mainLogo.storagePath),
          },
        }
      : {}),
    ...(Array.isArray(program.schedule)
      ? { schedule: program.schedule.map(relinkItem) }
      : {}),
    ...(Array.isArray(program.slides)
      ? { slides: program.slides.map(relinkItem) }
      : {}),
  }));

  await write({ themes, programs, mediaImported: true });

  return { copied, skipped, failed };
}
