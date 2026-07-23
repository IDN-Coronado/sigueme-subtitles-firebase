import { useMemo, useState } from "react";

import { MONO } from "./constants";
import ResourceToolbar from "./ResourceToolbar";
import ResourceItemMenu from "./ResourceItemMenu";
import BibleBrowser from "./BibleBrowser";
import { t } from "../../i18n";
import { flattenSongLines } from "../../utils/songSections";

function normalizeSearch(text) {
  return String(text || "")
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase();
}

function songPreviewLines(song, count = 2) {
  return flattenSongLines(song).slice(0, count);
}

function SongsBrowser({
  songs,
  query,
  onQueryChange,
  onAdd,
  onCreate,
  onEdit,
  onDelete,
}) {
  const q = normalizeSearch(query);

  const list = useMemo(
    () =>
      songs
        .filter((s) => !q || normalizeSearch(s.title).includes(q))
        .slice()
        .sort((a, b) =>
          a.title.localeCompare(b.title, undefined, { sensitivity: "base" })
        ),
    [songs, q]
  );

  return (
    <div className="flex flex-col gap-2 h-full min-h-0">
      <ResourceToolbar
        query={query}
        onQueryChange={onQueryChange}
        placeholder={t("resource.searchSongs")}
        createLabel={t("resource.newSong")}
        onCreate={onCreate}
      />
      <div className="flex items-center justify-between gap-2 px-0.5 shrink-0">
        <p className="text-[#6b7280] text-[10px] tracking-[0.06em]" style={MONO}>
          {list.length === 0
            ? t("common.noResults")
            : list.length === 1
              ? t("resource.songCount", { count: list.length })
              : t("resource.songCountPlural", { count: list.length })}
        </p>
      </div>
      <div className="overflow-auto min-h-0 flex-1">
        {list.length === 0 && (
          <p className="text-[#6b7280] text-sm px-1">{t("resource.noSongs")}</p>
        )}
        {list.length > 0 && (
          <ul className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-2 content-start">
            {list.map((song) => {
              const preview = songPreviewLines(song, 2);
              return (
                <li key={song.id} className="min-w-0">
                  <div className="relative h-full rounded-lg border border-[rgba(69,70,77,0.3)] bg-[rgba(16,20,21,0.5)] hover:border-[rgba(123,208,255,0.35)] hover:bg-[rgba(123,208,255,0.08)] transition-colors">
                    <button
                      type="button"
                      onClick={() => onAdd(song)}
                      title={song.title}
                      className="w-full h-full text-left px-3 py-2.5 pr-9"
                    >
                      <span className="block text-[#e0e3e5] text-xs sm:text-sm font-medium leading-snug line-clamp-2">
                        {song.title}
                      </span>
                      {preview.length > 0 && (
                        <span className="mt-1.5 block text-[#6b7280] text-[10px] sm:text-[11px] leading-snug">
                          {preview.map((line, i) => (
                            <span key={i} className="block truncate">
                              {line}
                            </span>
                          ))}
                        </span>
                      )}
                    </button>
                    <div className="absolute top-1.5 right-1.5">
                      <ResourceItemMenu
                        options={[
                          {
                            id: "add",
                            label: t("resourceMenu.addToSchedule"),
                            onClick: () => onAdd(song),
                          },
                          {
                            id: "edit",
                            label: t("resourceMenu.edit"),
                            onClick: () => onEdit(song),
                          },
                          {
                            id: "delete",
                            label: t("resourceMenu.delete"),
                            danger: true,
                            onClick: () => onDelete(song),
                          },
                        ]}
                      />
                    </div>
                  </div>
                </li>
              );
            })}
          </ul>
        )}
      </div>
    </div>
  );
}

function MediaBrowser({
  media,
  query,
  onQueryChange,
  onAdd,
  onCreate,
  onDelete,
  onSetAsLogo,
}) {
  const q = query.trim().toLowerCase();
  const list = media.filter((m) => !q || m.name.toLowerCase().includes(q));

  return (
    <div className="flex flex-col gap-3 h-full min-h-0">
      <ResourceToolbar
        query={query}
        onQueryChange={onQueryChange}
        placeholder={t("resource.searchMedia")}
        createLabel={t("resource.uploadFile")}
        onCreate={onCreate}
      />
      <div className="grid grid-cols-4 sm:grid-cols-5 md:grid-cols-6 lg:grid-cols-7 xl:grid-cols-8 gap-1.5 overflow-auto min-h-0 flex-1 content-start">
        {list.map((item) => (
          <div
            key={item.id}
            className="relative text-left rounded-sm border border-[rgba(69,70,77,0.3)] bg-[rgba(16,20,21,0.5)] hover:border-[rgba(123,208,255,0.3)] transition-colors"
          >
            <button
              type="button"
              onClick={() => onAdd(item)}
              className="w-full text-left"
            >
              <div className="relative aspect-[4/3] bg-[#1d2022] overflow-hidden rounded-t-sm">
                {item.type === "video" ? (
                  <video
                    src={item.url}
                    className="w-full h-full object-cover"
                    muted
                  />
                ) : item.type === "audio" ? (
                  <div
                    className="w-full h-full flex items-center justify-center text-[#45464d] text-[8px]"
                    style={MONO}
                  >
                    {t("media.audioBadge")}
                  </div>
                ) : (
                  <img
                    src={item.url}
                    alt=""
                    className="w-full h-full object-cover"
                  />
                )}
                <div
                  className="pointer-events-none absolute inset-0"
                  style={{
                    background:
                      "linear-gradient(to bottom left, rgba(16,20,21,0.8) 0%, rgba(16,20,21,0.35) 28%, transparent 55%)",
                  }}
                />
              </div>
              <p className="text-[#e0e3e5] text-[9px] sm:text-[10px] font-medium px-1 py-0.5 truncate pr-6">
                {item.name}
              </p>
            </button>
            <div className="absolute top-1 right-1 z-10">
              <ResourceItemMenu
                options={[
                  {
                    id: "add",
                    label: t("resourceMenu.addToSchedule"),
                    onClick: () => onAdd(item),
                  },
                  {
                    id: "setLogo",
                    label: t("resourceMenu.setAsDefaultLogo"),
                    onClick: () => onSetAsLogo(item),
                  },
                  {
                    id: "delete",
                    label: t("resourceMenu.delete"),
                    danger: true,
                    onClick: () => onDelete(item),
                  },
                ]}
              />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

function ThemesBrowser({
  themes,
  query,
  onQueryChange,
  onAdd,
  onCreate,
  onDelete,
}) {
  const q = query.trim().toLowerCase();
  const list = themes.filter(
    (theme) => !q || theme.title.toLowerCase().includes(q)
  );

  return (
    <div className="flex flex-col gap-3 h-full min-h-0">
      <ResourceToolbar
        query={query}
        onQueryChange={onQueryChange}
        placeholder={t("resource.searchThemes")}
        createLabel={t("resource.newTheme")}
        onCreate={onCreate}
      />
      <div className="grid grid-cols-4 sm:grid-cols-5 md:grid-cols-6 lg:grid-cols-7 xl:grid-cols-8 gap-1.5 overflow-auto min-h-0 flex-1 content-start">
        {list.map((theme) => (
          <div
            key={theme.id}
            className="relative text-left rounded-sm border border-[rgba(69,70,77,0.3)] bg-[rgba(16,20,21,0.5)] hover:border-[rgba(123,208,255,0.3)] transition-colors"
          >
            <button
              type="button"
              onClick={() => onAdd(theme)}
              className="w-full text-left"
            >
              <div className="relative aspect-[4/3] bg-[#1d2022] overflow-hidden rounded-t-sm">
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
                <div
                  className="pointer-events-none absolute inset-0"
                  style={{
                    background:
                      "linear-gradient(to bottom left, rgba(16,20,21,0.8) 0%, rgba(16,20,21,0.35) 28%, transparent 55%)",
                  }}
                />
              </div>
              <p className="text-[#e0e3e5] text-[9px] sm:text-[10px] font-medium px-1 py-0.5 truncate pr-6">
                {theme.title}
              </p>
            </button>
            <div className="absolute top-1 right-1 z-10">
              <ResourceItemMenu
                options={[
                  {
                    id: "add",
                    label: t("resourceMenu.addToSchedule"),
                    onClick: () => onAdd(theme),
                  },
                  {
                    id: "delete",
                    label: t("resourceMenu.delete"),
                    danger: true,
                    onClick: () => onDelete(theme),
                  },
                ]}
              />
            </div>
          </div>
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
  onEditSong,
  onDeleteSong,
  onDeleteMedia,
  onDeleteTheme,
  onSetMediaAsLogo,
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
        onEdit={onEditSong}
        onDelete={onDeleteSong}
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
        onDelete={onDeleteMedia}
        onSetAsLogo={onSetMediaAsLogo}
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
        onDelete={onDeleteTheme}
      />
    );
  }

  return <BibleBrowser onAdd={onAddBible} />;
}

export default ResourceBrowser;
