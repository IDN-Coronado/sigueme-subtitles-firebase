import { useState } from "react";

import { groupSongsByLetter } from "../../utils/programSchedule";
import { MONO } from "./constants";
import ResourceToolbar from "./ResourceToolbar";
import BibleBrowser from "./BibleBrowser";

function SongsBrowser({ songs, query, onQueryChange, onAdd, onCreate }) {
  const q = query.trim().toLowerCase();
  const list = songs
    .filter((s) => !q || s.title.toLowerCase().includes(q))
    .slice()
    .sort((a, b) =>
      a.title.localeCompare(b.title, undefined, { sensitivity: "base" })
    );
  const groups = groupSongsByLetter(list);

  return (
    <div className="flex flex-col gap-3 h-full min-h-0">
      <ResourceToolbar
        query={query}
        onQueryChange={onQueryChange}
        placeholder="Buscar canciones..."
        createLabel="New song"
        onCreate={onCreate}
      />
      <div className="overflow-auto min-h-0 flex-1">
        {groups.length === 0 && (
          <p className="text-[#6b7280] text-sm px-1">No hay canciones.</p>
        )}
        {groups.map((group) => (
          <div key={group.letter} className="mb-3 last:mb-0">
            <div
              className="sticky top-0 z-[1] px-2 py-1 text-[#7bd0ff] text-xs tracking-[0.1em] bg-[#1d2022]/95 backdrop-blur-sm border-b border-[rgba(69,70,77,0.25)]"
              style={MONO}
            >
              {group.letter}
            </div>
            <ul className="flex flex-col">
              {group.songs.map((song) => (
                <li key={song.id}>
                  <button
                    type="button"
                    onClick={() => onAdd(song)}
                    className="w-full text-left px-3 py-1.5 text-[#e0e3e5] text-sm truncate hover:bg-[rgba(123,208,255,0.08)] border-b border-[rgba(69,70,77,0.15)] last:border-b-0 transition-colors"
                  >
                    {song.title}
                  </button>
                </li>
              ))}
            </ul>
          </div>
        ))}
      </div>
    </div>
  );
}

function MediaBrowser({ media, query, onQueryChange, onAdd, onCreate }) {
  const q = query.trim().toLowerCase();
  const list = media.filter((m) => !q || m.name.toLowerCase().includes(q));

  return (
    <div className="flex flex-col gap-3 h-full min-h-0">
      <ResourceToolbar
        query={query}
        onQueryChange={onQueryChange}
        placeholder="Buscar media..."
        createLabel="Upload file"
        onCreate={onCreate}
      />
      <div className="grid grid-cols-2 sm:grid-cols-3 xl:grid-cols-4 gap-3 overflow-auto min-h-0 flex-1 content-start">
        {list.map((item) => (
          <button
            key={item.id}
            type="button"
            onClick={() => onAdd(item)}
            className="text-left rounded-lg border border-[rgba(69,70,77,0.3)] bg-[rgba(16,20,21,0.5)] overflow-hidden hover:border-[rgba(123,208,255,0.3)] transition-colors"
          >
            <div className="aspect-video bg-[#1d2022]">
              {item.type === "video" ? (
                <video
                  src={item.url}
                  className="w-full h-full object-cover"
                  muted
                />
              ) : item.type === "audio" ? (
                <div
                  className="w-full h-full flex items-center justify-center text-[#45464d] text-xs"
                  style={MONO}
                >
                  AUDIO
                </div>
              ) : (
                <img
                  src={item.url}
                  alt=""
                  className="w-full h-full object-cover"
                />
              )}
            </div>
            <p className="text-[#e0e3e5] text-xs font-semibold p-2 truncate">
              {item.name}
            </p>
          </button>
        ))}
      </div>
    </div>
  );
}

function ThemesBrowser({ themes, query, onQueryChange, onAdd, onCreate }) {
  const q = query.trim().toLowerCase();
  const list = themes.filter((t) => !q || t.title.toLowerCase().includes(q));

  return (
    <div className="flex flex-col gap-3 h-full min-h-0">
      <ResourceToolbar
        query={query}
        onQueryChange={onQueryChange}
        placeholder="Buscar temas..."
        createLabel="New theme"
        onCreate={onCreate}
      />
      <div className="grid grid-cols-2 sm:grid-cols-3 xl:grid-cols-4 gap-3 overflow-auto min-h-0 flex-1 content-start">
        {list.map((theme) => (
          <button
            key={theme.id}
            type="button"
            onClick={() => onAdd(theme)}
            className="text-left rounded-lg border border-[rgba(69,70,77,0.3)] bg-[rgba(16,20,21,0.5)] overflow-hidden hover:border-[rgba(123,208,255,0.3)] transition-colors"
          >
            <div className="aspect-video bg-[#1d2022]">
              {theme.backgroundUrl ? (
                theme.type === "video" ? (
                  <video
                    src={theme.backgroundUrl}
                    className="w-full h-full object-cover"
                    muted
                  />
                ) : (
                  <img
                    src={theme.backgroundUrl}
                    alt=""
                    className="w-full h-full object-cover"
                  />
                )
              ) : null}
            </div>
            <p className="text-[#e0e3e5] text-xs font-semibold p-2 truncate">
              {theme.title}
            </p>
          </button>
        ))}
      </div>
    </div>
  );
}

function ResourceBrowser({
  tab,
  songs,
  media,
  themes,
  onAddSong,
  onAddMedia,
  onAddTheme,
  onAddBible,
  onCreateSong,
  onCreateMedia,
  onCreateTheme,
}) {
  const [query, setQuery] = useState("");

  if (tab === "songs") {
    return (
      <SongsBrowser
        songs={songs}
        query={query}
        onQueryChange={setQuery}
        onAdd={onAddSong}
        onCreate={onCreateSong}
      />
    );
  }

  if (tab === "media") {
    return (
      <MediaBrowser
        media={media}
        query={query}
        onQueryChange={setQuery}
        onAdd={onAddMedia}
        onCreate={onCreateMedia}
      />
    );
  }

  if (tab === "theme") {
    return (
      <ThemesBrowser
        themes={themes}
        query={query}
        onQueryChange={setQuery}
        onAdd={onAddTheme}
        onCreate={onCreateTheme}
      />
    );
  }

  return <BibleBrowser onAdd={onAddBible} />;
}

export default ResourceBrowser;
