import { t } from "../../i18n";
import { typeLabel, getBibleVerses } from "../../utils/programSchedule";
import { mediaDisplayTitle } from "../../utils/mediaTitle";
import { MONO } from "../../fonts";

const TYPE_CHIP = {
  song: { label: "CANCION", bg: "bg-primary/20", text: "text-primary-hover" },
  bible: { label: "BIBLIA", bg: "bg-[rgba(0,212,255,0.15)]", text: "text-accent" },
  theme: { label: "TEMA", bg: "bg-[rgba(52,211,153,0.15)]", text: "text-[#34D399]" },
  media: { label: "MEDIA", bg: "bg-[rgba(251,191,36,0.15)]", text: "text-[#FBBF24]" },
  video: { label: "VIDEO", bg: "bg-[rgba(251,113,133,0.15)]", text: "text-[#FB7185]" },
  image: { label: "IMAGEN", bg: "bg-[rgba(167,139,250,0.2)]", text: "text-[#A78BFA]" },
  audio: { label: "AUDIO", bg: "bg-[rgba(96,165,250,0.15)]", text: "text-[#60A5FA]" },
  youtube: { label: "YOUTUBE", bg: "bg-[rgba(251,113,133,0.15)]", text: "text-[#FB7185]" },
};

function TypeChip({ item }) {
  const subtype = item.mediaType || item.type;
  const chip = TYPE_CHIP[subtype] || TYPE_CHIP[item.type] || TYPE_CHIP.media;
  return (
    <span className={`inline-flex items-center px-1.5 py-0.5 rounded text-[9px] font-semibold tracking-[0.08em] uppercase ${chip.bg} ${chip.text}`} style={MONO}>
      {chip.label}
    </span>
  );
}

const CACHE_STATUS_COLOR = {
  cached: "bg-emerald-400",
  loading: "bg-amber-400 animate-pulse",
  error: "bg-red-400",
  unavailable: "bg-card",
};

function CacheStatusDot({ status }) {
  const color = CACHE_STATUS_COLOR[status];
  if (!color) return null;
  const label = t(`schedule.cacheStatus${status.charAt(0).toUpperCase() + status.slice(1)}`);
  return (
    <span
      className={`inline-block w-1.5 h-1.5 rounded-full shrink-0 ${color}`}
      title={label}
      aria-label={label}
    />
  );
}

function ScheduleItemRow({ item, index, active, onSelect, onDoubleSelect, onRemove, cacheStatus }) {
  const isTheme = item.type === "theme";

  if (isTheme) {
    return (
      <div className="w-full rounded-lg border border-hairline bg-card px-3 py-2.5 flex items-center gap-3">
        <div className="w-12 h-8 rounded-md bg-hover border border-[rgba(255,255,255,0.06)] overflow-hidden shrink-0">
          {item.backgroundUrl ? (
            item.themeType === "video" ? (
              <video src={item.backgroundUrl} className="w-full h-full object-cover" muted playsInline />
            ) : (
              <img src={item.backgroundUrl} alt="" className="w-full h-full object-cover" />
            )
          ) : (
            <div className="w-full h-full flex items-center justify-center text-fg-muted text-[8px]" style={MONO}>
              {t("types.theme")}
            </div>
          )}
        </div>
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-1.5 mb-0.5">
            <TypeChip item={item} />
            <CacheStatusDot status={cacheStatus} />
          </div>
          <p className="text-fg text-sm font-semibold truncate leading-tight">
            {item.title}
          </p>
        </div>
      </div>
    );
  }

  const bibleCount = item.type === "bible" ? getBibleVerses(item).length : 0;

  return (
    <button
      key={active ? "on" : "off"}
      type="button"
      onClick={() => onSelect(item.id)}
      onDoubleClick={() => onDoubleSelect?.(item.id)}
      className={`w-full text-left rounded-lg border transition-all duration-200 ${
        active
          ? "schedule-item-active border-primary/50 bg-primary/10 border-l-2 border-l-primary"
          : "border-[rgba(255,255,255,0.06)] bg-card hover:border-primary/30 hover:bg-hover"
      }`}
    >
      <div className="flex items-center gap-3 px-3 py-2.5">
        {/* Number */}
        <span className="text-fg-muted text-xs font-mono tabular-nums shrink-0 w-5 text-center">
          {String(index + 1).padStart(2, "0")}
        </span>

        {/* Content */}
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-1.5 mb-0.5">
            <TypeChip item={item} />
            {bibleCount > 0 && (
              <span className="text-fg-muted text-[9px]" style={MONO}>
                {bibleCount} {bibleCount === 1 ? t("schedule.versicleCount", { count: "" }).replace(" ", "") : "vs"}
              </span>
            )}
            <CacheStatusDot status={cacheStatus} />
          </div>
          <p className="text-fg text-sm font-medium truncate leading-tight">
            {item.type === "media" ? mediaDisplayTitle(item) : item.title}
          </p>
        </div>

        {/* Remove */}
        <span
          role="button"
          tabIndex={0}
          title={t("schedule.remove")}
          className="text-fg-muted hover:text-danger text-base leading-none px-1 shrink-0 transition-colors"
          onClick={(e) => { e.stopPropagation(); onRemove(item.id); }}
          onKeyDown={(e) => {
            if (e.key === "Enter" || e.key === " ") { e.stopPropagation(); onRemove(item.id); }
          }}
        >
          ×
        </span>
      </div>
    </button>
  );
}

export default ScheduleItemRow;
