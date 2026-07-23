import { useEffect, useLayoutEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { ChromePicker } from "react-color";

import { t } from "../../i18n";
import {
  MAX_TEXT_SIZE,
  MIN_TEXT_SIZE,
  getCaptionSettings,
  resetCaptionSettings,
  saveCaptionSettings,
  subscribeCaptionSettings,
} from "../../utils/captionSettings";
import {
  IconAlignCenter,
  IconAlignLeft,
  IconAlignRight,
  IconCc,
  IconTextDecrease,
  IconTextIncrease,
} from "../Icons";
import { MONO } from "./constants";

const btnBase =
  "w-8 h-8 inline-flex items-center justify-center rounded-sm border transition-colors shrink-0";
const btnIdle =
  "border-[rgba(69,70,77,0.4)] text-[#c6c6cd] hover:border-[#7bd0ff] hover:text-[#7bd0ff]";
const btnActive =
  "border-[rgba(123,208,255,0.45)] text-[#7bd0ff] bg-[rgba(123,208,255,0.1)]";

function CaptionConsoleControls() {
  const [settings, setSettings] = useState(getCaptionSettings);
  const [pickerOpen, setPickerOpen] = useState(false);
  const [pickerPos, setPickerPos] = useState({ top: 0, left: 0 });
  const buttonRef = useRef(null);
  const pickerRef = useRef(null);

  useEffect(() => subscribeCaptionSettings(setSettings), []);

  useLayoutEffect(() => {
    if (!pickerOpen || !buttonRef.current) return undefined;

    const updatePosition = () => {
      const rect = buttonRef.current.getBoundingClientRect();
      const pickerWidth = 225;
      const gap = 8;
      const left = Math.min(
        Math.max(8, rect.right - pickerWidth),
        window.innerWidth - pickerWidth - 8
      );
      setPickerPos({
        top: rect.bottom + gap,
        left,
      });
    };

    updatePosition();
    window.addEventListener("resize", updatePosition);
    window.addEventListener("scroll", updatePosition, true);
    return () => {
      window.removeEventListener("resize", updatePosition);
      window.removeEventListener("scroll", updatePosition, true);
    };
  }, [pickerOpen]);

  useEffect(() => {
    if (!pickerOpen) return undefined;
    const onPointerDown = (event) => {
      const inButton = buttonRef.current?.contains(event.target);
      const inPicker = pickerRef.current?.contains(event.target);
      if (!inButton && !inPicker) setPickerOpen(false);
    };
    const onKeyDown = (event) => {
      if (event.key === "Escape") setPickerOpen(false);
    };
    document.addEventListener("pointerdown", onPointerDown);
    document.addEventListener("keydown", onKeyDown);
    return () => {
      document.removeEventListener("pointerdown", onPointerDown);
      document.removeEventListener("keydown", onKeyDown);
    };
  }, [pickerOpen]);

  const update = (partial) => {
    setSettings(saveCaptionSettings(partial));
  };

  const decrease = () => {
    if (settings.textSize <= MIN_TEXT_SIZE) return;
    update({ textSize: settings.textSize - 1 });
  };

  const increase = () => {
    if (settings.textSize >= MAX_TEXT_SIZE) return;
    update({ textSize: settings.textSize + 1 });
  };

  const toggleCc = () => {
    update({ isCC: !settings.isCC });
  };

  const setAlign = (align) => {
    update({ align });
  };

  const onReset = () => {
    setSettings(resetCaptionSettings());
    setPickerOpen(false);
  };

  const aligns = [
    { id: "left", Icon: IconAlignLeft, label: t("console.ccAlignLeft") },
    { id: "center", Icon: IconAlignCenter, label: t("console.ccAlignCenter") },
    { id: "right", Icon: IconAlignRight, label: t("console.ccAlignRight") },
  ];

  return (
    <div className="flex items-center gap-1.5 sm:gap-2 min-w-0">
      <button
        type="button"
        onClick={decrease}
        disabled={settings.textSize <= MIN_TEXT_SIZE}
        className={`${btnBase} ${btnIdle} disabled:opacity-40 disabled:pointer-events-none`}
        title={t("console.ccSmaller")}
        aria-label={t("console.ccSmaller")}
      >
        <IconTextDecrease />
      </button>
      <button
        type="button"
        onClick={increase}
        disabled={settings.textSize >= MAX_TEXT_SIZE}
        className={`${btnBase} ${btnIdle} disabled:opacity-40 disabled:pointer-events-none`}
        title={t("console.ccLarger")}
        aria-label={t("console.ccLarger")}
      >
        <IconTextIncrease />
      </button>

      <div className="relative">
        <button
          ref={buttonRef}
          type="button"
          onClick={() => setPickerOpen((open) => !open)}
          className={`${btnBase} ${pickerOpen ? btnActive : btnIdle} p-1`}
          title={t("console.ccTextColor")}
          aria-label={t("console.ccTextColor")}
          aria-expanded={pickerOpen}
        >
          <span
            className="block w-full h-full rounded-[2px] border border-[rgba(224,227,229,0.35)]"
            style={{ backgroundColor: settings.textColor }}
          />
        </button>
        {pickerOpen &&
          createPortal(
            <div
              ref={pickerRef}
              className="fixed z-[9999] shadow-xl"
              style={{ top: pickerPos.top, left: pickerPos.left }}
            >
              <ChromePicker
                color={settings.textColor}
                disableAlpha
                onChange={(color) => update({ textColor: color.hex })}
              />
            </div>,
            document.body
          )}
      </div>

      <button
        type="button"
        onClick={toggleCc}
        className={`${btnBase} ${settings.isCC ? btnActive : btnIdle}`}
        title={t("console.ccStyle")}
        aria-label={t("console.ccStyle")}
        aria-pressed={settings.isCC}
      >
        <IconCc />
      </button>

      <div className="hidden sm:flex items-center gap-1">
        {aligns.map(({ id, Icon, label }) => (
          <button
            key={id}
            type="button"
            onClick={() => setAlign(id)}
            className={`${btnBase} ${
              settings.align === id ? btnActive : btnIdle
            }`}
            title={label}
            aria-label={label}
            aria-pressed={settings.align === id}
          >
            <Icon />
          </button>
        ))}
      </div>

      <button
        type="button"
        onClick={onReset}
        className="h-8 px-2 inline-flex items-center rounded-sm border border-[rgba(69,70,77,0.4)] text-[#6b7280] text-[10px] tracking-[0.06em] hover:border-[#ffb4ab] hover:text-[#ffb4ab] transition-colors shrink-0"
        style={MONO}
        title={t("console.ccReset")}
        aria-label={t("console.ccReset")}
      >
        {t("console.ccReset")}
      </button>
    </div>
  );
}

export default CaptionConsoleControls;
