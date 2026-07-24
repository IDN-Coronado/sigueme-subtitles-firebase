import { useEffect, useLayoutEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { ChromePicker } from "react-color";

import { t, setLocale, getLocale } from "../i18n";
import { LOCALES } from "../i18n/locale";
import {
  MAX_TEXT_SIZE,
  MIN_TEXT_SIZE,
  TEXT_SIZE_STEP,
  getGlobalCaptionBundle,
  getStyleFromBundle,
  resetGlobalCaptionStyle,
  saveGlobalCaptionStyle,
  subscribeCaptionSettings,
} from "../utils/captionSettings";
import {
  IconAlignCenter,
  IconAlignLeft,
  IconAlignRight,
  IconCc,
  IconTextDecrease,
  IconTextIncrease,
} from "./Icons";

const MONO = { fontFamily: "JetBrains Mono, monospace" };

const btnBase =
  "w-8 h-8 inline-flex items-center justify-center rounded-sm border transition-colors shrink-0";
const btnIdle =
  "border-[rgba(69,70,77,0.4)] text-[#c6c6cd] hover:border-[#7bd0ff] hover:text-[#7bd0ff]";
const btnActive =
  "border-[rgba(123,208,255,0.45)] text-[#7bd0ff] bg-[rgba(123,208,255,0.1)]";
const chipBase =
  "h-8 px-3 inline-flex items-center rounded-sm border text-xs transition-colors";
const chipIdle =
  "border-[rgba(69,70,77,0.4)] text-[#c6c6cd] hover:border-[#7bd0ff] hover:text-[#7bd0ff]";
const chipActive =
  "border-[rgba(123,208,255,0.45)] text-[#7bd0ff] bg-[rgba(123,208,255,0.1)]";

function GlobalSettingsModal({ isOpen, onClose }) {
  const [contentType, setContentType] = useState("song");
  const [settings, setSettings] = useState(() =>
    getStyleFromBundle(getGlobalCaptionBundle(), "song")
  );
  const [locale, setLocaleUi] = useState(getLocale);
  const [pickerOpen, setPickerOpen] = useState(false);
  const [pickerPos, setPickerPos] = useState({ top: 0, left: 0 });
  const buttonRef = useRef(null);
  const pickerRef = useRef(null);

  useEffect(() => {
    if (!isOpen) return undefined;
    const sync = () => {
      setSettings(getStyleFromBundle(getGlobalCaptionBundle(), contentType));
      setLocaleUi(getLocale());
    };
    sync();
    return subscribeCaptionSettings(sync);
  }, [isOpen, contentType]);

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
      setPickerPos({ top: rect.bottom + gap, left });
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

  if (!isOpen) return null;

  const update = (partial) => {
    const bundle = saveGlobalCaptionStyle(contentType, partial);
    setSettings(getStyleFromBundle(bundle, contentType));
  };

  const onReset = () => {
    const bundle = resetGlobalCaptionStyle(contentType);
    setSettings(getStyleFromBundle(bundle, contentType));
    setPickerOpen(false);
  };

  const onLanguageChange = (next) => {
    setLocale(next);
    setLocaleUi(next);
  };

  const aligns = [
    { id: "left", Icon: IconAlignLeft, label: t("console.ccAlignLeft") },
    { id: "center", Icon: IconAlignCenter, label: t("console.ccAlignCenter") },
    { id: "right", Icon: IconAlignRight, label: t("console.ccAlignRight") },
  ];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
      <div
        className="bg-[#1d2022] border border-[rgba(69,70,77,0.4)] rounded-lg shadow-[0_24px_64px_rgba(0,0,0,0.45)] flex flex-col w-full max-w-lg overflow-hidden"
        role="dialog"
        aria-modal="true"
        aria-labelledby="global-settings-title"
      >
        <div className="flex items-center justify-between px-5 sm:px-6 py-4 border-b border-[rgba(69,70,77,0.3)]">
          <div>
            <p
              className="text-[#7bd0ff] text-[10px] tracking-[0.12em] uppercase mb-1"
              style={MONO}
            >
              {t("settingsModal.eyebrow")}
            </p>
            <h2
              id="global-settings-title"
              className="text-[#e0e3e5] font-semibold text-lg tracking-tight"
            >
              {t("settingsModal.title")}
            </h2>
          </div>
          <button
            type="button"
            className="text-[#6b7280] hover:text-[#e0e3e5] text-2xl leading-none transition-colors"
            onClick={onClose}
            aria-label={t("common.close")}
          >
            ×
          </button>
        </div>

        <div className="flex flex-col gap-6 px-5 sm:px-6 py-5 max-h-[min(70vh,560px)] overflow-y-auto">
          <section className="flex flex-col gap-3">
            <h3
              className="text-[#c6c6cd] text-[10px] tracking-[0.1em] uppercase"
              style={MONO}
            >
              {t("settingsModal.language")}
            </h3>
            <div className="flex items-center gap-2">
              {LOCALES.map(({ id, labelKey }) => (
                <button
                  key={id}
                  type="button"
                  onClick={() => onLanguageChange(id)}
                  className={`${chipBase} ${
                    locale === id ? chipActive : chipIdle
                  }`}
                  aria-pressed={locale === id}
                >
                  {t(labelKey)}
                </button>
              ))}
            </div>
          </section>

          <section className="flex flex-col gap-3">
            <div className="flex items-center justify-between gap-3">
              <h3
                className="text-[#c6c6cd] text-[10px] tracking-[0.1em] uppercase"
                style={MONO}
              >
                {t("settingsModal.captionDefaults")}
              </h3>
              <div className="flex items-center gap-1">
                {["song", "bible"].map((id) => (
                  <button
                    key={id}
                    type="button"
                    onClick={() => setContentType(id)}
                    className={`h-7 px-2 inline-flex items-center rounded-sm border text-[10px] tracking-[0.06em] uppercase transition-colors ${
                      contentType === id ? chipActive : chipIdle
                    }`}
                    style={MONO}
                    aria-pressed={contentType === id}
                  >
                    {id === "song"
                      ? t("console.ccSong")
                      : t("console.ccBible")}
                  </button>
                ))}
              </div>
            </div>
            <p className="text-[#6b7280] text-xs">
              {t("settingsModal.captionDefaultsHint")}
            </p>

            <div className="flex items-center gap-1.5 flex-wrap">
              <button
                type="button"
                onClick={() => {
                  if (settings.textSize <= MIN_TEXT_SIZE) return;
                  update({ textSize: settings.textSize - TEXT_SIZE_STEP });
                }}
                disabled={settings.textSize <= MIN_TEXT_SIZE}
                className={`${btnBase} ${btnIdle} disabled:opacity-40 disabled:pointer-events-none`}
                title={t("console.ccSmaller")}
                aria-label={t("console.ccSmaller")}
              >
                <IconTextDecrease />
              </button>
              <button
                type="button"
                onClick={() => {
                  if (settings.textSize >= MAX_TEXT_SIZE) return;
                  update({ textSize: settings.textSize + TEXT_SIZE_STEP });
                }}
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
                  className={`${btnBase} ${
                    pickerOpen ? btnActive : btnIdle
                  } p-1`}
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
                onClick={() => update({ isCC: !settings.isCC })}
                className={`${btnBase} ${
                  settings.isCC ? btnActive : btnIdle
                }`}
                title={t("console.ccStyle")}
                aria-label={t("console.ccStyle")}
                aria-pressed={settings.isCC}
              >
                <IconCc />
              </button>

              {aligns.map(({ id, Icon, label }) => (
                <button
                  key={id}
                  type="button"
                  onClick={() => update({ align: id })}
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

              <button
                type="button"
                onClick={onReset}
                className="h-8 px-2 inline-flex items-center rounded-sm border border-[rgba(69,70,77,0.4)] text-[#6b7280] text-[10px] tracking-[0.06em] hover:border-[#ffb4ab] hover:text-[#ffb4ab] transition-colors"
                style={MONO}
                title={t("console.ccResetGlobalHint")}
              >
                {t("console.ccReset")}
              </button>
            </div>
          </section>
        </div>

        <div className="flex justify-end px-5 sm:px-6 py-4 border-t border-[rgba(69,70,77,0.3)]">
          <button
            type="button"
            onClick={onClose}
            className="text-[#101415] text-sm font-medium bg-[#7bd0ff] px-4 py-2 rounded-sm hover:bg-[#9fdfff] transition-colors"
          >
            {t("common.done")}
          </button>
        </div>
      </div>
    </div>
  );
}

export default GlobalSettingsModal;
