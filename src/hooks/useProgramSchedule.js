import { useEffect, useMemo, useState } from "react";
import dayjs from "dayjs";

import {
  buildScheduleFromLegacy,
  newItemId,
  toLegacyFields,
  formatBibleGroupTitle,
} from "../utils/programSchedule";
import { mediaDisplayTitle } from "../utils/mediaTitle";
import { parseYouTubeStartSeconds } from "../utils/youtube";

export default function useProgramSchedule({
  programId,
  program,
  songs,
  themes,
  updateProgram,
}) {
  const [schedule, setSchedule] = useState([]);
  const [selectedId, setSelectedId] = useState(null);
  const [hydrated, setHydrated] = useState(false);

  useEffect(() => {
    if (!program?.id) return;
    const next = buildScheduleFromLegacy(program, songs, themes);
    setSchedule(next);
    setSelectedId((prev) => {
      const selectable = next.filter((i) => i.type !== "theme");
      if (prev && selectable.some((i) => i.id === prev)) return prev;
      return selectable[0]?.id || null;
    });
    setHydrated(true);
  }, [program, songs, themes]);

  const selectedItem = useMemo(
    () => schedule.find((i) => i.id === selectedId) || null,
    [schedule, selectedId]
  );

  const persistSchedule = async (next) => {
    setSchedule(next);
    const legacy = toLegacyFields(next);
    await updateProgram(programId, {
      schedule: next,
      ...legacy,
      updatedAt: dayjs().toISOString(),
    });
  };

  const addItem = async (itemOrItems) => {
    const items = Array.isArray(itemOrItems) ? itemOrItems : [itemOrItems];
    if (items.length === 0) return;
    const next = [...schedule, ...items];
    setSelectedId(items[items.length - 1].id);
    await persistSchedule(next);
  };

  const removeItem = async (id) => {
    const next = schedule.filter((i) => i.id !== id);
    if (selectedId === id) {
      setSelectedId(next.find((i) => i.type !== "theme")?.id || null);
    }
    await persistSchedule(next);
  };

  const addSong = (songOrSongs) => {
    const list = Array.isArray(songOrSongs) ? songOrSongs : [songOrSongs];
    return addItem(
      list.map((song) => ({
        id: newItemId(),
        type: "song",
        songId: song.id,
        title: song.title,
      }))
    );
  };

  const buildMediaItem = (item) => {
    const title = mediaDisplayTitle(item) || item.name;
    const startSeconds =
      item.type === "youtube"
        ? item.startSeconds > 0
          ? Math.floor(item.startSeconds)
          : parseYouTubeStartSeconds(item.url || "")
        : 0;

    return {
      id: newItemId(),
      type: "media",
      title,
      name: title,
      url: item.url,
      mediaType: item.type,
      ...(item.fullPath ? { storagePath: item.fullPath } : {}),
      ...(item.type === "youtube" && item.youtubeId
        ? {
            youtubeId: item.youtubeId,
            ...(item.thumbnailUrl ? { thumbnailUrl: item.thumbnailUrl } : {}),
            ...(startSeconds > 0 ? { startSeconds } : {}),
          }
        : {}),
    };
  };

  const addMedia = (itemOrItems) => {
    const list = Array.isArray(itemOrItems) ? itemOrItems : [itemOrItems];
    return addItem(list.map(buildMediaItem));
  };

  const addTheme = (theme) => {
    const themeItem = {
      id: newItemId(),
      type: "theme",
      themeId: theme.id,
      title: theme.title,
      backgroundUrl: theme.backgroundUrl,
      themeType: theme.type,
    };
    const withoutTheme = schedule.filter((i) => i.type !== "theme");
    const next = [themeItem, ...withoutTheme];
    setSelectedId((prev) => {
      if (prev && next.some((i) => i.id === prev && i.type !== "theme")) {
        return prev;
      }
      return next.find((i) => i.type !== "theme")?.id || null;
    });
    return persistSchedule(next);
  };

  const addBible = (verseOrVerses) => {
    const verses = Array.isArray(verseOrVerses) ? verseOrVerses : [verseOrVerses];
    if (verses.length === 0) return;

    const sorted = [...verses].sort(
      (a, b) => a.chapter - b.chapter || a.verse - b.verse
    );
    const title = formatBibleGroupTitle(sorted);
    const item = {
      id: newItemId(),
      type: "bible",
      title,
      reference: title,
      version: sorted[0].version,
      book: sorted[0].book,
      verses: sorted.map((v) => ({
        reference: v.reference,
        text: v.text,
        book: v.book,
        chapter: v.chapter,
        verse: v.verse,
        version: v.version,
      })),
    };

    return addItem(item);
  };

  return {
    schedule,
    selectedId,
    selectedItem,
    hydrated,
    setSelectedId,
    removeItem,
    addSong,
    addMedia,
    addTheme,
    addBible,
  };
}
