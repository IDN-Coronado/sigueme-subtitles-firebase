import { Link } from "react-router-dom";

import { MONO } from "./constants";
import openLiveView from "../../utils/openLiveView";

function ProgramHeader({ title, isActive, onActivate, onClear }) {
  const handleLiveView = () => {
    openLiveView().catch(() => {});
  };

  return (
    <header className="shrink-0 z-10 h-14 sm:h-16 bg-[#191c1e]/80 backdrop-blur-md border-b border-[rgba(69,70,77,0.3)] flex items-center justify-between gap-3 px-4 sm:px-6">
      <div className="flex items-center gap-3 min-w-0">
        <Link
          to="/"
          className="text-[#c6c6cd] hover:text-[#e0e3e5] text-xl leading-none shrink-0"
          title="Menú principal"
        >
          ←
        </Link>
        <h1 className="text-[#e0e3e5] font-semibold text-base sm:text-lg truncate">
          {title || "Programa"}
        </h1>
      </div>
      <div className="flex items-center gap-2 sm:gap-3 shrink-0">
        <button
          type="button"
          onClick={onClear}
          className="text-[#c6c6cd] text-xs sm:text-sm border border-[rgba(69,70,77,0.4)] px-3 py-1.5 rounded-sm hover:border-[#ffb4ab] hover:text-[#ffb4ab] transition-colors"
          style={MONO}
        >
          CLEAR
        </button>
        {isActive ? (
          <span
            className="hidden sm:inline-flex items-center gap-2 border border-[#93000a] text-[#ffb4ab] text-xs px-3 py-1.5 rounded-sm tracking-[0.04em]"
            style={MONO}
          >
            <span className="w-1.5 h-1.5 rounded-full bg-[#ffb4ab] animate-pulse" />
            LIVE STATUS: STREAMING
          </span>
        ) : (
          <button
            type="button"
            onClick={onActivate}
            className="hidden sm:inline-flex text-[#c6c6cd] text-xs border border-[rgba(69,70,77,0.4)] px-3 py-1.5 rounded-sm hover:border-[#7bd0ff] hover:text-[#7bd0ff] transition-colors"
            style={MONO}
          >
            ACTIVAR
          </button>
        )}
        <button
          type="button"
          onClick={handleLiveView}
          className="text-[#7bd0ff] font-medium text-sm sm:text-base border border-[rgba(123,208,255,0.35)] px-3 py-1.5 rounded-sm hover:bg-[rgba(123,208,255,0.08)] transition-colors"
          style={MONO}
          title="Abrir Live View en otra pantalla"
        >
          Live View
        </button>
      </div>
    </header>
  );
}

export default ProgramHeader;
