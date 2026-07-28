import { t } from "../i18n";
import { parseYouTubeStartSeconds } from "./youtube";

export function newItemId() {
  return `${Date.now()}-${Math.random().toString(36).slice(2, 9)}`;
}

export function guessMediaType(name = "") {
  if (/\.(mp4|webm|mov|m4v|ogv)$/i.test(name)) return "video";
  if (/\.(mp3|wav|m4a|aac|flac|oga|ogg|opus|wma)$/i.test(name)) return "audio";
  return "image";
}

export function buildScheduleFromLegacy(program, songs, themes) {
  if (Array.isArray(program?.schedule) && program.schedule.length > 0) {
    return program.schedule;
  }

  const items = [];
  if (program?.theme?.id) {
    const theme = themes.find((t) => t.id === program.theme.id);
    items.push({
      id: `theme-${program.theme.id}`,
      type: "theme",
      themeId: program.theme.id,
      title: theme?.title || t("types.theme"),
      backgroundUrl: theme?.backgroundUrl,
      themeType: theme?.type,
    });
  }

  for (const ref of program?.songs || []) {
    const song = songs.find((s) => s.id === ref.id);
    items.push({
      id: `song-${ref.id}-${items.length}`,
      type: "song",
      songId: ref.id,
      title: song?.title || t("types.song"),
    });
  }

  for (const slide of program?.slides || []) {
    const mediaType =
      slide.type || guessMediaType(slide.name || slide.title || "");
    const startSeconds =
      slide.startSeconds > 0
        ? Math.floor(slide.startSeconds)
        : mediaType === "youtube"
          ? parseYouTubeStartSeconds(slide.url || "")
          : 0;
    items.push({
      id: `media-${slide.storagePath || slide.url || slide.name || items.length}`,
      type: "media",
      title: slide.title || slide.name || t("types.media"),
      name: slide.name || slide.title,
      url: slide.url,
      mediaType,
      ...(slide.storagePath ? { storagePath: slide.storagePath } : {}),
      ...(slide.youtubeId ? { youtubeId: slide.youtubeId } : {}),
      ...(slide.thumbnailUrl ? { thumbnailUrl: slide.thumbnailUrl } : {}),
      ...(startSeconds > 0 ? { startSeconds } : {}),
    });
  }

  return items;
}

export function toLegacyFields(schedule) {
  const themeItem = [...schedule].reverse().find((i) => i.type === "theme");
  return {
    theme: themeItem ? { id: themeItem.themeId } : {},
    songs: schedule.filter((i) => i.type === "song").map((i) => ({ id: i.songId })),
    slides: schedule
      .filter((i) => i.type === "media")
      .map((i) => ({
        title: i.title,
        name: i.name || i.title,
        ...(i.url ? { url: i.url } : {}),
        ...(i.storagePath ? { storagePath: i.storagePath } : {}),
        ...(i.mediaType ? { type: i.mediaType } : {}),
        ...(i.youtubeId ? { youtubeId: i.youtubeId } : {}),
        ...(i.thumbnailUrl ? { thumbnailUrl: i.thumbnailUrl } : {}),
        ...(i.startSeconds > 0
          ? { startSeconds: Math.floor(i.startSeconds) }
          : {}),
      })),
  };
}

export function typeLabel(item) {
  if (item.type === "media") {
    if (item.mediaType === "youtube") return "YOUTUBE";
    return (item.mediaType || "image").toUpperCase();
  }
  if (item.type === "song") return t("types.song").toUpperCase();
  if (item.type === "theme") return t("types.theme").toUpperCase();
  if (item.type === "bible") return t("types.bible").toUpperCase();
  return item.type.toUpperCase();
}

/** Normalize a bible schedule item to a verses array (supports legacy single-verse items). */
export function getBibleVerses(item) {
  if (!item || item.type !== "bible") return [];
  if (Array.isArray(item.verses) && item.verses.length > 0) return item.verses;
  if (item.reference || item.text) {
    return [
      {
        reference: item.reference,
        text: item.text,
        book: item.book,
        chapter: item.chapter,
        verse: item.verse,
        version: item.version,
      },
    ];
  }
  return [];
}

/** Build a compact reference for one or more verses, e.g. "Juan 3:16-18" or "Juan 3:16; 4:1". */
export function formatBibleGroupTitle(verses) {
  if (!verses?.length) return t("types.bible");
  if (verses.length === 1) return verses[0].reference || t("types.bible");

  const sorted = [...verses].sort(
    (a, b) =>
      String(a.book).localeCompare(String(b.book)) ||
      a.chapter - b.chapter ||
      a.verse - b.verse
  );

  const byBook = new Map();
  for (const v of sorted) {
    const book = v.book || t("types.bible");
    if (!byBook.has(book)) byBook.set(book, new Map());
    const byChapter = byBook.get(book);
    if (!byChapter.has(v.chapter)) byChapter.set(v.chapter, []);
    byChapter.get(v.chapter).push(v.verse);
  }

  const parts = [];
  for (const [book, byChapter] of byBook) {
    const chapterParts = [];
    for (const [chapter, nums] of byChapter) {
      const unique = [...new Set(nums)].sort((a, b) => a - b);
      chapterParts.push(`${chapter}:${formatVerseSpans(unique)}`);
    }
    parts.push(`${book} ${chapterParts.join("; ")}`);
  }
  return parts.join(" · ");
}

function formatVerseSpans(nums) {
  if (nums.length === 0) return "";
  const spans = [];
  let start = nums[0];
  let end = nums[0];
  for (let i = 1; i < nums.length; i++) {
    if (nums[i] === end + 1) {
      end = nums[i];
    } else {
      spans.push(start === end ? `${start}` : `${start}-${end}`);
      start = end = nums[i];
    }
  }
  spans.push(start === end ? `${start}` : `${start}-${end}`);
  return spans.join(",");
}
