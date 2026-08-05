import { useState } from "react";
import { useNavigate } from "react-router-dom";
import dayjs from "dayjs";

import usePrograms from "../firebase/usePrograms";
import useSongs from "../firebase/useSongs";
import useThemes from "../firebase/useThemes";
import useMedia from "../firebase/useMedia";

import NewProgramModal from "../components/Program/NewProgramModal";
import OpenProgramModal from "../components/Program/OpenProgramModal";
import NewSongModal from "../components/Song/NewSongModal";
import SlideUploadModal from "../components/SlideUploadModal";
import NewThemeModal from "../components/Theme/NewThemeModal";
import GlobalSettingsModal from "../components/GlobalSettingsModal";
import { IconGear, IconMedia } from "../components/Icons";
import { t, formatProgramDate } from "../i18n";

const MONO = { fontFamily: "JetBrains Mono, monospace" };

const MENU_ITEMS = [
  {
    id: "new-program",
    labelKey: "home.menu.newProgram",
    descriptionKey: "home.menu.newProgramDesc",
    shortcut: "Ctrl+N",
  },
  {
    id: "manage-programs",
    labelKey: "home.menu.openProgram",
    descriptionKey: "home.menu.openProgramDesc",
    shortcut: "Ctrl+O",
  },
  {
    id: "new-song",
    labelKey: "home.menu.newSong",
    descriptionKey: "home.menu.newSongDesc",
    shortcut: null,
  },
  {
    id: "upload-file",
    labelKey: "home.menu.uploadFile",
    descriptionKey: "home.menu.uploadFileDesc",
    shortcut: null,
  },
  {
    id: "upload-theme",
    labelKey: "home.menu.uploadTheme",
    descriptionKey: "home.menu.uploadThemeDesc",
    shortcut: null,
  },
  {
    id: "settings",
    labelKey: "home.menu.settings",
    descriptionKey: "home.menu.settingsDesc",
    shortcut: null,
  },
];

function MenuIcon({ id }) {
  const stroke = "currentColor";
  if (id === "new-program") {
    return (
      <svg width="22" height="22" viewBox="0 0 22 22" fill="none" aria-hidden>
        <rect x="3" y="4" width="16" height="14" rx="2" stroke={stroke} strokeWidth="1.5" />
        <path d="M11 8v6M8 11h6" stroke={stroke} strokeWidth="1.5" strokeLinecap="round" />
      </svg>
    );
  }
  if (id === "manage-programs") {
    return (
      <svg width="22" height="22" viewBox="0 0 22 22" fill="none" aria-hidden>
        <path
          d="M3 7.5A2.5 2.5 0 0 1 5.5 5H9l2 2h5.5A2.5 2.5 0 0 1 19 9.5v6A2.5 2.5 0 0 1 16.5 18h-11A2.5 2.5 0 0 1 3 15.5v-8z"
          stroke={stroke}
          strokeWidth="1.5"
          strokeLinejoin="round"
        />
      </svg>
    );
  }
  if (id === "new-song") {
    return (
      <svg width="22" height="22" viewBox="0 0 22 22" fill="none" aria-hidden>
        <path
          d="M9 16V6l9-2v10"
          stroke={stroke}
          strokeWidth="1.5"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
        <circle cx="7" cy="16" r="2.5" stroke={stroke} strokeWidth="1.5" />
        <circle cx="16" cy="14" r="2.5" stroke={stroke} strokeWidth="1.5" />
      </svg>
    );
  }
  if (id === "upload-file") {
    return (
      <svg width="22" height="22" viewBox="0 0 22 22" fill="none" aria-hidden>
        <path
          d="M11 14V4M7 8l4-4 4 4"
          stroke={stroke}
          strokeWidth="1.5"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
        <path
          d="M4 14v2.5A1.5 1.5 0 0 0 5.5 18h11a1.5 1.5 0 0 0 1.5-1.5V14"
          stroke={stroke}
          strokeWidth="1.5"
          strokeLinecap="round"
        />
      </svg>
    );
  }
  if (id === "upload-theme") {
    return (
      <svg width="22" height="22" viewBox="0 0 22 22" fill="none" aria-hidden>
        <rect x="2" y="4" width="18" height="14" rx="2" stroke={stroke} strokeWidth="1.5" />
        <path d="M11 4v14" stroke={stroke} strokeWidth="1.5" strokeLinecap="round" />
      </svg>
    );
  }
  // settings
  return <IconGear color="currentColor" />;
}

function Home() {
  const navigate = useNavigate();
  const { programs, addProgram, removeProgram } = usePrograms();
  const { addSong } = useSongs();
  const { addTheme } = useThemes();
  const { uploadMedia } = useMedia();

  const [modal, setModal] = useState(null); // 'new-program' | 'manage-programs' | 'new-song' | 'upload-file' | 'upload-theme' | 'settings'

  const closeModal = () => setModal(null);

  const handleCreateProgram = async ({ date, title }) => {
    const jsDate = date.toDate();
    const docRef = await addProgram({ date: jsDate, title });
    closeModal();
    navigate(`/program/${docRef.id}`);
  };

  const handleOpenProgram = (program) => {
    closeModal();
    navigate(`/program/${program.id}`);
  };

  const handleDeleteProgram = async (program) => {
    try {
      await removeProgram(program.id);
    } catch {
      alert(t("errors.deleteResource"));
    }
  };

  const handleCreateSong = async ({ title, sections }) => {
    await addSong(title, sections);
  };

  const handleUploadFile = async ({ file, title }) => {
    try {
      await uploadMedia({ file, title });
      closeModal();
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

  const activeProgram = programs.find((p) => p.active);
  const activeProgramDate = activeProgram
    ? formatProgramDate(activeProgram.date)
    : "";
  const activeScheduleCount = activeProgram
    ? Array.isArray(activeProgram.schedule)
      ? activeProgram.schedule.filter((item) => item.type !== "theme").length
      : (activeProgram.songs?.length || 0) + (activeProgram.slides?.length || 0)
    : 0;

  return (
    <>
      <div className="h-full overflow-y-auto flex flex-col bg-[#101415] relative">
        {/* Atmosphere */}
        <div
          className="pointer-events-none absolute inset-0"
          style={{
            background:
              "radial-gradient(ellipse 80% 50% at 20% 0%, rgba(123,208,255,0.08) 0%, transparent 55%), radial-gradient(ellipse 60% 40% at 90% 100%, rgba(0,166,224,0.06) 0%, transparent 50%)",
          }}
        />
        <div
          className="pointer-events-none absolute inset-0 opacity-[0.035]"
          style={{
            backgroundImage:
              "linear-gradient(rgba(224,227,229,0.5) 1px, transparent 1px), linear-gradient(90deg, rgba(224,227,229,0.5) 1px, transparent 1px)",
            backgroundSize: "48px 48px",
          }}
        />

        <header className="relative z-10 h-14 sm:h-16 border-b border-[rgba(69,70,77,0.3)] flex items-center justify-between px-5 sm:px-8 shrink-0">
          <div className="flex items-baseline gap-3 min-w-0">
            <span className="text-[#e0e3e5] font-bold text-lg sm:text-xl tracking-tight truncate">
              Presenter Pro
            </span>
            <span
              className="hidden sm:inline text-[#6b7280] text-[10px] tracking-[0.12em] uppercase"
              style={MONO}
            >
              {t("home.tagline")}
            </span>
          </div>
          <div className="flex items-center gap-3 shrink-0 min-w-0">
            {activeProgram && (
              <button
                type="button"
                onClick={() => navigate(`/program/${activeProgram.id}`)}
                className="inline-flex items-center gap-3 max-w-full text-left border border-[rgba(123,208,255,0.28)] bg-[rgba(123,208,255,0.06)] px-3 py-1.5 rounded-sm hover:border-[#7bd0ff] hover:bg-[rgba(123,208,255,0.1)] transition-colors group"
                title={t("home.openActiveProgram")}
              >
                <span className="shrink-0 w-8 h-8 rounded-sm bg-[rgba(0,166,224,0.18)] border border-[rgba(123,208,255,0.35)] flex items-center justify-center text-[#7bd0ff] group-hover:border-[#7bd0ff]">
                  <IconMedia color="currentColor" />
                </span>
                <span className="min-w-0 flex flex-col gap-0.5">
                  <span className="flex items-center gap-2 min-w-0">
                    <span className="text-[#e0e3e5] text-sm font-semibold truncate leading-tight">
                      {activeProgram.title || t("home.activeProgramFallback")}
                    </span>
                    <span
                      className="shrink-0 inline-flex items-center gap-1.5 bg-[rgba(0,166,224,0.2)] text-[#7bd0ff] text-[10px] font-medium tracking-[0.08em] uppercase px-1.5 py-0.5 rounded-sm"
                      style={MONO}
                    >
                      <span className="w-1.5 h-1.5 rounded-full bg-[#7bd0ff] animate-pulse" />
                      {t("program.active")}
                    </span>
                  </span>
                  <span
                    className="flex items-center gap-2 text-[#6b7280] text-[10px] tracking-[0.06em] uppercase truncate"
                    style={MONO}
                  >
                    {activeProgramDate && <span>{activeProgramDate}</span>}
                    {activeProgramDate && activeScheduleCount > 0 && (
                      <span className="text-[#45464d]">·</span>
                    )}
                    {activeScheduleCount > 0 && (
                      <span>
                        {activeScheduleCount === 1
                          ? t("home.activeProgramItem", {
                              count: activeScheduleCount,
                            })
                          : t("home.activeProgramItems", {
                              count: activeScheduleCount,
                            })}
                      </span>
                    )}
                  </span>
                </span>
              </button>
            )}
          </div>
        </header>

        <main className="relative z-10 flex-1 flex items-center justify-center p-5 sm:p-8">
          <div className="w-full max-w-3xl">
            <div className="mb-8 sm:mb-10">
              <p
                className="text-[#7bd0ff] text-xs tracking-[0.14em] uppercase mb-3"
                style={MONO}
              >
                {t("home.fileMenu")}
              </p>
              <h1 className="text-[#e0e3e5] font-bold text-3xl sm:text-4xl tracking-tight leading-tight">
                Presenter Pro
              </h1>
              <p className="text-[#c6c6cd] text-base sm:text-lg mt-2 truncate">
                {t("home.subtitle")}
              </p>
            </div>

            <nav
              className="bg-[rgba(29,32,34,0.65)] border border-[rgba(69,70,77,0.4)] rounded-lg overflow-hidden backdrop-blur-sm"
              aria-label={t("home.mainActionsAria")}
            >
              {MENU_ITEMS.map((item, index) => (
                <button
                  key={item.id}
                  type="button"
                  onClick={() => setModal(item.id)}
                  className={`w-full flex items-center gap-4 px-4 sm:px-5 py-3.5 sm:py-4 text-left transition-colors hover:bg-[rgba(123,208,255,0.08)] group ${
                    index > 0 ? "border-t border-[rgba(69,70,77,0.3)]" : ""
                  }`}
                >
                  <span className="w-10 h-10 rounded-sm bg-[rgba(50,53,55,0.5)] border border-[rgba(69,70,77,0.35)] flex items-center justify-center text-[#c6c6cd] group-hover:text-[#7bd0ff] group-hover:border-[rgba(123,208,255,0.35)] transition-colors shrink-0">
                    <MenuIcon id={item.id} />
                  </span>
                  <span className="flex-1 min-w-0">
                    <span className="block text-[#e0e3e5] font-semibold text-sm sm:text-base">
                      {t(item.labelKey)}
                    </span>
                    <span className="block text-[#6b7280] text-xs sm:text-sm mt-0.5 truncate">
                      {t(item.descriptionKey)}
                    </span>
                  </span>
                  {item.shortcut && (
                    <span
                      className="hidden sm:inline text-[#45464d] text-[10px] tracking-[0.06em] shrink-0"
                      style={MONO}
                    >
                      {item.shortcut}
                    </span>
                  )}
                </button>
              ))}
            </nav>

            {programs.length > 0 && (
              <div className="mt-8">
                <p
                  className="text-[#6b7280] text-[10px] tracking-[0.1em] uppercase mb-3"
                  style={MONO}
                >
                  {t("home.recent")}
                </p>
                <div className="flex flex-col gap-1">
                  {programs.slice(0, 3).map((program) => {
                    const dateLabel = program.date?.toDate
                      ? dayjs(program.date.toDate()).format("D MMM YYYY")
                      : "";
                    return (
                      <button
                        key={program.id}
                        type="button"
                        onClick={() => navigate(`/program/${program.id}`)}
                        className="flex items-center justify-between gap-3 px-3 py-2 rounded-sm text-left hover:bg-[rgba(50,53,55,0.35)] transition-colors"
                      >
                        <span className="flex items-center gap-2 min-w-0">
                          <span className="text-[#c6c6cd] text-sm truncate">
                            {program.title || t("program.untitled")}
                          </span>
                          {program.active && (
                            <span
                              className="shrink-0 inline-flex items-center gap-1.5 bg-[rgba(0,166,224,0.2)] text-[#7bd0ff] text-[10px] font-medium tracking-[0.08em] uppercase px-1.5 py-0.5 rounded-sm"
                              style={MONO}
                            >
                              <span className="w-1.5 h-1.5 rounded-full bg-[#7bd0ff] animate-pulse" />
                              {t("program.active")}
                            </span>
                          )}
                        </span>
                        <span className="text-[#45464d] text-xs shrink-0" style={MONO}>
                          {dateLabel}
                        </span>
                      </button>
                    );
                  })}
                </div>
              </div>
            )}
          </div>
        </main>
      </div>

      <NewProgramModal
        isOpen={modal === "new-program"}
        onCancel={closeModal}
        onSubmit={handleCreateProgram}
      />
      <OpenProgramModal
        isOpen={modal === "manage-programs"}
        onClose={closeModal}
        programs={programs}
        onSelect={handleOpenProgram}
        onDelete={handleDeleteProgram}
      />
      <NewSongModal
        isOpen={modal === "new-song"}
        onClose={closeModal}
        onSubmit={handleCreateSong}
      />
      <SlideUploadModal
        isOpen={modal === "upload-file"}
        onClose={closeModal}
        onUpload={handleUploadFile}
      />
      <NewThemeModal
        isVisible={modal === "upload-theme"}
        onClose={closeModal}
        onSubmit={handleCreateTheme}
      />
      <GlobalSettingsModal
        isOpen={modal === "settings"}
        onClose={closeModal}
      />
    </>
  );
}

export default Home;
