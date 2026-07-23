import { useEffect } from "react";

import useCaptionSettings from "../../hooks/useCaptionSettings";
import { t } from "../../i18n";
import {
  alignClass,
  textSizeClass,
} from "../../utils/captionSettings";
import {
  applyMediaSyncCommand,
  publishMediaSync,
  subscribeMediaSync,
} from "../../utils/mediaSync";
import { MONO } from "./constants";

function ThemeBackground({ theme }) {
  if (!theme?.backgroundUrl) return null;

  if (theme.themeType === "video") {
    return (
      <video
        src={theme.backgroundUrl}
        className="absolute inset-0 w-full h-full object-cover"
        autoPlay
        muted
        loop
        playsInline
        aria-hidden
      />
    );
  }

  return (
    <img
      src={theme.backgroundUrl}
      alt=""
      aria-hidden
      className="absolute inset-0 w-full h-full object-cover"
    />
  );
}

function ConsoleFrame({ theme, children, className = "", variant = "console" }) {
  const isLive = variant === "live";
  return (
    <div
      className={`relative h-full min-h-0 overflow-hidden bg-[#0b0f10] ${
        isLive
          ? "rounded-none border-0"
          : "rounded-lg border border-[rgba(69,70,77,0.25)]"
      } ${className}`}
    >
      <ThemeBackground theme={theme} />
      <div
        className={`absolute inset-0 pointer-events-none ${
          isLive ? "bg-[rgba(11,15,16,0.25)]" : "bg-[rgba(11,15,16,0.35)]"
        }`}
      />
      <div className="relative z-10 h-full min-h-0 flex flex-col">{children}</div>
    </div>
  );
}

function PreviewConsole({ preview, mediaRef, variant = "console" }) {
  const isLive = variant === "live";
  const caption = useCaptionSettings();
  const resource = preview?.resource;
  const theme = preview?.theme;
  const media = resource?.type === "media" ? resource.media : null;
  const isPlayable =
    media && (media.mediaType === "audio" || media.mediaType === "video");
  const mediaKey = isPlayable ? media.url : null;
  const captionTextClass = `${textSizeClass(caption, variant)} ${alignClass(
    caption.align
  )}`;
  const captionBoxClass = caption.isCC
    ? "bg-[rgba(9,9,11,0.88)] px-4 py-3 rounded-sm"
    : "";

  // Console master: muted local playback + broadcast state to Live View.
  useEffect(() => {
    if (isLive || !isPlayable || !mediaRef) return undefined;

    const el = mediaRef.current;
    if (!el) return undefined;

    el.muted = true;
    el.defaultMuted = true;
    el.volume = 0;
    el.loop = false;
    el.currentTime = 0;

    const broadcastPlay = () => {
      publishMediaSync({
        type: "play",
        mediaKey,
        currentTime: el.currentTime || 0,
        loop: !!el.loop,
      });
    };

    const playPromise = el.play();
    if (playPromise?.then) {
      playPromise.then(broadcastPlay).catch(() => {});
    } else {
      broadcastPlay();
    }

    return () => {
      el.pause();
      publishMediaSync({ type: "stop", mediaKey });
    };
  }, [isLive, isPlayable, mediaKey, mediaRef]);

  // Live follower: unmute, no independent autoplay — follow console commands.
  useEffect(() => {
    if (!isLive || !isPlayable || !mediaRef) return undefined;

    const el = mediaRef.current;
    if (!el) return undefined;

    el.muted = false;
    el.defaultMuted = false;
    el.volume = 1;
    el.loop = false;
    el.pause();
    try {
      el.currentTime = 0;
    } catch {
      // ignore
    }

    const onReady = () => {
      publishMediaSync({ type: "request-state" });
    };

    if (el.readyState >= 1) onReady();
    else el.addEventListener("loadedmetadata", onReady, { once: true });

    // Retry in case the console master wasn't listening yet.
    const retryId = window.setTimeout(onReady, 250);

    const unsubscribe = subscribeMediaSync((msg) => {
      if (msg.type === "request-state") return;
      applyMediaSyncCommand(el, msg, mediaKey);
    });

    return () => {
      window.clearTimeout(retryId);
      el.pause();
      unsubscribe();
    };
  }, [isLive, isPlayable, mediaKey, mediaRef]);

  if (!resource) {
    return (
      <ConsoleFrame theme={theme} variant={variant}>
        {isLive ? null : (
          <div className="h-full flex items-center justify-center text-[#c6c6cd] text-sm px-4 text-center">
            {t("console.clickToSend")}
          </div>
        )}
      </ConsoleFrame>
    );
  }

  if (resource.type === "song") {
    const { title, line, lineIndex } = resource.song || {};
    return (
      <ConsoleFrame theme={theme} variant={variant}>
        <div
          className={`h-full min-h-0 flex flex-col overflow-auto ${
            isLive ? "p-8 sm:p-12" : "p-4"
          }`}
        >
          {!isLive && (
            <div className="flex items-center justify-between gap-2 mb-4 shrink-0">
              <p className="text-[#7bd0ff] text-xs tracking-[0.08em]" style={MONO}>
                {t("console.lyricsLabel")}
              </p>
              <p className="text-[#c6c6cd] text-xs truncate" style={MONO}>
                {title}
                {typeof lineIndex === "number" ? ` · L${lineIndex + 1}` : ""}
              </p>
            </div>
          )}
          <div className="flex-1 flex items-center justify-center">
            <div
              className={`w-full ${isLive ? "max-w-5xl px-2" : ""} ${captionBoxClass}`}
            >
              <p
                className={`font-medium drop-shadow-[0_2px_12px_rgba(0,0,0,0.85)] leading-tight ${captionTextClass}`}
                style={{ color: caption.textColor }}
              >
                {line || "—"}
              </p>
            </div>
          </div>
        </div>
      </ConsoleFrame>
    );
  }

  if (resource.type === "bible") {
    const { reference, text } = resource.bible || {};
    return (
      <ConsoleFrame theme={theme} variant={variant}>
        <div
          className={`h-full min-h-0 flex flex-col overflow-auto ${
            isLive ? "p-8 sm:p-12" : "p-4"
          }`}
        >
          <p
            className={`text-[#7bd0ff] tracking-[0.08em] shrink-0 ${
              isLive ? "text-sm sm:text-base mb-6 text-center" : "text-xs mb-4"
            }`}
            style={MONO}
          >
            {reference}
          </p>
          <div className="flex-1 flex items-center justify-center">
            <div
              className={`w-full ${isLive ? "max-w-5xl px-2" : ""} ${captionBoxClass}`}
            >
              <p
                className={`drop-shadow-[0_2px_12px_rgba(0,0,0,0.85)] leading-snug ${captionTextClass}`}
                style={{ color: caption.textColor }}
              >
                {text}
              </p>
            </div>
          </div>
        </div>
      </ConsoleFrame>
    );
  }

  if (resource.type === "media") {
    const { url, mediaType, title } = resource.media || {};
    const showTheme = mediaType === "audio";
    return (
      <ConsoleFrame theme={showTheme ? theme : null} variant={variant}>
        <div className="h-full min-h-0 flex items-center justify-center relative">
          {mediaType === "video" ? (
            <video
              key={url}
              ref={mediaRef}
              src={url}
              className="w-full h-full object-contain"
              playsInline
              preload="auto"
              muted={!isLive}
              {...(!isLive
                ? { "aria-label": t("console.mutedPreviewAria") }
                : {})}
            />
          ) : mediaType === "audio" ? (
            <>
              <audio
                key={url}
                ref={mediaRef}
                src={url}
                preload="auto"
                className="hidden"
                muted={!isLive}
              />
              <div className="flex flex-col items-center gap-3 px-6">
                <span
                  className={`text-[#c6c6cd] tracking-[0.1em] ${
                    isLive ? "text-sm" : "text-xs"
                  }`}
                  style={MONO}
                >
                  {t("media.audioBadge")}
                </span>
                <p
                  className={`text-[#e0e3e5] text-center drop-shadow-[0_1px_8px_rgba(0,0,0,0.85)] ${
                    isLive ? "text-2xl sm:text-3xl" : "text-sm"
                  }`}
                >
                  {title}
                </p>
              </div>
            </>
          ) : (
            <img
              src={url}
              alt={title || ""}
              className="w-full h-full object-contain"
            />
          )}
        </div>
      </ConsoleFrame>
    );
  }

  return (
    <ConsoleFrame theme={theme} variant={variant}>
      {!isLive && (
        <div className="h-full flex items-center justify-center text-[#6b7280] text-sm">
          {t("console.unsupported")}
        </div>
      )}
    </ConsoleFrame>
  );
}

export default PreviewConsole;
