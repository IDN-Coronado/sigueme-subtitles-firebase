import { IconTrash } from "../Icons";
import { t } from "../../i18n";

function ThemeItem({ theme, onDelete }) {
  return (
    <div className="relative bg-[rgba(29,32,34,0.6)] border border-[rgba(255,255,255,0.05)] rounded-lg overflow-hidden aspect-video group hover:border-[rgba(123,208,255,0.2)] transition-colors">

      {/* Media fill */}
      {theme.type === "video" ? (
        <video
          src={theme.backgroundUrl}
          crossOrigin="anonymous"
          className="absolute inset-0 w-full h-full object-cover"
          autoPlay loop muted playsInline controls={false}
        />
      ) : theme.type === "image" ? (
        <img
          src={theme.backgroundUrl}
          crossOrigin="anonymous"
          alt={theme.title}
          className="absolute inset-0 w-full h-full object-cover"
        />
      ) : (
        <div className="absolute inset-0 bg-[#1d2022] flex items-center justify-center">
          <span
            className="text-[#45464d] text-xs tracking-[0.1em] uppercase"
            style={{ fontFamily: "JetBrains Mono, monospace" }}
          >
            {t("common.noPreview")}
          </span>
        </div>
      )}

      {/* TEMA badge */}
      <div className="absolute top-3 left-3">
        <span
          className="bg-[rgba(0,166,224,0.2)] text-[#7bd0ff] text-xs font-medium tracking-[0.05em] px-2 py-0.5 rounded-sm uppercase backdrop-blur-sm"
          style={{ fontFamily: "JetBrains Mono, monospace" }}
        >
          {t("types.theme").toUpperCase()}
        </span>
      </div>

      {/* Delete button */}
      <button
        className="absolute top-2 right-2 w-8 h-8 flex items-center justify-center bg-[rgba(16,20,21,0.6)] rounded text-[#6b7280] hover:text-red-400 transition-colors backdrop-blur-sm"
        title={t("themeItem.deleteTooltip")}
        onClick={() => onDelete(theme)}
      >
        <IconTrash />
      </button>

      {/* Title overlay */}
      <div
        className="absolute bottom-0 left-0 right-0 px-4 py-3"
        style={{ background: "linear-gradient(to top, rgba(16,20,21,0.9) 0%, transparent 100%)" }}
      >
        <p className="text-[#e0e3e5] font-bold text-sm leading-5 truncate">{theme.title}</p>
      </div>
    </div>
  );
}

export default ThemeItem;
