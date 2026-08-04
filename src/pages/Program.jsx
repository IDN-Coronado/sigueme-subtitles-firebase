import { useEffect, useRef, useState } from "react";
import { useParams } from "react-router-dom";
import { doc, setDoc } from "firebase/firestore";

import db from "../firebase/firebase";
import useSongs from "../firebase/useSongs";
import useThemes from "../firebase/useThemes";
import usePrograms from "../firebase/usePrograms";
import useMedia from "../firebase/useMedia";
import usePreview from "../firebase/usePreview";
import useProgramSchedule from "../hooks/useProgramSchedule";
import usePrecacheProgram from "../hooks/usePrecacheProgram";
import { collectPrecacheTargets } from "../utils/precacheSchedule";
import { evictCachedMedia } from "../utils/mediaCache";
import NewSongModal from "../components/Song/NewSongModal";
import SlideUploadModal from "../components/SlideUploadModal";
import YouTubeMediaModal from "../components/YouTubeMediaModal";
import NewThemeModal from "../components/Theme/NewThemeModal";
import ConfirmationModal from "../components/Theme/ConfirmationModal";
import Panel from "../components/Program/Panel";
import ResizableSplit from "../components/Program/ResizableSplit";
import ScheduleItemRow from "../components/Program/ScheduleItemRow";
import PreviewPanel from "../components/Program/PreviewPanel";
import PreviewConsole from "../components/Program/PreviewConsole";
import MediaConsoleControls from "../components/Program/MediaConsoleControls";
import CaptionConsoleControls from "../components/Program/CaptionConsoleControls";
import PptxConsoleControls from "../components/Program/PptxConsoleControls";
import ResourceBrowser from "../components/Program/ResourceBrowser";
import ProgramHeader from "../components/Program/ProgramHeader";
import { RESOURCE_TABS, MONO } from "../components/Program/constants";
import { IconChevron } from "../components/Icons";
import { t } from "../i18n";

const LAYOUT_STORAGE = {
  vertical: "sigueme.program.layout.vertical",
  horizontal: "sigueme.program.layout.horizontal",
  resourcesCollapsed: "sigueme.program.layout.resourcesCollapsed",
};

function loadResourcesCollapsed() {
  try {
    return localStorage.getItem(LAYOUT_STORAGE.resourcesCollapsed) === "1";
  } catch {
    return false;
  }
}

const CAPTION_COLLECTION = "caption";
const CAPTION_DOC = "caption";

const DELETE_MESSAGE_KEYS = {
  song: "confirm.deleteSong",
  media: "confirm.deleteMedia",
  theme: "confirm.deleteTheme",
  schedule: "confirm.removeFromSchedule",
};

async function setCaption(caption) {
  await setDoc(
    doc(db, CAPTION_COLLECTION, CAPTION_DOC),
    { caption },
    { merge: true }
  );
}

function Program() {
  const { programId } = useParams();
  const consoleMediaRef = useRef(null);
  const previewRef = useRef(null);
  const [resourceTab, setResourceTab] = useState("songs");
  const [resourcesCollapsed, setResourcesCollapsed] = useState(loadResourcesCollapsed);
  const [createModal, setCreateModal] = useState(null);
  const [editingSong, setEditingSong] = useState(null);
  const [editingYouTube, setEditingYouTube] = useState(null);
  const [pendingDelete, setPendingDelete] = useState(null);
  const [pptxSlideCount, setPptxSlideCount] = useState(0);

  const { songs, addSong, updateSong, removeSong } = useSongs();
  const { themes, addTheme, removeTheme } = useThemes();
  const { media, uploadMedia, addYouTubeMedia, updateYouTubeMedia, removeMedia } =
    useMedia();
  const { programs, program, updateProgram, activateProgram } =
    usePrograms(programId);
  const { preview, setPreview, clearPreviewResource } = usePreview();
  previewRef.current = preview;
  const { status: precacheStatus, progress: precacheProgress, run: runPrecache } =
    usePrecacheProgram();

  const {
    schedule,
    selectedId,
    selectedItem,
    hydrated,
    setSelectedId,
    removeItem,
    addSong: addSongToSchedule,
    addMedia,
    addTheme: addThemeToSchedule,
    addBible,
  } = useProgramSchedule({
    programId,
    program,
    songs,
    themes,
    updateProgram,
  });

  // Reconciles the media cache with the active program's current schedule
  // *and* its mainLogo (a separate program-level asset shown via the Logo
  // button below — not part of the schedule array, so it must be passed
  // through explicitly or the "media ready" status would be wrong the
  // moment an operator hits Logo). This is the single trigger for
  // precaching — not a direct call from handleActivate — so it also
  // covers cases that a one-shot "activate" action can't: reopening or
  // refreshing an already-active program (e.g. after its cache was
  // evicted, or the browser dropped it under storage pressure), and
  // assets added to the schedule (or a changed logo) after activation.
  // Runs whenever the program is active, hydrated, and the set of Storage
  // URLs actually referenced (order-independent) changes; precacheSchedule's
  // own caches.match() check keeps a same-signature re-run cheap (no
  // re-fetching already-cached assets).
  const precacheSignature = collectPrecacheTargets(schedule, program?.mainLogo)
    .map((target) => target.url)
    .sort()
    .join("|");

  useEffect(() => {
    if (!hydrated || !program?.active || !precacheSignature) return;
    runPrecache(schedule, program?.mainLogo);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [hydrated, program?.active, precacheSignature]);

  const closeCreateModal = () => {
    setCreateModal(null);
    setEditingYouTube(null);
  };

  const closeSongModal = () => {
    setCreateModal(null);
    setEditingSong(null);
  };

  const handleSaveSong = async ({ title, sections, id }) => {
    if (id) {
      await updateSong(id, title, sections);
    } else {
      await addSong(title, sections);
    }
  };

  const handleCreateMedia = async ({ file, title }) => {
    try {
      await uploadMedia({ file, title });
      closeCreateModal();
    } catch {
      alert(t("errors.uploadFile"));
    }
  };

  const handleCreateYouTube = async ({ id, url, title }) => {
    try {
      if (id) {
        await updateYouTubeMedia({ id, url, title });
      } else {
        await addYouTubeMedia({ url, title });
      }
      closeCreateModal();
    } catch {
      alert(t("errors.addYouTube"));
    }
  };

  const handleCreateTheme = async ({ title, storagePath, file }) => {
    try {
      await addTheme({ title, storagePath, file });
    } catch {
      alert(t("errors.uploadTheme"));
    }
  };

  const handleConfirmDelete = async () => {
    if (!pendingDelete) return;
    const { type, item } = pendingDelete;
    try {
      if (type === "song") await removeSong(item.id);
      else if (type === "media") await removeMedia(item);
      else if (type === "theme") await removeTheme(item);
      else if (type === "schedule") await removeItem(item.id);
    } catch {
      alert(t("errors.deleteResource"));
    } finally {
      setPendingDelete(null);
    }
  };

  const handlePreviewSelect = async (resource) => {
    const themeItem = schedule.find((i) => i.type === "theme");
    const theme =
      themeItem
        ? {
            id: themeItem.themeId,
            title: themeItem.title,
            backgroundUrl: themeItem.backgroundUrl,
            themeType: themeItem.themeType,
          }
        : preview?.theme || null;

    await setPreview({
      programId,
      theme,
      resource,
    });

    if (resource.type === "song") {
      await setCaption(resource.song?.line || "");
    }
  };

  const handleAddTheme = async (theme) => {
    await addThemeToSchedule(theme);
    await setPreview({
      programId,
      theme: {
        id: theme.id,
        title: theme.title,
        backgroundUrl: theme.backgroundUrl,
        themeType: theme.type,
      },
    });
  };

  const isLogoDisplayed =
    preview?.resource?.type === "media" &&
    Boolean(program?.mainLogo?.url) &&
    (preview.resource.media?.storagePath === program.mainLogo.storagePath ||
      preview.resource.media?.url === program.mainLogo.url);

  const handleActivate = async () => {
    // Only one program is ever active (activateProgram flips every other
    // program's `active` flag off in the same batch), so there's at most
    // one previously-active program whose cached assets are no longer
    // needed — evict them so the media cache stays scoped to the current
    // active program rather than growing with every program ever run.
    const previouslyActive = programs.find(
      (p) => p.active && p.id !== programId
    );

    await activateProgram(programId);

    if (previouslyActive) {
      const staleTargets = collectPrecacheTargets(
        previouslyActive.schedule,
        previouslyActive.mainLogo
      );
      await Promise.all(staleTargets.map((t) => evictCachedMedia(t.url)));
    }

    // Precaching itself is triggered by the reconciliation effect below,
    // once `program.active` reflects this activation (via Firestore's
    // onSnapshot echo) — not called directly here — so the same single
    // code path also covers reopening/refreshing an already-active
    // program and schedule changes made after activation.
  };

  const handleClear = async () => {
    if (isLogoDisplayed) return;

    const themeItem = schedule.find((i) => i.type === "theme");
    const theme = themeItem
      ? {
          id: themeItem.themeId,
          title: themeItem.title,
          backgroundUrl: themeItem.backgroundUrl,
          themeType: themeItem.themeType,
        }
      : preview?.theme || null;

    await setCaption("");
    if (theme) {
      await setPreview({ programId, theme });
    }
    await clearPreviewResource();
  };

  const handleShowLogo = async () => {
    const logo = program?.mainLogo;
    if (!logo?.url) return;

    const themeItem = schedule.find((i) => i.type === "theme");
    const theme =
      themeItem
        ? {
            id: themeItem.themeId,
            title: themeItem.title,
            backgroundUrl: themeItem.backgroundUrl,
            themeType: themeItem.themeType,
          }
        : preview?.theme || null;

    await setCaption("");
    await setPreview({
      programId,
      theme,
      resource: {
        type: "media",
        media: {
          title: logo.title,
          name: logo.name || logo.title,
          url: logo.url,
          storagePath: logo.storagePath,
          mediaType: logo.mediaType || "video",
        },
      },
    });
  };

  const handleSetMediaAsLogo = async (item) => {
    if (!item?.url || !programId || item.type === "pptx") return;
    try {
      await updateProgram(programId, {
        mainLogo: {
          title: item.name,
          name: item.name,
          url: item.url,
          storagePath: item.fullPath || item.storagePath,
          mediaType: item.type || "image",
        },
      });
    } catch {
      alert(t("program.logoUpdateError"));
    }
  };

  const handlePptxLoaded = async ({ slideCount }) => {
    const count = Math.max(0, Math.floor(Number(slideCount) || 0));
    if (count > 0) setPptxSlideCount(count);

    const current = previewRef.current;
    const media = current?.resource?.media;
    if (
      current?.resource?.type !== "media" ||
      media?.mediaType !== "pptx" ||
      count <= 0
    ) {
      return;
    }
    if (media.slideCount === count) return;

    const slideIndex = Number.isFinite(media.slideIndex)
      ? Math.max(0, Math.min(count - 1, Math.floor(media.slideIndex)))
      : 0;

    await setPreview({
      programId,
      theme: current.theme ?? null,
      resource: {
        type: "media",
        media: {
          ...media,
          slideIndex,
          slideCount: count,
        },
      },
    });
  };

  const toggleResourcesCollapsed = () => {
    setResourcesCollapsed((prev) => {
      const next = !prev;
      try {
        localStorage.setItem(
          LAYOUT_STORAGE.resourcesCollapsed,
          next ? "1" : "0"
        );
      } catch {
        // ignore quota / private mode
      }
      return next;
    });
  };

  const consoleMedia =
    preview?.resource?.type === "media" ? preview.resource.media : null;
  const showPptxControls = consoleMedia?.mediaType === "pptx";
  const showMediaControls =
    consoleMedia &&
    (consoleMedia.mediaType === "audio" ||
      consoleMedia.mediaType === "video" ||
      consoleMedia.mediaType === "youtube");

  useEffect(() => {
    if (consoleMedia?.mediaType !== "pptx") {
      setPptxSlideCount(0);
      return;
    }
    if (Number.isFinite(consoleMedia.slideCount) && consoleMedia.slideCount > 0) {
      setPptxSlideCount(Math.floor(consoleMedia.slideCount));
    }
  }, [
    consoleMedia?.mediaType,
    consoleMedia?.url,
    consoleMedia?.storagePath,
    consoleMedia?.slideCount,
  ]);

  const effectivePptxSlideCount = Math.max(
    pptxSlideCount,
    Number.isFinite(consoleMedia?.slideCount)
      ? Math.floor(consoleMedia.slideCount)
      : 0
  );

  const precacheEntries = Object.values(precacheProgress);
  const precacheTotal = precacheEntries[0]?.total ?? 0;
  const precacheDone = precacheEntries.filter(
    (e) =>
      e.status === "cached" || e.status === "error" || e.status === "unavailable"
  ).length;
  // precacheStatus mirrors precacheSchedule's verified outcome, not just
  // "the run finished" — only "success" means every target was actually
  // confirmed written to the cache. See usePrecacheProgram/precacheSchedule.
  const precacheAction =
    precacheStatus === "running" && precacheTotal > 0 ? (
      <span className="text-[#6b7280] text-[10px] tracking-[0.05em]" style={MONO}>
        {t("program.preparingMedia", { done: precacheDone, total: precacheTotal })}
      </span>
    ) : precacheStatus === "success" && precacheTotal > 0 ? (
      <span className="text-emerald-400 text-[10px] tracking-[0.05em]" style={MONO}>
        {t("program.mediaReady")}
      </span>
    ) : precacheStatus === "partial" ? (
      <span className="text-amber-400 text-[10px] tracking-[0.05em]" style={MONO}>
        {t("program.mediaPartial", { done: precacheDone, total: precacheTotal })}
      </span>
    ) : precacheStatus === "error" ? (
      <span className="text-red-400 text-[10px] tracking-[0.05em]" style={MONO}>
        {t("program.mediaError")}
      </span>
    ) : precacheStatus === "unavailable" ? (
      <span className="text-[#6b7280] text-[10px] tracking-[0.05em]" style={MONO}>
        {t("program.mediaUnavailable")}
      </span>
    ) : null;

  const topPanels = (
    <ResizableSplit
      direction="horizontal"
      className="h-full"
      defaultSizes={[25, 25, 50]}
      minSizes={[12, 12, 25]}
      storageKey={LAYOUT_STORAGE.horizontal}
    >
      <Panel
        title={t("program.panels.schedule")}
        className="h-full"
        action={precacheAction}
      >
        <div className="flex flex-col gap-2">
          {!hydrated && (
            <p className="text-[#6b7280] text-sm">{t("common.loading")}</p>
          )}
          {hydrated && schedule.length === 0 && (
            <p className="text-[#6b7280] text-sm px-1">
              {t("program.scheduleEmpty")}
            </p>
          )}
          {schedule.map((item, index) => {
            const itemIndex =
              item.type === "theme"
                ? 0
                : schedule
                    .slice(0, index)
                    .filter((i) => i.type !== "theme").length;
            return (
              <ScheduleItemRow
                key={item.id}
                item={item}
                index={itemIndex}
                active={item.id === selectedId}
                onSelect={setSelectedId}
                onRemove={(id) =>
                  setPendingDelete({ type: "schedule", item: { id } })
                }
                cacheStatus={precacheProgress[item.id]?.status}
              />
            );
          })}
        </div>
      </Panel>

      <Panel title={t("program.panels.preview")} className="h-full">
        <PreviewPanel
          item={selectedItem}
          songs={songs}
          preview={preview}
          onSelect={handlePreviewSelect}
        />
      </Panel>

      <Panel
        title={t("program.panels.console")}
        className="h-full"
        action={
          <div className="flex items-center gap-2 sm:gap-3 min-w-0 max-w-full overflow-x-auto">
            {showPptxControls ? (
              <PptxConsoleControls
                preview={preview}
                setPreview={setPreview}
                slideCount={effectivePptxSlideCount}
              />
            ) : showMediaControls ? (
              <MediaConsoleControls
                mediaRef={consoleMediaRef}
                mediaKey={consoleMedia.url}
              />
            ) : (
              <CaptionConsoleControls
                programId={programId}
                activeContentType={
                  preview?.resource?.type === "bible" ? "bible" : "song"
                }
              />
            )}
          </div>
        }
      >
        <PreviewConsole
          preview={preview}
          mediaRef={consoleMediaRef}
          onPptxLoaded={handlePptxLoaded}
        />
      </Panel>
    </ResizableSplit>
  );

  const resourceSection = (
    <section
      className={`${
        resourcesCollapsed ? "shrink-0" : "h-full"
      } min-h-0 min-w-0 w-full bg-[rgba(29,32,34,0.5)] border border-[rgba(69,70,77,0.35)] rounded-lg flex flex-col overflow-hidden`}
    >
      <div
        className={`shrink-0 flex items-center gap-2 ${
          resourcesCollapsed
            ? "px-2 py-2"
            : "px-3 sm:px-4 py-3 border-b border-[rgba(69,70,77,0.25)]"
        }`}
      >
        {!resourcesCollapsed && (
          <div className="flex items-center gap-2 min-w-0 flex-1 overflow-x-auto">
            {RESOURCE_TABS.map((tab) => {
              const Icon = tab.Icon;
              return (
                <button
                  key={tab.id}
                  type="button"
                  onClick={() => setResourceTab(tab.id)}
                  className={`inline-flex items-center gap-2 px-4 py-2 rounded-sm text-sm font-medium whitespace-nowrap transition-colors ${
                    resourceTab === tab.id
                      ? "bg-[#323537] text-[#e0e3e5]"
                      : "bg-[rgba(50,53,55,0.35)] text-[#c6c6cd] hover:text-[#e0e3e5]"
                  }`}
                >
                  <Icon color="currentColor" />
                  {t(`program.tabs.${tab.id}`)}
                </button>
              );
            })}
          </div>
        )}
        <button
          type="button"
          onClick={toggleResourcesCollapsed}
          title={
            resourcesCollapsed
              ? t("program.expandResources")
              : t("program.collapseResources")
          }
          aria-label={
            resourcesCollapsed
              ? t("program.expandResources")
              : t("program.collapseResources")
          }
          aria-expanded={!resourcesCollapsed}
          className={`shrink-0 inline-flex items-center justify-center w-8 h-8 rounded-sm text-[#c6c6cd] border border-[rgba(69,70,77,0.4)] hover:border-[#7bd0ff] hover:text-[#7bd0ff] transition-colors ${
            resourcesCollapsed ? "ml-auto" : ""
          }`}
        >
          <span
            className={`inline-flex transition-transform duration-200 ${
              resourcesCollapsed ? "rotate-90" : "-rotate-90"
            }`}
          >
            <IconChevron collapsed={false} />
          </span>
        </button>
      </div>
      {!resourcesCollapsed && (
        <div className="flex-1 min-h-0 overflow-hidden p-3 sm:p-4">
          <ResourceBrowser
            tab={resourceTab}
            songs={songs}
            media={media}
            themes={themes}
            onAddSong={addSongToSchedule}
            onAddMedia={addMedia}
            onAddTheme={handleAddTheme}
            onAddBible={addBible}
            onCreateSong={() => {
              setEditingSong(null);
              setCreateModal("song");
            }}
            onCreateMedia={() => setCreateModal("media")}
            onCreateYouTube={() => {
              setEditingYouTube(null);
              setCreateModal("youtube");
            }}
            onEditYouTube={(item) => {
              setEditingYouTube(item);
              setCreateModal("youtube");
            }}
            onCreateTheme={() => setCreateModal("theme")}
            onEditSong={(song) => {
              setEditingSong(song);
              setCreateModal("song");
            }}
            onDeleteSong={(song) =>
              setPendingDelete({ type: "song", item: song })
            }
            onDeleteMedia={(item) =>
              setPendingDelete({ type: "media", item })
            }
            onDeleteTheme={(theme) =>
              setPendingDelete({ type: "theme", item: theme })
            }
            onSetMediaAsLogo={handleSetMediaAsLogo}
          />
        </div>
      )}
    </section>
  );

  return (
    <div
      className="flex flex-col overflow-hidden bg-[#101415]"
      style={{ height: "100vh", maxHeight: "100vh" }}
    >
      <ProgramHeader
        title={program?.title}
        date={program?.date}
        isActive={!!program?.active}
        onActivate={handleActivate}
        onClear={handleClear}
        onShowLogo={handleShowLogo}
        clearDisabled={isLogoDisplayed}
      />

      <main className="min-h-0 min-w-0 p-4 sm:p-5 overflow-hidden flex-1">
        {resourcesCollapsed ? (
          <div className="h-full min-h-0 flex flex-col gap-3">
            <div className="flex-1 min-h-0 overflow-hidden">{topPanels}</div>
            {resourceSection}
          </div>
        ) : (
          <ResizableSplit
            direction="vertical"
            className="h-full"
            defaultSizes={[50, 50]}
            minSizes={[20, 20]}
            storageKey={LAYOUT_STORAGE.vertical}
          >
            {topPanels}
            {resourceSection}
          </ResizableSplit>
        )}
      </main>

      <NewSongModal
        isOpen={createModal === "song"}
        onClose={closeSongModal}
        onSubmit={handleSaveSong}
        song={editingSong}
      />
      <SlideUploadModal
        isOpen={createModal === "media"}
        onClose={closeCreateModal}
        onUpload={handleCreateMedia}
      />
      <YouTubeMediaModal
        isOpen={createModal === "youtube"}
        onClose={closeCreateModal}
        onSubmit={handleCreateYouTube}
        item={editingYouTube}
      />
      <NewThemeModal
        isVisible={createModal === "theme"}
        onClose={closeCreateModal}
        onSubmit={handleCreateTheme}
      />
      <ConfirmationModal
        isVisible={Boolean(pendingDelete)}
        message={
          pendingDelete ? t(DELETE_MESSAGE_KEYS[pendingDelete.type]) : ""
        }
        onCancel={() => setPendingDelete(null)}
        onConfirm={handleConfirmDelete}
      />
    </div>
  );
}

export default Program;
