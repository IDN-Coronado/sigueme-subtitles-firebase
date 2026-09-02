import { useEffect } from "react";

import useCaptionSettings from "../../hooks/useCaptionSettings";
import useLiveViewSize from "../../hooks/useLiveViewSize";
import { t } from "../../i18n";
import {
  alignClass,
  getStyleFromBundle,
  justifyClass,
  textSizePx,
} from "../../utils/captionSettings";
import {
  applyMediaSyncCommand,
  publishMediaSync,
  subscribeMediaSync,
} from "../../utils/mediaSync";
import { MONO } from "./constants";
import PdfStage from "./PdfStage";
import ScaledLiveStage from "./ScaledLiveStage";
import YouTubePlayer from "./YouTubePlayer";
import {
  parseYouTubeId,
  parseYouTubeStartSeconds,
} from "../../utils/youtube";

function waitForMediaEl(mediaRef, onReady) {
  const existing = mediaRef?.current;
  if (existing) {
    onReady(existing);
    return () => {};
  }

  const id = window.setInterval(() => {
    const el = mediaRef?.current;
    if (!el) return;
    window.clearInterval(id);
    onReady(el);
  }, 50);

  return () => window.clearInterval(id);
}

function ThemeBackground({ theme }) {
  if (!theme?.backgroundUrl) return null;

  if (theme.themeType === "video") {
    return (
      <video
        src={theme.backgroundUrl}
        crossOrigin="anonymous"
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
      crossOrigin="anonymous"
      alt=""
      aria-hidden
      className="absolute inset-0 w-full h-full object-cover"
    />
  );
}

function StageFrame({
  theme,
  children,
  variant = "console",
  className = "",
  dimmed = true,
}) {
  const isLive = variant === "live";
  return (
    <div
      className={`relative h-full w-full min-h-0 overflow-hidden bg-[#0b0f10] ${className}`}
    >
      <ThemeBackground theme={theme} />
      {dimmed && (
        <div
          className={`absolute inset-0 pointer-events-none ${
            isLive ? "bg-[rgba(11,15,16,0.25)]" : "bg-[rgba(11,15,16,0.35)]"
          }`}
        />
      )}
      <div className="relative z-10 h-full min-h-0 flex flex-col">{children}</div>
    </div>
  );
}

function LiveCanvas({ theme, variant, children, dimmed = true }) {
  const isLive = variant === "live";
  const liveSize = useLiveViewSize();

  const frame = (
    <StageFrame theme={theme} variant={variant} dimmed={dimmed}>
      {children}
    </StageFrame>
  );

  // Live view is the source of truth — fill the real viewport.
  if (isLive) {
    return <div className="relative h-full min-h-0 overflow-hidden bg-black">{frame}</div>;
  }

  // Console: same layout at live W×H, scaled to fit the console section.
  return (
    <div className="relative h-full min-h-0 overflow-hidden bg-black rounded-lg border border-[rgba(69,70,77,0.25)]">
      <ScaledLiveStage
        stageWidth={liveSize.width}
        stageHeight={liveSize.height}
      >
        {frame}
      </ScaledLiveStage>
    </div>
  );
}

function PreviewConsole({
  preview,
  mediaRef,
  variant = "console",
  onPdfLoaded,
}) {
  const isLive = variant === "live";
  const liveSize = useLiveViewSize();
  const styles = useCaptionSettings(preview?.programId);
  const resource = preview?.resource;
  const theme = preview?.theme;
  const media = resource?.type === "media" ? resource.media : null;
  const isPlayable =
    media &&
    (media.mediaType === "audio" ||
      media.mediaType === "video" ||
      media.mediaType === "youtube");
  const mediaKey = isPlayable ? media.url : null;
  const contentType = resource?.type === "bible" ? "bible" : "song";
  const caption = getStyleFromBundle(styles, contentType);
  const fontSize = textSizePx(caption);
  const captionAlignClass = alignClass(caption.align);
  const captionJustifyClass = justifyClass(caption.align);
  const captionBoxClass = caption.isCC
    ? "inline-block w-fit max-w-full bg-[rgba(9,9,11,0.88)] px-8 py-6 rounded-sm"
    : "inline-block w-fit max-w-full";
  const captionTextStyle = {
    color: caption.textColor,
    fontSize,
    ...(caption.isCC
      ? {}
      : {
          // Hard outline + soft halo so light text stays readable on light themes.
          WebkitTextStroke: "1.5px rgba(0,0,0,0.85)",
          paintOrder: "stroke fill",
          textShadow: [
            "-2px -2px 0 #000",
            "2px -2px 0 #000",
            "-2px 2px 0 #000",
            "2px 2px 0 #000",
            "-3px 0 0 #000",
            "3px 0 0 #000",
            "0 -3px 0 #000",
            "0 3px 0 #000",
            "0 0 8px rgba(0,0,0,1)",
            "0 0 18px rgba(0,0,0,0.95)",
            "0 4px 14px rgba(0,0,0,0.9)",
          ].join(", "),
        }),
  };

  // Console master: muted local playback + broadcast state to Live View.
  // YouTube uses the Preview-provided start offset only on this initial send.
  useEffect(() => {
    if (isLive || !isPlayable || !mediaRef) return undefined;

    const initialTime =
      media?.mediaType === "youtube"
        ? media.startSeconds > 0
          ? Math.floor(media.startSeconds)
          : parseYouTubeStartSeconds(media.url || "")
        : 0;

    let activeEl = null;
    const stopWait = waitForMediaEl(mediaRef, (el) => {
      activeEl = el;
      el.muted = true;
      el.defaultMuted = true;
      el.volume = 0;
      el.loop = false;
      el.currentTime = initialTime;

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
    });

    return () => {
      stopWait();
      if (activeEl) activeEl.pause();
      publishMediaSync({ type: "stop", mediaKey });
    };
  }, [isLive, isPlayable, mediaKey, mediaRef, media]);

  // Live follower: unmute, no independent autoplay — follow console commands.
  useEffect(() => {
    if (!isLive || !isPlayable || !mediaRef) return undefined;

    const initialTime =
      media?.mediaType === "youtube"
        ? media.startSeconds > 0
          ? Math.floor(media.startSeconds)
          : parseYouTubeStartSeconds(media.url || "")
        : 0;

    let activeEl = null;
    let unsubscribe = () => {};
    let retryId = null;

    const stopWait = waitForMediaEl(mediaRef, (el) => {
      activeEl = el;
      el.muted = false;
      el.defaultMuted = false;
      el.volume = 1;
      el.loop = false;
      el.pause();
      try {
        el.currentTime = initialTime;
      } catch {
        // ignore
      }

      const onReady = () => {
        publishMediaSync({ type: "request-state" });
      };

      if (el.readyState >= 1) onReady();
      else el.addEventListener("loadedmetadata", onReady, { once: true });

      retryId = window.setTimeout(onReady, 250);

      unsubscribe = subscribeMediaSync((msg) => {
        if (msg.type === "request-state") return;
        applyMediaSyncCommand(el, msg, mediaKey);
      });
    });

    return () => {
      stopWait();
      if (retryId != null) window.clearTimeout(retryId);
      if (activeEl) activeEl.pause();
      unsubscribe();
    };
  }, [isLive, isPlayable, mediaKey, mediaRef, media]);

  if (!resource) {
    // Cleared (or idle): show program theme when available.
    if (theme?.backgroundUrl || isLive) {
      return (
        <LiveCanvas theme={theme} variant={variant}>
          {null}
        </LiveCanvas>
      );
    }
    return (
      <div className="relative h-full min-h-0 overflow-hidden bg-[#0b0f10] rounded-lg border border-[rgba(69,70,77,0.25)]">
        <div className="h-full flex items-center justify-center text-[#c6c6cd] text-sm px-4 text-center">
          {t("console.clickToSend")}
        </div>
      </div>
    );
  }

  if (resource.type === "song") {
    const { line } = resource.song || {};
    return (
      <LiveCanvas theme={theme} variant={variant}>
        <div className="h-full min-h-0 flex flex-col overflow-hidden p-12">
          <div
            className={`flex-1 flex items-center min-h-0 ${captionJustifyClass}`}
          >
            <div className={captionBoxClass}>
              <p
                className={`font-medium leading-tight ${captionAlignClass} ${
                  caption.isCC
                    ? "drop-shadow-[0_2px_12px_rgba(0,0,0,0.85)]"
                    : ""
                }`}
                style={captionTextStyle}
              >
                {line || "—"}
              </p>
            </div>
          </div>
        </div>
      </LiveCanvas>
    );
  }

  if (resource.type === "bible") {
    const { reference, text } = resource.bible || {};
    return (
      <LiveCanvas theme={theme} variant={variant}>
        <div className="h-full min-h-0 flex flex-col overflow-hidden px-28 py-12">
          <div
            className={`flex-1 flex items-center min-h-0 ${captionJustifyClass}`}
          >
            <div className={captionBoxClass}>
              <p
                className={`leading-snug ${captionAlignClass} ${
                  caption.isCC
                    ? "drop-shadow-[0_2px_12px_rgba(0,0,0,0.85)]"
                    : ""
                }`}
                style={captionTextStyle}
              >
                {text}
              </p>
              {reference && (
                <p
                  className={`mt-4 tracking-[0.08em] uppercase ${captionAlignClass}`}
                  style={{
                    ...MONO,
                    color: caption.textColor,
                    fontSize: Math.max(26, Math.round(fontSize * 0.52)),
                    filter: "brightness(0.8)",
                  }}
                >
                  {reference}
                </p>
              )}
            </div>
          </div>
        </div>
      </LiveCanvas>
    );
  }

  if (resource.type === "media") {
    const {
      url,
      mediaType,
      title,
      youtubeId,
      startSeconds,
      slideIndex,
      storagePath,
    } = resource.media || {};
    const isYouTube = mediaType === "youtube";
    const resolvedYouTubeId = isYouTube
      ? youtubeId || parseYouTubeId(url)
      : null;
    const resolvedStartSeconds = isYouTube
      ? startSeconds > 0
        ? Math.floor(startSeconds)
        : parseYouTubeStartSeconds(url || "")
      : 0;
    const showTheme = mediaType === "audio";
    const pdfPageIndex = Number.isFinite(slideIndex)
      ? Math.max(0, Math.floor(slideIndex))
      : 0;
    return (
      <LiveCanvas
        theme={showTheme ? theme : null}
        variant={variant}
        dimmed={showTheme}
      >
        <div className="h-full w-full min-h-0 flex items-center justify-center relative">
          {isYouTube && resolvedYouTubeId ? (
            <YouTubePlayer
              key={`${resolvedYouTubeId}-${resolvedStartSeconds}`}
              videoId={resolvedYouTubeId}
              startSeconds={resolvedStartSeconds}
              mediaRef={mediaRef}
              muted={!isLive}
              className="w-full h-full pointer-events-none"
            />
          ) : mediaType === "video" ? (
            <video
              key={url}
              ref={mediaRef}
              src={url}
              crossOrigin="anonymous"
              className="w-full h-full object-contain pointer-events-none"
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
                crossOrigin="anonymous"
                preload="auto"
                className="hidden"
                muted={!isLive}
              />
              <div className="flex flex-col items-center gap-6 px-12">
                <span
                  className="text-[#c6c6cd] tracking-[0.1em]"
                  style={{ ...MONO, fontSize: 20 }}
                >
                  {t("media.audioBadge")}
                </span>
                <p
                  className="text-[#e0e3e5] text-center drop-shadow-[0_1px_8px_rgba(0,0,0,0.85)]"
                  style={{ fontSize: 36 }}
                >
                  {title}
                </p>
              </div>
            </>
          ) : mediaType === "pdf" ? (
            <PdfStage
              key={storagePath || url}
              url={url}
              storagePath={storagePath}
              slideIndex={pdfPageIndex}
              stageWidth={liveSize.width}
              stageHeight={liveSize.height}
              onLoaded={!isLive ? onPdfLoaded : undefined}
            />
          ) : (
            <img
              src={url}
              crossOrigin="anonymous"
              alt={title || ""}
              className="w-full h-full object-contain"
            />
          )}
        </div>
      </LiveCanvas>
    );
  }

  if (isLive) {
    return (
      <LiveCanvas theme={theme} variant={variant}>
        {null}
      </LiveCanvas>
    );
  }

  return (
    <div className="relative h-full min-h-0 overflow-hidden bg-[#0b0f10] rounded-lg border border-[rgba(69,70,77,0.25)]">
      <div className="h-full flex items-center justify-center text-[#6b7280] text-sm">
        {t("console.unsupported")}
      </div>
    </div>
  );
}

export default PreviewConsole;
