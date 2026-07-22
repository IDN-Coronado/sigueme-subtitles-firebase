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
import { IconPlus } from "../components/Icons";
import NewSongModal from "../components/Song/NewSongModal";
import SlideUploadModal from "../components/SlideUploadModal";
import NewThemeModal from "../components/Theme/NewThemeModal";
import Panel from "../components/Program/Panel";
import ScheduleItemRow from "../components/Program/ScheduleItemRow";
import PreviewPanel from "../components/Program/PreviewPanel";
import PreviewConsole from "../components/Program/PreviewConsole";
import MediaConsoleControls from "../components/Program/MediaConsoleControls";
import ResourceBrowser from "../components/Program/ResourceBrowser";
import ProgramHeader from "../components/Program/ProgramHeader";
import { RESOURCE_TABS } from "../components/Program/constants";

const CAPTION_COLLECTION = "caption";
const CAPTION_DOC = "caption";

async function setCaption(caption) {
  await setDoc(
    doc(db, CAPTION_COLLECTION, CAPTION_DOC),
    { caption },
    { merge: true }
  );
}

function Program() {
  const { programId } = useParams();
  const resourcesRef = useRef(null);
  const consoleMediaRef = useRef(null);
  const [resourceTab, setResourceTab] = useState("songs");
  const [createModal, setCreateModal] = useState(null);

  const { songs, addSong } = useSongs();
  const { themes, addTheme } = useThemes();
  const { media, uploadMedia } = useMedia();
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

  const handleCreateSong = async ({ title, body }) => {
    await addSong(title, body);
  };

  const handleCreateMedia = async ({ file, title }) => {
    try {
      await uploadMedia({ file, title });
      closeCreateModal();
    } catch {
      alert("Error al subir el archivo.");
    }
  };

  const handleCreateTheme = async ({ title, storagePath, file }) => {
    try {
      await addTheme({ title, storagePath, file });
    } catch {
      alert("Error al subir el archivo o guardar el tema.");
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

  const handleClear = async () => {
    await Promise.all([setCaption(""), clearPreviewResource()]);
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
        isActive={!!program?.active}
        onActivate={() => activateProgram(programId)}
        onClear={handleClear}
      />

      <main
        className="min-h-0 min-w-0 p-4 sm:p-5 overflow-hidden"
        style={{
          flex: "1 1 0%",
          display: "grid",
          gridTemplateRows: "minmax(0, 1fr) minmax(0, 1fr)",
          gap: "1rem",
        }}
      >
        <div
          className="min-h-0 min-w-0 overflow-hidden gap-4"
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(12, minmax(0, 1fr))",
          }}
        >
          <Panel
            title="Schedule"
            className="min-h-0"
            style={{ gridColumn: "span 3" }}
            action={
              <button
                type="button"
                title="Ir a recursos"
                className="text-[#e0e3e5] hover:text-[#7bd0ff] transition-colors"
                onClick={() =>
                  resourcesRef.current?.scrollIntoView({
                    behavior: "smooth",
                    block: "nearest",
                  })
                }
              >
                <IconPlus color="currentColor" />
              </button>
            }
          >
            <div className="flex flex-col gap-2">
              {!hydrated && (
                <p className="text-[#6b7280] text-sm">Cargando…</p>
              )}
              {hydrated && schedule.length === 0 && (
                <p className="text-[#6b7280] text-sm px-1">
                  Aún no hay elementos. Usa el panel de recursos abajo.
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
                    onRemove={removeItem}
                  />
                );
              })}
            </div>
          </Panel>

          <Panel
            title="Preview"
            className="min-h-0"
            style={{ gridColumn: "span 3" }}
          >
            <PreviewPanel
              item={selectedItem}
              songs={songs}
              preview={preview}
              onSelect={handlePreviewSelect}
            />
          </Panel>

          <Panel
            title="Console"
            className="min-h-0"
            style={{ gridColumn: "span 6" }}
            action={
              showMediaControls ? (
                <MediaConsoleControls
                  mediaRef={consoleMediaRef}
                  mediaKey={consoleMedia.url}
                />
              ) : null
            }
          >
            <PreviewConsole preview={preview} mediaRef={consoleMediaRef} />
          </Panel>
        </div>

        <section
          ref={resourcesRef}
          className="min-h-0 min-w-0 bg-[rgba(29,32,34,0.5)] border border-[rgba(69,70,77,0.35)] rounded-lg flex flex-col overflow-hidden"
        >
          <div className="shrink-0 flex items-center gap-2 px-3 sm:px-4 py-3 border-b border-[rgba(69,70,77,0.25)] overflow-x-auto">
            {RESOURCE_TABS.map((t) => (
              <button
                key={t.id}
                type="button"
                onClick={() => setResourceTab(t.id)}
                className={`px-4 py-2 rounded-sm text-sm font-medium whitespace-nowrap transition-colors ${
                  resourceTab === t.id
                    ? "bg-[#323537] text-[#e0e3e5]"
                    : "bg-[rgba(50,53,55,0.35)] text-[#c6c6cd] hover:text-[#e0e3e5]"
                }`}
              >
                {t.label}
              </button>
            ))}
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
              onCreateSong={() => setCreateModal("song")}
              onCreateMedia={() => setCreateModal("media")}
              onCreateTheme={() => setCreateModal("theme")}
            />
          </div>
        </section>
      </main>

      <NewSongModal
        isOpen={createModal === "song"}
        onClose={closeCreateModal}
        onSubmit={handleCreateSong}
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
    </div>
  );
}

export default Program;
