import { MONO } from "./constants";

function LyricsConsole({ item, songs }) {
  if (!item) {
    return (
      <div className="h-full min-h-0 flex items-center justify-center text-[#6b7280] text-sm">
        Selecciona un elemento del schedule
      </div>
    );
  }

  if (item.type === "song") {
    const song = songs.find((s) => s.id === item.songId);
    const lines = Array.isArray(song?.body)
      ? song.body.filter((l) => String(l).trim())
      : song?.body
        ? [song.body]
        : [];
    const activeLine = lines[0] || "Sin letra disponible";
    const rest = lines.slice(1, 4);

    return (
      <div className="h-full min-h-0 flex flex-col bg-[#0b0f10] rounded-lg border border-[rgba(69,70,77,0.25)] p-4 overflow-auto">
        <p className="text-[#7bd0ff] text-xs tracking-[0.08em] mb-4" style={MONO}>
          LYRICS
        </p>
        <div className="flex-1 flex flex-col justify-center gap-3">
          {rest.slice(0, 2).map((line, i) => (
            <p key={i} className="text-[#c6c6cd]/60 text-lg text-center leading-7">
              {line}
            </p>
          ))}
          <div className="bg-[rgba(29,32,34,0.8)] border border-[rgba(123,208,255,0.25)] border-l-4 border-l-[#7bd0ff] rounded-sm px-4 py-3">
            <p className="text-[#7bd0ff] text-xl text-center font-medium leading-8">
              {activeLine}
            </p>
          </div>
        </div>
      </div>
    );
  }

  if (item.type === "bible") {
    return (
      <div className="h-full min-h-0 flex flex-col bg-[#0b0f10] rounded-lg border border-[rgba(69,70,77,0.25)] p-4 overflow-auto">
        <p className="text-[#7bd0ff] text-xs tracking-[0.08em] mb-4" style={MONO}>
          {item.reference}
        </p>
        <div className="flex-1 flex items-center justify-center">
          <p className="text-[#e0e3e5] text-xl text-center leading-8 px-2">
            {item.text}
          </p>
        </div>
      </div>
    );
  }

  if (item.type === "media") {
    return (
      <div className="h-full min-h-0 bg-[#0b0f10] rounded-lg border border-[rgba(69,70,77,0.25)] overflow-hidden flex items-center justify-center">
        {item.mediaType === "video" ? (
          <video
            src={item.url}
            className="w-full h-full object-contain"
            controls
            playsInline
          />
        ) : item.mediaType === "audio" ? (
          <div className="flex flex-col items-center gap-4 px-6 w-full">
            <span className="text-[#45464d] text-xs tracking-[0.1em]" style={MONO}>
              AUDIO
            </span>
            <audio src={item.url} controls className="w-full max-w-sm" />
          </div>
        ) : (
          <img
            src={item.url}
            alt={item.title}
            className="w-full h-full object-contain"
          />
        )}
      </div>
    );
  }

  if (item.type === "theme") {
    return (
      <div className="h-full min-h-0 bg-[#0b0f10] rounded-lg border border-[rgba(69,70,77,0.25)] overflow-hidden">
        {item.backgroundUrl ? (
          item.themeType === "video" ? (
            <video
              src={item.backgroundUrl}
              className="w-full h-full object-cover"
              autoPlay
              muted
              loop
              playsInline
            />
          ) : (
            <img
              src={item.backgroundUrl}
              alt={item.title}
              className="w-full h-full object-cover"
            />
          )
        ) : (
          <div className="h-full flex items-center justify-center text-[#6b7280]">
            Sin vista previa
          </div>
        )}
      </div>
    );
  }

  return null;
}

export default LyricsConsole;
