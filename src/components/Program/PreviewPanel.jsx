import { t } from "../../i18n";
import { MONO } from "./constants";
import { getBibleVerses } from "../../utils/programSchedule";
import { normalizeSong } from "../../utils/songSections";

/** Subtle dark-UI header pairs: tinted bg + readable text. */
const SECTION_HEADER_COLORS = [
  { bg: "rgba(123, 208, 255, 0.18)", text: "#9fdfff" },
  { bg: "rgba(167, 139, 250, 0.2)", text: "#c4b5fd" },
  { bg: "rgba(52, 211, 153, 0.18)", text: "#6ee7b7" },
  { bg: "rgba(251, 191, 36, 0.18)", text: "#fcd34d" },
  { bg: "rgba(251, 113, 133, 0.18)", text: "#fda4af" },
  { bg: "rgba(96, 165, 250, 0.18)", text: "#93c5fd" },
  { bg: "rgba(45, 212, 191, 0.18)", text: "#5eead4" },
  { bg: "rgba(251, 146, 60, 0.18)", text: "#fdba74" },
];

function sectionHeaderColor(sectionId, index) {
  const key = String(sectionId || index);
  let hash = 0;
  for (let i = 0; i < key.length; i += 1) {
    hash = (hash * 31 + key.charCodeAt(i)) >>> 0;
  }
  return SECTION_HEADER_COLORS[(hash + index) % SECTION_HEADER_COLORS.length];
}

function isActiveResource(preview, type, matcher) {
  const resource = preview?.resource;
  if (!resource || resource.type !== type) return false;
  return matcher(resource[type]);
}

function PreviewPanel({ item, songs, preview, onSelect }) {
  if (!item) {
    return (
      <div className="h-full min-h-0 flex items-center justify-center text-[#6b7280] text-sm px-2 text-center">
        {t("preview.selectItem")}
      </div>
    );
  }

  if (item.type === "song") {
    const song = songs.find((s) => s.id === item.songId);
    const { sections } = normalizeSong(song);
    const hasLines = sections.some((section) => section.lines.length > 0);

    if (!hasLines) {
      return (
        <div className="h-full flex items-center justify-center text-[#6b7280] text-sm">
          {t("preview.noLyrics")}
        </div>
      );
    }

    let nextLineIndex = 0;
    const sectionBlocks = sections.map((section) => {
      const lines = section.lines.map((line) => {
        const index = nextLineIndex;
        nextLineIndex += 1;
        return { line, index };
      });
      return { ...section, indexedLines: lines };
    });

    return (
      <div className="h-full min-h-0 flex flex-col gap-1 overflow-auto">
        <p
          className="text-[#7bd0ff] text-[10px] tracking-[0.1em] uppercase shrink-0 px-1 mb-1"
          style={MONO}
        >
          {item.title || song?.title || t("types.song")}
        </p>
        {sectionBlocks.map((section, sectionIndex) => {
          const headerColor = sectionHeaderColor(section.id, sectionIndex);
          return (
          <div key={section.id} className="flex flex-col gap-1">
            <p
              className="text-[10px] tracking-[0.08em] uppercase shrink-0 px-2.5 py-1.5 mt-1 first:mt-0 rounded-sm"
              style={{
                ...MONO,
                backgroundColor: headerColor.bg,
                color: headerColor.text,
              }}
            >
              {section.name}
            </p>
            {section.indexedLines.map(({ line, index }) => {
              const active = isActiveResource(
                preview,
                "song",
                (s) => s?.songId === item.songId && s?.lineIndex === index
              );
              return (
                <button
                  key={`${item.songId}-${section.id}-${index}`}
                  type="button"
                  onClick={() =>
                    onSelect({
                      type: "song",
                      song: {
                        songId: item.songId,
                        title: item.title || song?.title,
                        line,
                        lineIndex: index,
                      },
                    })
                  }
                  className={`w-full text-left rounded-sm px-3 py-2.5 text-sm transition-colors ${
                    active
                      ? "bg-[rgba(123,208,255,0.12)] border border-[rgba(123,208,255,0.4)] text-[#7bd0ff]"
                      : "border border-transparent text-[#e0e3e5] hover:bg-[rgba(123,208,255,0.08)]"
                  }`}
                >
                  {line}
                </button>
              );
            })}
          </div>
          );
        })}
      </div>
    );
  }

  if (item.type === "bible") {
    const verses = getBibleVerses(item);

    if (verses.length === 0) {
      return (
        <div className="h-full flex items-center justify-center text-[#6b7280] text-sm">
          {t("preview.noVerses")}
        </div>
      );
    }

    return (
      <div className="h-full min-h-0 flex flex-col gap-1 overflow-auto">
        <p
          className="text-[#7bd0ff] text-[10px] tracking-[0.1em] uppercase shrink-0 px-1 mb-1"
          style={MONO}
        >
          {item.title || item.reference || t("types.bible")}
          {item.version ? ` · ${item.version}` : ""}
        </p>
        {verses.map((v, index) => {
          const active = isActiveResource(
            preview,
            "bible",
            (b) =>
              b?.reference === v.reference &&
              b?.text === v.text &&
              b?.verse === v.verse
          );
          return (
            <button
              key={`${v.reference}-${v.verse}-${index}`}
              type="button"
              onClick={() =>
                onSelect({
                  type: "bible",
                  bible: {
                    reference: v.reference,
                    text: v.text,
                    book: v.book,
                    chapter: v.chapter,
                    verse: v.verse,
                    version: v.version || item.version,
                  },
                })
              }
              className={`w-full text-left rounded-sm px-3 py-2.5 transition-colors ${
                active
                  ? "bg-[rgba(123,208,255,0.12)] border border-[rgba(123,208,255,0.4)]"
                  : "border border-transparent hover:bg-[rgba(123,208,255,0.08)]"
              }`}
            >
              <span
                className={`text-[10px] tracking-[0.05em] block mb-1 ${
                  active ? "text-[#7bd0ff]" : "text-[#7bd0ff]/80"
                }`}
                style={MONO}
              >
                {v.reference}
              </span>
              <p
                className={`text-sm leading-6 ${
                  active ? "text-[#7bd0ff]" : "text-[#e0e3e5]"
                }`}
              >
                {v.text}
              </p>
            </button>
          );
        })}
      </div>
    );
  }

  if (item.type === "media") {
    const active = isActiveResource(
      preview,
      "media",
      (m) => m?.url === item.url && m?.mediaType === item.mediaType
    );

    return (
      <button
        type="button"
        onClick={() =>
          onSelect({
            type: "media",
            media: {
              title: item.title,
              name: item.name || item.title,
              url: item.url,
              storagePath: item.storagePath,
              mediaType: item.mediaType,
            },
          })
        }
        className={`w-full h-full min-h-0 rounded-lg border overflow-hidden transition-colors flex items-center justify-center bg-[#0b0f10] ${
          active
            ? "border-[rgba(123,208,255,0.45)]"
            : "border-[rgba(69,70,77,0.3)] hover:border-[rgba(123,208,255,0.3)]"
        }`}
      >
        {item.mediaType === "video" ? (
          <video
            src={item.url}
            className="w-full h-full object-contain pointer-events-none"
            muted
            playsInline
            preload="metadata"
          />
        ) : item.mediaType === "audio" ? (
          <span className="text-[#45464d] text-xs tracking-[0.1em]" style={MONO}>
            {t("media.audioBadge")} · {item.title}
          </span>
        ) : (
          <img
            src={item.url}
            alt={item.title}
            className="w-full h-full object-contain pointer-events-none"
          />
        )}
      </button>
    );
  }

  return null;
}

export default PreviewPanel;
