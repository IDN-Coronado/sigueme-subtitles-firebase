import { t } from "../../i18n";
import {
  IconSlideFirst,
  IconSlideLast,
  IconSlideNext,
  IconSlidePrev,
} from "../Icons";
import { MONO } from "./constants";

const btnBase =
  "w-8 h-8 inline-flex items-center justify-center rounded-sm border transition-colors shrink-0";
const btnIdle =
  "border-[rgba(69,70,77,0.4)] text-[#c6c6cd] hover:border-[#7bd0ff] hover:text-[#7bd0ff] disabled:opacity-35 disabled:pointer-events-none disabled:hover:border-[rgba(69,70,77,0.4)] disabled:hover:text-[#c6c6cd]";

function PptxConsoleControls({ preview, setPreview, slideCount: slideCountProp }) {
  const media = preview?.resource?.media;
  const slideIndex = Number.isFinite(media?.slideIndex)
    ? Math.max(0, Math.floor(media.slideIndex))
    : 0;
  const fromMedia = Number.isFinite(media?.slideCount)
    ? Math.floor(media.slideCount)
    : 0;
  const fromProp = Number.isFinite(slideCountProp)
    ? Math.floor(slideCountProp)
    : 0;
  const slideCount = Math.max(0, fromMedia, fromProp);
  const displayCurrent = slideCount > 0 ? slideIndex + 1 : 0;
  const atFirst = slideCount <= 0 || slideIndex <= 0;
  const atLast = slideCount <= 0 || slideIndex >= slideCount - 1;

  const goTo = async (index) => {
    if (!media || !setPreview || slideCount <= 0) return;
    const next = Math.max(0, Math.min(slideCount - 1, index));
    if (next === slideIndex) return;

    await setPreview({
      programId: preview.programId,
      theme: preview.theme ?? null,
      resource: {
        type: "media",
        media: {
          ...media,
          slideIndex: next,
          slideCount,
        },
      },
    });
  };

  return (
    <div className="flex items-center gap-1.5 sm:gap-2 min-w-0 max-w-full">
      <button
        type="button"
        onClick={() => goTo(0)}
        disabled={atFirst}
        className={`${btnBase} ${btnIdle}`}
        title={t("media.pptxFirst")}
        aria-label={t("media.pptxFirst")}
      >
        <IconSlideFirst />
      </button>
      <button
        type="button"
        onClick={() => goTo(slideIndex - 1)}
        disabled={atFirst}
        className={`${btnBase} ${btnIdle}`}
        title={t("media.pptxPrev")}
        aria-label={t("media.pptxPrev")}
      >
        <IconSlidePrev />
      </button>

      <span
        className="text-[#c6c6cd] text-[11px] tabular-nums shrink-0 px-1 min-w-[4.5rem] text-center"
        style={MONO}
        aria-live="polite"
        aria-label={t("media.pptxCounterAria", {
          current: displayCurrent,
          total: slideCount,
        })}
      >
        {slideCount > 0
          ? t("media.pptxCounter", {
              current: displayCurrent,
              total: slideCount,
            })
          : "—"}
      </span>

      <button
        type="button"
        onClick={() => goTo(slideIndex + 1)}
        disabled={atLast}
        className={`${btnBase} ${btnIdle}`}
        title={t("media.pptxNext")}
        aria-label={t("media.pptxNext")}
      >
        <IconSlideNext />
      </button>
      <button
        type="button"
        onClick={() => goTo(slideCount - 1)}
        disabled={atLast}
        className={`${btnBase} ${btnIdle}`}
        title={t("media.pptxLast")}
        aria-label={t("media.pptxLast")}
      >
        <IconSlideLast />
      </button>
    </div>
  );
}

export default PptxConsoleControls;
