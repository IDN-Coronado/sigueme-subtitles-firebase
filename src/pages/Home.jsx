import { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
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
import { t, formatProgramDate } from "../i18n";

const MONO = { fontFamily: "JetBrains Mono, monospace" };

const MENU_ITEMS = [
  {
    id: "new-program",
    labelKey: "home.menu.newProgram",
    descriptionKey: "home.menu.newProgramDesc",
    iconBg: "#6366F1",
    iconColor: "#fff",
  },
  {
    id: "manage-programs",
    labelKey: "home.menu.openProgram",
    descriptionKey: "home.menu.openProgramDesc",
    iconBg: "rgba(139,92,246,0.25)",
    iconColor: "#A78BFA",
  },
  {
    id: "new-song",
    labelKey: "home.menu.newSong",
    descriptionKey: "home.menu.newSongDesc",
    iconBg: "rgba(20,184,166,0.2)",
    iconColor: "#2DD4BF",
  },
  {
    id: "upload-file",
    labelKey: "home.menu.uploadFile",
    descriptionKey: "home.menu.uploadFileDesc",
    iconBg: "rgba(34,197,94,0.2)",
    iconColor: "#4ADE80",
  },
  {
    id: "upload-theme",
    labelKey: "home.menu.uploadTheme",
    descriptionKey: "home.menu.uploadThemeDesc",
    iconBg: "rgba(245,158,11,0.2)",
    iconColor: "#FCD34D",
  },
  {
    id: "settings",
    labelKey: "home.menu.settings",
    descriptionKey: "home.menu.settingsDesc",
    iconBg: "rgba(99,102,241,0.2)",
    iconColor: "#818CF8",
  },
];

function MenuIcon({ id, color }) {
  const stroke = color || "currentColor";
  if (id === "new-program") {
    return (
      <svg width="20" height="20" viewBox="0 0 22 22" fill="none" aria-hidden>
        <rect x="3" y="4" width="16" height="14" rx="2" stroke={stroke} strokeWidth="1.6" />
        <path d="M11 8v6M8 11h6" stroke={stroke} strokeWidth="1.6" strokeLinecap="round" />
      </svg>
    );
  }
  if (id === "manage-programs") {
    return (
      <svg width="20" height="20" viewBox="0 0 22 22" fill="none" aria-hidden>
        <path
          d="M3 7.5A2.5 2.5 0 0 1 5.5 5H9l2 2h5.5A2.5 2.5 0 0 1 19 9.5v6A2.5 2.5 0 0 1 16.5 18h-11A2.5 2.5 0 0 1 3 15.5v-8z"
          stroke={stroke} strokeWidth="1.6" strokeLinejoin="round"
        />
      </svg>
    );
  }
  if (id === "new-song") {
    return (
      <svg width="20" height="20" viewBox="0 0 22 22" fill="none" aria-hidden>
        <path d="M9 16V6l9-2v10" stroke={stroke} strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" />
        <circle cx="7" cy="16" r="2.5" stroke={stroke} strokeWidth="1.6" />
        <circle cx="16" cy="14" r="2.5" stroke={stroke} strokeWidth="1.6" />
      </svg>
    );
  }
  if (id === "upload-file") {
    return (
      <svg width="20" height="20" viewBox="0 0 22 22" fill="none" aria-hidden>
        <path d="M11 14V4M7 8l4-4 4 4" stroke={stroke} strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" />
        <path d="M4 14v2.5A1.5 1.5 0 0 0 5.5 18h11a1.5 1.5 0 0 0 1.5-1.5V14" stroke={stroke} strokeWidth="1.6" strokeLinecap="round" />
      </svg>
    );
  }
  if (id === "upload-theme") {
    return (
      <svg width="20" height="20" viewBox="0 0 22 22" fill="none" aria-hidden>
        <rect x="2" y="4" width="18" height="14" rx="2" stroke={stroke} strokeWidth="1.6" />
        <path d="M11 4v14" stroke={stroke} strokeWidth="1.6" strokeLinecap="round" />
      </svg>
    );
  }
  return (
    <svg width="20" height="20" viewBox="0 0 22 22" fill="none" aria-hidden>
      <circle cx="11" cy="11" r="3" stroke={stroke} strokeWidth="1.6" />
      <path d="M11 2v2M11 18v2M2 11h2M18 11h2M4.22 4.22l1.42 1.42M16.36 16.36l1.42 1.42M4.22 17.78l1.42-1.42M16.36 5.64l1.42-1.42" stroke={stroke} strokeWidth="1.4" strokeLinecap="round" />
    </svg>
  );
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
      <div className="h-full overflow-y-auto flex flex-col bg-[#090B12] relative">
        {/* Atmosphere */}
        <svg
          className="pointer-events-none absolute inset-0 w-full h-full"
          xmlns="http://www.w3.org/2000/svg"
          aria-hidden
        >
          <defs>
            {/* gradiente izquierda→derecha para curvas bottom-left */}
            <linearGradient id="cg1" x1="0%" y1="0%" x2="100%" y2="0%">
              <stop offset="0%" stopColor="#6366F1" stopOpacity="0.9"/>
              <stop offset="55%" stopColor="#818CF8" stopOpacity="0.5"/>
              <stop offset="100%" stopColor="#00D4FF" stopOpacity="0"/>
            </linearGradient>
            {/* gradiente derecha→izquierda para curvas top-right */}
            <linearGradient id="cg2" x1="100%" y1="0%" x2="0%" y2="0%">
              <stop offset="0%" stopColor="#6366F1" stopOpacity="0.9"/>
              <stop offset="55%" stopColor="#818CF8" stopOpacity="0.5"/>
              <stop offset="100%" stopColor="#00D4FF" stopOpacity="0"/>
            </linearGradient>
            {/* glow radial bottom-left */}
            <radialGradient id="gl1" cx="0%" cy="100%" r="55%">
              <stop offset="0%" stopColor="#6366F1" stopOpacity="0.18"/>
              <stop offset="100%" stopColor="#6366F1" stopOpacity="0"/>
            </radialGradient>
            {/* glow radial top-right */}
            <radialGradient id="gl2" cx="100%" cy="0%" r="50%">
              <stop offset="0%" stopColor="#6366F1" stopOpacity="0.15"/>
              <stop offset="100%" stopColor="#6366F1" stopOpacity="0"/>
            </radialGradient>
          </defs>
          {/* glows */}
          <rect width="100%" height="100%" fill="url(#gl1)"/>
          <rect width="100%" height="100%" fill="url(#gl2)"/>
          {/* curvas bottom-left: usan % via userSpaceOnUse no disponible en SVG estático, usamos valores absolutos grandes */}
          {/* Se dibujan en coordenadas 0-1000 y el SVG las escala */}
          <svg viewBox="0 0 1440 900" preserveAspectRatio="xMidYMid slice" width="100%" height="100%">
            {/* bottom-left lines */}
            <path d="M-20 820 C180 680 400 740 640 640 S980 520 1100 440" stroke="url(#cg1)" strokeWidth="1.5" fill="none"/>
            <path d="M-20 870 C200 720 420 780 660 680 S1000 560 1120 480" stroke="url(#cg1)" strokeWidth="1" fill="none" opacity="0.6"/>
            <path d="M-20 920 C220 760 440 820 680 720 S1020 600 1140 520" stroke="url(#cg1)" strokeWidth="0.7" fill="none" opacity="0.35"/>
            {/* top-right lines */}
            <path d="M1460 80 C1260 220 1040 160 800 260 S460 380 340 460" stroke="url(#cg2)" strokeWidth="1.5" fill="none"/>
            <path d="M1460 30 C1240 170 1020 110 780 210 S440 330 320 410" stroke="url(#cg2)" strokeWidth="1" fill="none" opacity="0.6"/>
          </svg>
        </svg>

        {/* Header */}
        <header className="relative z-10 h-14 sm:h-16 border-b border-[rgba(255,255,255,0.06)] flex items-center justify-between px-5 sm:px-8 shrink-0">
          {/* Left: logo + tagline */}
          <div className="flex items-center gap-3 min-w-0">
            <div className="w-8 h-8 rounded-lg bg-[#6366F1] flex items-center justify-center text-white font-bold text-sm shrink-0">
              A
            </div>
            <span className="text-[#F8FAFC] font-semibold text-sm hidden sm:block">
              Apostello
            </span>
            <div className="hidden sm:flex items-center gap-1.5 text-[#9AA3B2]">
              <span className="w-1 h-1 rounded-full bg-[#9AA3B2]" />
              <Link
                to="/live"
                className="text-[10px] tracking-[0.1em] uppercase hover:text-[#F8FAFC] transition-colors"
                style={MONO}
              >
                {t("home.tagline")}
              </Link>
            </div>
          </div>

          {/* Right: active program card */}
          {activeProgram && (
            <button
              type="button"
              onClick={() => navigate(`/program/${activeProgram.id}`)}
              className="inline-flex items-center gap-3 text-left border border-[rgba(255,255,255,0.08)] bg-[#111521] px-3 py-2 rounded-xl hover:border-[rgba(99,102,241,0.4)] hover:bg-[#171C2B] transition-colors group"
              title={t("home.openActiveProgram")}
            >
              <span className="shrink-0 w-9 h-9 rounded-lg bg-[#171C2B] border border-[rgba(255,255,255,0.08)] flex items-center justify-center text-[#9AA3B2] group-hover:text-[#7C83FF] transition-colors">
                <svg width="16" height="16" viewBox="0 0 22 22" fill="none" aria-hidden>
                  <rect x="2" y="4" width="18" height="14" rx="2" stroke="currentColor" strokeWidth="1.6" />
                  <circle cx="11" cy="11" r="2.5" stroke="currentColor" strokeWidth="1.4" />
                </svg>
              </span>
              <span className="min-w-0 flex flex-col gap-0.5">
                <span className="flex items-center gap-2 min-w-0">
                  <span className="text-[#F8FAFC] text-sm font-semibold truncate leading-tight max-w-[160px]">
                    {activeProgram.title || t("home.activeProgramFallback")}
                  </span>
                  <span className="shrink-0 inline-flex items-center gap-1 text-[#4ADE80] text-[10px] font-semibold tracking-[0.08em] uppercase">
                    <span className="w-1.5 h-1.5 rounded-full bg-[#4ADE80] animate-pulse" />
                    {t("program.active")}
                  </span>
                </span>
                <span
                  className="flex items-center gap-1.5 text-[#9AA3B2] text-[10px] tracking-[0.06em] uppercase truncate"
                  style={MONO}
                >
                  {activeProgramDate && <span>{activeProgramDate}</span>}
                  {activeProgramDate && activeScheduleCount > 0 && <span>·</span>}
                  {activeScheduleCount > 0 && (
                    <span>
                      {activeScheduleCount === 1
                        ? t("home.activeProgramItem", { count: activeScheduleCount })
                        : t("home.activeProgramItems", { count: activeScheduleCount })}
                    </span>
                  )}
                </span>
              </span>
            </button>
          )}
        </header>

        {/* Main */}
        <main className="relative z-10 flex-1 flex items-center justify-center p-5 sm:p-8">
          <div className="w-full max-w-2xl">
            {/* Title */}
            <div className="mb-6 sm:mb-8">
              <p
                className="text-[#6366F1] text-[10px] tracking-[0.16em] uppercase mb-2.5 font-semibold"
                style={MONO}
              >
                {t("home.fileMenu")}
              </p>
              <h1 className="text-[#F8FAFC] font-bold text-3xl sm:text-4xl tracking-tight leading-tight">
                Apostello
              </h1>
              <p className="text-[#9AA3B2] text-sm sm:text-base mt-1.5">
                {t("home.subtitle")}
              </p>
            </div>

            {/* Menu */}
            <nav
              className="bg-[#111521] border border-[rgba(255,255,255,0.08)] rounded-xl overflow-hidden"
              aria-label={t("home.mainActionsAria")}
            >
              {MENU_ITEMS.map((item, index) => (
                <button
                  key={item.id}
                  type="button"
                  onClick={() => setModal(item.id)}
                  className={`w-full flex items-center gap-4 px-4 py-3.5 text-left transition-all hover:bg-[#1E2540] group ${
                    index > 0 ? "border-t border-[rgba(255,255,255,0.05)]" : ""
                  } ${index === 0 ? "border border-[rgba(99,102,241,0.5)] bg-[rgba(99,102,241,0.08)] rounded-t-xl" : ""}`}
                >
                  <span
                    className="w-10 h-10 rounded-lg flex items-center justify-center shrink-0"
                    style={{ background: item.iconBg }}
                  >
                    <MenuIcon id={item.id} color={item.iconColor} />
                  </span>
                  <span className="flex-1 min-w-0">
                    <span className="block text-[#F8FAFC] font-semibold text-sm">
                      {t(item.labelKey)}
                    </span>
                    <span className="block text-[#9AA3B2] text-xs mt-0.5 truncate">
                      {t(item.descriptionKey)}
                    </span>
                  </span>
                  <svg width="16" height="16" viewBox="0 0 16 16" fill="none" aria-hidden className="text-[#9AA3B2] group-hover:text-[#7C83FF] transition-colors shrink-0">
                    <path d="M6 4l4 4-4 4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
                  </svg>
                </button>
              ))}
            </nav>
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
