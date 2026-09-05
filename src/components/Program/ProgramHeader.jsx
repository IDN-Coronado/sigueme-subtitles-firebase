import { Link } from "react-router-dom";
import { ChevronDown } from "lucide-react";

import { MONO } from "./constants";
import openLiveView, { closeLiveView } from "../../utils/openLiveView";
import useLiveViewOpen from "../../hooks/useLiveViewOpen";
import { t, formatProgramDate } from "../../i18n";

function ProgramHeader({
  title,
  date,
  isActive,
  onActivate,
  onClear,
  onShowLogo,
  onBlackScreen,
  clearDisabled = false,
}) {
  const liveOpen = useLiveViewOpen();

  const handleLiveView = () => {
    openLiveView().catch(() => {});
  };

  const formattedDate = formatProgramDate(date);

  return (
    <header className="shrink-0 z-10 h-14 sm:h-16 bg-[#0D1117] border-b border-[rgba(255,255,255,0.08)] flex items-center justify-between gap-3 px-4 sm:px-6">
      {/* Left: logo + program info */}
      <div className="flex items-center gap-3 min-w-0">
        <Link
          to="/"
          className="shrink-0 w-8 h-8 rounded-lg bg-[#6366F1] flex items-center justify-center text-white font-bold text-sm hover:bg-[#7C83FF] transition-colors"
          title={t("program.home")}
        >
          A
        </Link>
        <span className="hidden sm:block text-[#F8FAFC] font-semibold text-sm">
          Apostello
        </span>
        <div className="w-px h-5 bg-[rgba(255,255,255,0.15)] shrink-0" />
        <div className="min-w-0 flex items-center gap-2">
          <button
            type="button"
            className="inline-flex items-center gap-1.5 min-w-0 group"
            title={title}
          >
            <span className="text-[#F8FAFC] text-sm font-medium truncate max-w-[160px] sm:max-w-xs">
              {title || t("program.untitled")}
            </span>
            <ChevronDown size={14} className="text-[#9AA3B2] shrink-0 group-hover:text-[#6366F1] transition-colors" />
          </button>
          {formattedDate && (
            <p className="hidden sm:block text-[#9AA3B2] text-[10px] tracking-[0.06em] whitespace-nowrap" style={MONO}>
              {formattedDate}
            </p>
          )}
          {isActive && (
            <span className="shrink-0 inline-flex items-center gap-1.5 bg-[rgba(99,102,241,0.2)] text-[#7C83FF] text-[9px] font-semibold tracking-[0.1em] uppercase px-2 py-0.5 rounded-full">
              <span className="w-1.5 h-1.5 rounded-full bg-[#6366F1] animate-pulse" />
              {t("program.active")}
            </span>
          )}
        </div>
      </div>

      {/* Right: actions */}
      <div className="flex items-center gap-2 shrink-0">
        <button
          type="button"
          onClick={onBlackScreen}
          className="hidden sm:inline-flex items-center gap-1.5 text-[#9AA3B2] text-xs font-medium border border-[rgba(255,255,255,0.1)] px-3 py-1.5 rounded-lg hover:border-[rgba(255,255,255,0.2)] hover:text-[#F8FAFC] transition-colors"
          title={t("program.blackScreen")}
        >
          <span className="inline-block w-2.5 h-2.5 rounded-sm bg-black border border-[rgba(255,255,255,0.2)]" />
          {t("program.blackScreen")}
        </button>
        <button
          type="button"
          onClick={onClear}
          disabled={clearDisabled}
          className="text-[#9AA3B2] text-xs font-medium border border-[rgba(255,255,255,0.1)] px-3 py-1.5 rounded-lg hover:border-[#EF4444] hover:text-[#EF4444] transition-colors disabled:opacity-40 disabled:pointer-events-none"
        >
          {t("program.clear")}
        </button>
        <button
          type="button"
          onClick={onShowLogo}
          className="text-[#9AA3B2] text-xs font-medium border border-[rgba(255,255,255,0.1)] px-3 py-1.5 rounded-lg hover:border-[#6366F1] hover:text-[#7C83FF] transition-colors"
          title={t("program.showLogo")}
        >
          {t("program.logo")}
        </button>
        {!isActive && (
          <button
            type="button"
            onClick={onActivate}
            className="hidden sm:inline-flex text-[#9AA3B2] text-xs font-medium border border-[rgba(255,255,255,0.1)] px-3 py-1.5 rounded-lg hover:border-[#6366F1] hover:text-[#7C83FF] transition-colors"
          >
            {t("program.activate")}
          </button>
        )}
        <button
          type="button"
          onClick={liveOpen ? closeLiveView : handleLiveView}
          className={`inline-flex items-center gap-2 text-xs font-semibold border px-3 py-1.5 rounded-lg transition-colors ${
            liveOpen
              ? "text-[#7C83FF] border-[rgba(99,102,241,0.4)] hover:bg-[rgba(239,68,68,0.12)] hover:border-[#EF4444] hover:text-[#EF4444]"
              : "text-[#7C83FF] border-[rgba(99,102,241,0.4)] bg-[rgba(99,102,241,0.1)] hover:bg-[rgba(99,102,241,0.18)]"
          }`}
          title={liveOpen ? t("program.closeLiveView") : t("program.openLiveView")}
          aria-label={liveOpen ? t("program.closeLiveView") : t("program.openLiveView")}
        >
          {t("program.liveView")}
          <span className="inline-flex w-3.5 h-3.5 items-center justify-center shrink-0">
            {liveOpen ? (
              <svg width="14" height="14" viewBox="0 0 14 14" fill="none" aria-hidden>
                <path d="M3.5 3.5l7 7M10.5 3.5l-7 7" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
              </svg>
            ) : (
              <svg width="14" height="14" viewBox="0 0 14 14" fill="none" aria-hidden className="opacity-80">
                <path d="M5.5 2.5H2.5A1 1 0 0 0 1.5 3.5v8a1 1 0 0 0 1 1h8a1 1 0 0 0 1-1V8.5" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round" />
                <path d="M8.5 1.5h4v4M12.5 1.5L7 7" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
            )}
          </span>
        </button>
      </div>
    </header>
  );
}

export default ProgramHeader;
