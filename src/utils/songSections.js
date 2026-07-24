import { t } from "../i18n";

export const DEFAULT_SECTION_NAME = "Letra";

export function newSectionId() {
  if (typeof crypto !== "undefined" && typeof crypto.randomUUID === "function") {
    return crypto.randomUUID();
  }
  return `sec-${Date.now()}-${Math.random().toString(36).slice(2, 9)}`;
}

export function bodyToLines(body) {
  if (Array.isArray(body)) {
    return body.map((l) => String(l).trim()).filter(Boolean);
  }
  if (!body) return [];
  return String(body)
    .split(/\r?\n/)
    .map((l) => l.trim())
    .filter(Boolean);
}

export function createSection(name, lines = []) {
  const trimmedName = String(name || "").trim();
  return {
    id: newSectionId(),
    name: trimmedName || t("song.defaultSection"),
    lines: bodyToLines(lines),
  };
}

export function normalizeSong(song) {
  if (!song) {
    return { title: "", sections: [createSection()] };
  }

  const title = song.title || "";

  if (Array.isArray(song.sections) && song.sections.length > 0) {
    return {
      title,
      sections: song.sections.map((section) => ({
        id: section?.id || newSectionId(),
        name:
          String(section?.name || "").trim() || t("song.defaultSection"),
        lines: bodyToLines(section?.lines),
      })),
    };
  }

  return {
    title,
    sections: [createSection(undefined, bodyToLines(song.body))],
  };
}

export function flattenSongLines(song) {
  return normalizeSong(song).sections.flatMap((section) => section.lines);
}

export function toSongWritePayload(title, sections) {
  const normalized = normalizeSong({ title, sections });
  return {
    title: String(title || "").trim(),
    sections: normalized.sections.map((section) => ({
      id: section.id,
      name: section.name,
      lines: section.lines,
    })),
  };
}
