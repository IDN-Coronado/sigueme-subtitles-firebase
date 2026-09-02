import { useEffect, useMemo, useState } from "react";

import { MONO } from "./constants";
import ResourceToolbar from "./ResourceToolbar";
import ResourceItemMenu from "./ResourceItemMenu";
import BibleBrowser from "./BibleBrowser";
import PdfThumbnail from "./PdfThumbnail";
import { t } from "../../i18n";
import { mediaDisplayTitle } from "../../utils/mediaTitle";
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
  const [selected, setSelected] = useState({});

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

  const selectedCount = Object.keys(selected).length;
  const selectedList = useMemo(() => Object.values(selected), [selected]);

  const toggleSong = (song) => {
    setSelected((prev) => {
      if (prev[song.id]) {
        const next = { ...prev };
        delete next[song.id];
        return next;
      }
      return { ...prev, [song.id]: song };
    });
  };

  const handleAddSelected = async () => {
    if (selectedCount === 0) return;
    await onAdd(selectedCount === 1 ? selectedList[0] : selectedList);
    setSelected({});
  };

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
              const isSelected = !!selected[song.id];
              return (
                <li key={song.id} className="min-w-0">
                  <div
                    className={`relative h-full rounded-lg border transition-colors ${
                      isSelected
                        ? "border-[rgba(123,208,255,0.45)] bg-[rgba(123,208,255,0.12)]"
                        : "border-[rgba(69,70,77,0.3)] bg-[rgba(16,20,21,0.5)] hover:border-[rgba(123,208,255,0.35)] hover:bg-[rgba(123,208,255,0.08)]"
                    }`}
                  >
                    <button
                      type="button"
                      onClick={() => toggleSong(song)}
                      title={song.title}
                      className="w-full h-full text-left px-3 py-2.5 pr-9"
                    >
                      <span className="flex items-center gap-1.5 text-[#e0e3e5] text-xs sm:text-sm font-medium leading-snug">
                        <span className="line-clamp-2">{song.title}</span>
                        {isSelected && (
                          <span className="shrink-0 text-[#7bd0ff]">✓</span>
                        )}
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
      <div className="shrink-0 flex items-center justify-between gap-3 border-t border-[rgba(69,70,77,0.25)] pt-3">
        <p className="text-[#6b7280] text-xs" style={MONO}>
          {selectedCount === 0
            ? t("resource.selectHint")
            : t("resource.selectedCount", { count: selectedCount })}
        </p>
        <div className="flex items-center gap-2">
          {selectedCount > 0 && (
            <button
              type="button"
              onClick={() => setSelected({})}
              className="px-3 py-2 text-sm text-[#c6c6cd] border border-[rgba(69,70,77,0.4)] rounded-sm hover:border-[#7bd0ff] hover:text-[#7bd0ff] transition-colors"
            >
              {t("common.clear")}
            </button>
          )}
          <button
            type="button"
            disabled={selectedCount === 0}
            onClick={handleAddSelected}
            className="px-4 py-2 bg-[#7bd0ff] text-[#00354a] text-sm font-bold rounded-sm hover:bg-[#5bc0ef] transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
          >
            {t("resourceMenu.addToSchedule")}
          </button>
        </div>
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
  onAddYouTube,
  onEditYouTube,
  onDelete,
  onSetAsLogo,
}) {
  const q = query.trim().toLowerCase();
  const [selected, setSelected] = useState({});
  const list = media.filter((m) => {
    if (!q) return true;
    const label = mediaDisplayTitle(m).toLowerCase();
    return label.includes(q) || m.name.toLowerCase().includes(q);
  });

  const selectedCount = Object.keys(selected).length;
  const selectedList = useMemo(() => Object.values(selected), [selected]);

  const toggleItem = (item) => {
    setSelected((prev) => {
      if (prev[item.id]) {
        const next = { ...prev };
        delete next[item.id];
        return next;
      }
      return { ...prev, [item.id]: item };
    });
  };

  const handleAddSelected = async () => {
    if (selectedCount === 0) return;
    await onAdd(selectedCount === 1 ? selectedList[0] : selectedList);
    setSelected({});
  };

  return (
    <div className="flex flex-col gap-3 h-full min-h-0">
      <ResourceToolbar
        query={query}
        onQueryChange={onQueryChange}
        placeholder={t("resource.searchMedia")}
        createLabel={t("resource.uploadFile")}
        onCreate={onCreate}
        secondaryLabel={t("resource.addYouTube")}
        onSecondary={onAddYouTube}
      />
      <div className="grid grid-cols-4 sm:grid-cols-5 md:grid-cols-6 lg:grid-cols-7 xl:grid-cols-8 gap-1.5 overflow-auto min-h-0 flex-1 content-start">
        {list.map((item) => {
          const isSelected = !!selected[item.id];
          const menuOptions = [
            {
              id: "add",
              label: t("resourceMenu.addToSchedule"),
              onClick: () => onAdd(item),
            },
          ];
          if (item.type === "youtube") {
            menuOptions.push({
              id: "edit",
              label: t("resourceMenu.edit"),
              onClick: () => onEditYouTube?.(item),
            });
          } else if (item.type !== "pdf") {
            menuOptions.push({
              id: "setLogo",
              label: t("resourceMenu.setAsDefaultLogo"),
              onClick: () => onSetAsLogo(item),
            });
          }
          menuOptions.push({
            id: "delete",
            label: t("resourceMenu.delete"),
            danger: true,
            onClick: () => onDelete(item),
          });

          return (
            <div
              key={item.id}
              className={`relative text-left rounded-sm border transition-colors ${
                isSelected
                  ? "border-[rgba(123,208,255,0.45)] bg-[rgba(123,208,255,0.12)]"
                  : "border-[rgba(69,70,77,0.3)] bg-[rgba(16,20,21,0.5)] hover:border-[rgba(123,208,255,0.3)]"
              }`}
            >
              <button
                type="button"
                onClick={() => toggleItem(item)}
                className="w-full text-left"
              >
                <div className="relative aspect-[4/3] bg-[#1d2022] overflow-hidden rounded-t-sm">
                  {item.type === "youtube" ? (
                    <img
                      src={item.thumbnailUrl || item.url}
                      alt=""
                      className="w-full h-full object-cover"
                    />
                  ) : item.type === "video" ? (
                    <video
                      src={item.url}
                      crossOrigin="anonymous"
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
                  ) : item.type === "pdf" ? (
                    <PdfThumbnail
                      url={item.url}
                      storagePath={item.fullPath || item.storagePath}
                    />
                  ) : (
                    <img
                      src={item.url}
                      crossOrigin="anonymous"
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
                  {item.type === "youtube" && (
                    <span
                      className="pointer-events-none absolute bottom-1 left-1 text-[8px] tracking-[0.06em] text-[#ffb4ab] bg-[rgba(16,20,21,0.75)] px-1 py-0.5 rounded-sm"
                      style={MONO}
                    >
                      {t("media.youtubeBadge")}
                    </span>
                  )}
                  {item.type === "pdf" && (
                    <span
                      className="pointer-events-none absolute bottom-1 left-1 text-[8px] tracking-[0.06em] text-[#7bd0ff] bg-[rgba(16,20,21,0.75)] px-1 py-0.5 rounded-sm"
                      style={MONO}
                    >
                      {t("media.pdfBadge")}
                    </span>
                  )}
                  {isSelected && (
                    <span className="pointer-events-none absolute top-1 left-1 w-4 h-4 rounded-full bg-[#7bd0ff] text-[#00354a] text-[10px] font-bold flex items-center justify-center">
                      ✓
                    </span>
                  )}
                </div>
                <p className="text-[#e0e3e5] text-[9px] sm:text-[10px] font-medium px-1 py-0.5 truncate pr-6">
                  {mediaDisplayTitle(item)}
                </p>
              </button>
              <div className="absolute top-1 right-1 z-10">
                <ResourceItemMenu options={menuOptions} />
              </div>
            </div>
          );
        })}
      </div>
      <div className="shrink-0 flex items-center justify-between gap-3 border-t border-[rgba(69,70,77,0.25)] pt-3">
        <p className="text-[#6b7280] text-xs" style={MONO}>
          {selectedCount === 0
            ? t("resource.selectHint")
            : t("resource.selectedCount", { count: selectedCount })}
        </p>
        <div className="flex items-center gap-2">
          {selectedCount > 0 && (
            <button
              type="button"
              onClick={() => setSelected({})}
              className="px-3 py-2 text-sm text-[#c6c6cd] border border-[rgba(69,70,77,0.4)] rounded-sm hover:border-[#7bd0ff] hover:text-[#7bd0ff] transition-colors"
            >
              {t("common.clear")}
            </button>
          )}
          <button
            type="button"
            disabled={selectedCount === 0}
            onClick={handleAddSelected}
            className="px-4 py-2 bg-[#7bd0ff] text-[#00354a] text-sm font-bold rounded-sm hover:bg-[#5bc0ef] transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
          >
            {t("resourceMenu.addToSchedule")}
          </button>
        </div>
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
                      crossOrigin="anonymous"
                      className="w-full h-full object-cover"
                      muted
                    />
                  ) : (
                    <img
                      src={theme.backgroundUrl}
                      crossOrigin="anonymous"
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
  onCreateYouTube,
  onEditYouTube,
  onCreateTheme,
  onEditSong,
  onDeleteSong,
  onDeleteMedia,
  onDeleteTheme,
  onSetMediaAsLogo,
}) {
  const [query, setQuery] = useState("");

  useEffect(() => {
    setQuery("");
  }, [tab]);

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
        onAddYouTube={onCreateYouTube}
        onEditYouTube={onEditYouTube}
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
