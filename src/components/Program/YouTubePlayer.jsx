import { useEffect, useId, useRef } from "react";

import { loadYouTubeIframeAPI } from "../../utils/youtube";
import { createYouTubeMediaAdapter } from "../../utils/youtubeMediaAdapter";

/**
 * Embeds a YouTube video via the IFrame Player API and exposes an
 * HTMLMediaElement-like adapter on `mediaRef` for programmatic control.
 */
function YouTubePlayer({
  videoId,
  mediaRef,
  className = "",
  muted = true,
  startSeconds = 0,
}) {
  const reactId = useId().replace(/:/g, "");
  const hostId = `yt-player-${reactId}`;
  const containerRef = useRef(null);
  const adapterRef = useRef(null);
  const playerRef = useRef(null);
  const mutedRef = useRef(muted);
  mutedRef.current = muted;

  const start =
    Number.isFinite(startSeconds) && startSeconds > 0
      ? Math.floor(startSeconds)
      : 0;

  useEffect(() => {
    if (!videoId || !containerRef.current) return undefined;

    let cancelled = false;
    const container = containerRef.current;
    container.innerHTML = "";
    const placeholder = document.createElement("div");
    placeholder.id = hostId;
    placeholder.style.width = "100%";
    placeholder.style.height = "100%";
    container.appendChild(placeholder);

    const mount = async () => {
      const YT = await loadYouTubeIframeAPI();
      if (cancelled || !document.getElementById(hostId)) return;

      const playerVars = {
        autoplay: 0,
        controls: 0,
        disablekb: 1,
        fs: 0,
        modestbranding: 1,
        rel: 0,
        playsinline: 1,
        enablejsapi: 1,
        origin: window.location.origin,
      };
      if (start > 0) playerVars.start = start;

      const player = new YT.Player(hostId, {
        videoId,
        width: "100%",
        height: "100%",
        playerVars,
        events: {
          onReady: (event) => {
            if (cancelled) return;
            const adapter = createYouTubeMediaAdapter(event.target, {
              startSeconds: start,
            });
            const isMuted = mutedRef.current;
            adapter.muted = isMuted;
            adapter.defaultMuted = isMuted;
            adapter.volume = isMuted ? 0 : 1;
            adapterRef.current = adapter;
            if (mediaRef) mediaRef.current = adapter;
            adapter.notifyReady();
          },
        },
      });
      playerRef.current = player;
    };

    mount().catch((err) => {
      console.error("Failed to create YouTube player", err);
    });

    return () => {
      cancelled = true;
      const adapter = adapterRef.current;
      adapter?.destroy?.();
      if (mediaRef && mediaRef.current === adapter) {
        mediaRef.current = null;
      }
      adapterRef.current = null;
      try {
        playerRef.current?.destroy?.();
      } catch {
        // ignore
      }
      playerRef.current = null;
      if (containerRef.current) containerRef.current.innerHTML = "";
    };
  }, [videoId, hostId, mediaRef, start]);

  useEffect(() => {
    const adapter = adapterRef.current;
    if (!adapter) return;
    adapter.muted = muted;
    adapter.defaultMuted = muted;
    adapter.volume = muted ? 0 : 1;
  }, [muted]);

  return (
    <div
      ref={containerRef}
      className={`relative w-full h-full min-h-0 overflow-hidden [&>iframe]:absolute [&>iframe]:inset-0 [&>iframe]:w-full [&>iframe]:h-full ${className}`}
    />
  );
}

export default YouTubePlayer;
