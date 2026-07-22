import { MONO } from "./constants";
import { getBibleVerses } from "../../utils/programSchedule";

function lineList(song) {
  if (!song) return [];
  if (Array.isArray(song.body)) {
    return song.body.filter((l) => String(l).trim());
  }
  if (song.body) return [song.body];
  return [];
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
        Selecciona un elemento del schedule
      </div>
    );
  }

  if (item.type === "song") {
    const song = songs.find((s) => s.id === item.songId);
    const lines = lineList(song);

    if (lines.length === 0) {
      return (
        <div className="h-full flex items-center justify-center text-[#6b7280] text-sm">
          Sin letra disponible
        </div>
      );
    }

    return (
      <div className="h-full min-h-0 flex flex-col gap-1 overflow-auto">
        <p
          className="text-[#7bd0ff] text-[10px] tracking-[0.1em] uppercase shrink-0 px-1 mb-1"
          style={MONO}
        >
          {item.title || song?.title || "Canción"}
        </p>
        {lines.map((line, index) => {
          const active = isActiveResource(
            preview,
            "song",
            (s) => s?.songId === item.songId && s?.lineIndex === index
          );
          return (
            <button
              key={`${item.songId}-${index}`}
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
  }

  if (item.type === "bible") {
    const verses = getBibleVerses(item);

    if (verses.length === 0) {
      return (
        <div className="h-full flex items-center justify-center text-[#6b7280] text-sm">
          Sin versículos
        </div>
      );
    }

    return (
      <div className="h-full min-h-0 flex flex-col gap-1 overflow-auto">
        <p
          className="text-[#7bd0ff] text-[10px] tracking-[0.1em] uppercase shrink-0 px-1 mb-1"
          style={MONO}
        >
          {item.title || item.reference || "Biblia"}
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
            AUDIO · {item.title}
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
