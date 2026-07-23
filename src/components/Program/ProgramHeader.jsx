import { Link } from "react-router-dom";

import { MONO } from "./constants";
import openLiveView from "../../utils/openLiveView";
import { t, formatProgramDate } from "../../i18n";

function ProgramHeader({
  title,
  date,
  isActive,
  onActivate,
  onClear,
  onShowLogo,
  clearDisabled = false,
}) {
  const handleLiveView = () => {
    openLiveView().catch(() => {});
  };

  const formattedDate = formatProgramDate(date);

  return (
    <header className="shrink-0 z-10 h-14 sm:h-16 bg-[#191c1e]/80 backdrop-blur-md border-b border-[rgba(69,70,77,0.3)] flex items-center justify-between gap-3 px-4 sm:px-6">
      <div className="flex items-center gap-3 min-w-0">
        <Link
          to="/"
          className="shrink-0 text-[#e0e3e5] font-bold text-lg sm:text-xl tracking-tight hover:text-[#7bd0ff] transition-colors"
          title={t("program.home")}
        >
          Presenter Pro
        </Link>
        <div className="min-w-0 max-w-full border-l border-[rgba(69,70,77,0.4)] pl-3 flex items-center gap-2">
          <div className="inline-flex flex-col items-end max-w-full align-middle min-w-0">
            <h1 className="text-[#6b7280] text-sm sm:text-base font-medium truncate leading-tight max-w-full">
              {title || t("program.untitled")}
            </h1>
            {formattedDate && (
              <p
                className="text-[#45464d] text-[9px] uppercase tracking-[0.06em] leading-none mt-px whitespace-nowrap"
                style={MONO}
              >
                {formattedDate}
              </p>
            )}
          </div>
          {isActive && (
            <span
              className="shrink-0 inline-flex items-center gap-1.5 bg-[rgba(0,166,224,0.2)] text-[#7bd0ff] text-[10px] font-medium tracking-[0.08em] uppercase px-1.5 py-0.5 rounded-sm"
              style={MONO}
            >
              <span className="w-1.5 h-1.5 rounded-full bg-[#7bd0ff] animate-pulse" />
              {t("program.active")}
            </span>
          )}
        </div>
      </div>
      <div className="flex items-center gap-2 sm:gap-3 shrink-0">
        <button
          type="button"
          onClick={onClear}
          disabled={clearDisabled}
          className="text-[#c6c6cd] text-xs sm:text-sm border border-[rgba(69,70,77,0.4)] px-3 py-1.5 rounded-sm hover:border-[#ffb4ab] hover:text-[#ffb4ab] transition-colors disabled:opacity-40 disabled:pointer-events-none disabled:hover:border-[rgba(69,70,77,0.4)] disabled:hover:text-[#c6c6cd]"
          style={MONO}
        >
          {t("program.clear")}
        </button>
        <button
          type="button"
          onClick={onShowLogo}
          className="text-[#c6c6cd] text-xs sm:text-sm border border-[rgba(69,70,77,0.4)] px-3 py-1.5 rounded-sm hover:border-[#7bd0ff] hover:text-[#7bd0ff] transition-colors"
          style={MONO}
          title={t("program.showLogo")}
        >
          {t("program.logo")}
        </button>
        {!isActive && (
          <button
            type="button"
            onClick={onActivate}
            className="hidden sm:inline-flex text-[#c6c6cd] text-xs border border-[rgba(69,70,77,0.4)] px-3 py-1.5 rounded-sm hover:border-[#7bd0ff] hover:text-[#7bd0ff] transition-colors"
            style={MONO}
          >
            {t("program.activate")}
          </button>
        )}
        <button
          type="button"
          onClick={handleLiveView}
          className="text-[#7bd0ff] font-medium text-sm sm:text-base border border-[rgba(123,208,255,0.35)] px-3 py-1.5 rounded-sm hover:bg-[rgba(123,208,255,0.08)] transition-colors"
          style={MONO}
          title={t("program.openLiveView")}
        >
          {t("program.liveView")}
        </button>
      </div>
    </header>
  );
}

export default ProgramHeader;
