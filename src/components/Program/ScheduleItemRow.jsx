import { t } from "../../i18n";
import { typeLabel, getBibleVerses } from "../../utils/programSchedule";
import { MONO } from "./constants";

function ScheduleItemRow({ item, index, active, onSelect, onRemove }) {
  const isTheme = item.type === "theme";

  if (isTheme) {
    return (
      <div className="w-full rounded-lg border border-[rgba(69,70,77,0.25)] bg-[rgba(16,20,21,0.35)] px-3 py-2 flex items-center gap-3">
        <div className="w-12 h-8 rounded-sm bg-[#272a2c] border border-[rgba(69,70,77,0.3)] overflow-hidden shrink-0">
          {item.backgroundUrl ? (
            item.themeType === "video" ? (
              <video
                src={item.backgroundUrl}
                className="w-full h-full object-cover"
                muted
                playsInline
              />
            ) : (
              <img
                src={item.backgroundUrl}
                alt=""
                className="w-full h-full object-cover"
              />
            )
          ) : (
            <div
              className="w-full h-full flex items-center justify-center text-[#45464d] text-[8px] tracking-[0.08em]"
              style={MONO}
            >
              {t("types.theme")}
            </div>
          )}
        </div>
        <div className="min-w-0 flex-1">
          <p
            className="text-[#7bd0ff] text-[10px] tracking-[0.1em] uppercase"
            style={MONO}
          >
            {t("types.theme")}
          </p>
          <p className="text-[#e0e3e5] text-sm font-semibold truncate leading-tight">
            {item.title}
          </p>
        </div>
      </div>
    );
  }

  const bibleCount =
    item.type === "bible" ? getBibleVerses(item).length : 0;

  return (
    <button
      type="button"
      onClick={() => onSelect(item.id)}
      className={`w-full text-left rounded-lg border transition-colors ${
        active
          ? "border-[rgba(123,208,255,0.35)] bg-[rgba(50,53,55,0.35)] border-l-4 border-l-[#7bd0ff]"
          : "border-[rgba(69,70,77,0.25)] bg-[rgba(16,20,21,0.35)] hover:border-[rgba(123,208,255,0.2)]"
      }`}
    >
      <div className="flex items-start gap-3 p-3">
        <div className="flex-1 min-w-0">
          <div className="flex items-center justify-between gap-2 mb-1">
            <span
              className="text-[#7bd0ff] text-xs tracking-[0.05em]"
              style={MONO}
            >
              {String(index + 1).padStart(2, "0")}. {typeLabel(item)}
              {bibleCount > 1 ? ` · ${bibleCount}` : ""}
            </span>
          </div>
          <p className="text-[#e0e3e5] text-sm font-semibold truncate">
            {item.title}
          </p>
        </div>
        <span
          role="button"
          tabIndex={0}
          title={t("schedule.remove")}
          className="text-[#6b7280] hover:text-[#ffb4ab] text-lg leading-none px-1"
          onClick={(e) => {
            e.stopPropagation();
            onRemove(item.id);
          }}
          onKeyDown={(e) => {
            if (e.key === "Enter" || e.key === " ") {
              e.stopPropagation();
              onRemove(item.id);
            }
          }}
        >
          ×
        </span>
      </div>
    </button>
  );
}

export default ScheduleItemRow;
