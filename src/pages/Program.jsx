import { useRef, useState } from "react";
import { useParams } from "react-router-dom";
import { doc, setDoc } from "firebase/firestore";

import db from "../firebase/firebase";
import useSongs from "../firebase/useSongs";
import useThemes from "../firebase/useThemes";
import usePrograms from "../firebase/usePrograms";
import useMedia from "../firebase/useMedia";
import usePreview from "../firebase/usePreview";
import useProgramSchedule from "../hooks/useProgramSchedule";
import NewSongModal from "../components/Song/NewSongModal";
import SlideUploadModal from "../components/SlideUploadModal";
import NewThemeModal from "../components/Theme/NewThemeModal";
import ConfirmationModal from "../components/Theme/ConfirmationModal";
import Panel from "../components/Program/Panel";
import ResizableSplit from "../components/Program/ResizableSplit";
import ScheduleItemRow from "../components/Program/ScheduleItemRow";
import PreviewPanel from "../components/Program/PreviewPanel";
import PreviewConsole from "../components/Program/PreviewConsole";
import MediaConsoleControls from "../components/Program/MediaConsoleControls";
import CaptionConsoleControls from "../components/Program/CaptionConsoleControls";
import ResourceBrowser from "../components/Program/ResourceBrowser";
import ProgramHeader from "../components/Program/ProgramHeader";
import { RESOURCE_TABS } from "../components/Program/constants";
import { t } from "../i18n";

const LAYOUT_STORAGE = {
  vertical: "sigueme.program.layout.vertical",
  horizontal: "sigueme.program.layout.horizontal",
};

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
  const [resourceTab, setResourceTab] = useState("songs");
  const [createModal, setCreateModal] = useState(null);
  const [editingSong, setEditingSong] = useState(null);
  const [pendingDelete, setPendingDelete] = useState(null);

  const { songs, addSong, updateSong, removeSong } = useSongs();
  const { themes, addTheme, removeTheme } = useThemes();
  const { media, uploadMedia, removeMedia } = useMedia();
  const { program, updateProgram, activateProgram } = usePrograms(programId);
  const { preview, setPreview, clearPreviewResource } = usePreview();

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

  const closeCreateModal = () => setCreateModal(null);

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
    if (!item?.url || !programId) return;
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

  const consoleMedia =
    preview?.resource?.type === "media" ? preview.resource.media : null;
  const showMediaControls =
    consoleMedia &&
    (consoleMedia.mediaType === "audio" || consoleMedia.mediaType === "video");

  return (
    <div
      className="flex flex-col overflow-hidden bg-[#101415]"
      style={{ height: "100vh", maxHeight: "100vh" }}
    >
      <ProgramHeader
        title={program?.title}
        date={program?.date}
        isActive={!!program?.active}
        onActivate={() => activateProgram(programId)}
        onClear={handleClear}
        onShowLogo={handleShowLogo}
        clearDisabled={isLogoDisplayed}
      />

      <main className="min-h-0 min-w-0 p-4 sm:p-5 overflow-hidden flex-1">
        <ResizableSplit
          direction="vertical"
          className="h-full"
          defaultSizes={[50, 50]}
          minSizes={[20, 20]}
          storageKey={LAYOUT_STORAGE.vertical}
        >
          <ResizableSplit
            direction="horizontal"
            className="h-full"
            defaultSizes={[25, 25, 50]}
            minSizes={[12, 12, 25]}
            storageKey={LAYOUT_STORAGE.horizontal}
          >
            <Panel title={t("program.panels.schedule")} className="h-full">
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
                  {showMediaControls ? (
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
              <PreviewConsole preview={preview} mediaRef={consoleMediaRef} />
            </Panel>
          </ResizableSplit>

          <section className="h-full min-h-0 min-w-0 bg-[rgba(29,32,34,0.5)] border border-[rgba(69,70,77,0.35)] rounded-lg flex flex-col overflow-hidden">
            <div className="shrink-0 flex items-center gap-2 px-3 sm:px-4 py-3 border-b border-[rgba(69,70,77,0.25)] overflow-x-auto">
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
          </section>
        </ResizableSplit>
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
