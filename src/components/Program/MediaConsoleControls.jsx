import { useEffect, useState } from "react";

import { t } from "../../i18n";
import { IconLoop, IconPause, IconPlay, IconStop } from "../Icons";
import {
  publishMediaSync,
  snapshotMediaState,
  subscribeMediaSync,
} from "../../utils/mediaSync";
import { MONO } from "./constants";

function formatTime(seconds) {
  if (!Number.isFinite(seconds) || seconds < 0) return "0:00";
  const total = Math.floor(seconds);
  const m = Math.floor(total / 60);
  const s = total % 60;
  return `${m}:${String(s).padStart(2, "0")}`;
}

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

function MediaConsoleControls({ mediaRef, mediaKey }) {
  const [playing, setPlaying] = useState(false);
  const [loop, setLoop] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);

  useEffect(() => {
    let detach = () => {};

    const stopWait = waitForMediaEl(mediaRef, (el) => {
      el.muted = true;
      el.defaultMuted = true;
      el.volume = 0;

      const syncPlayback = () => {
        setPlaying(!el.paused && !el.ended);
        setLoop(!!el.loop);
      };

      const syncTime = () => {
        setCurrentTime(el.currentTime || 0);
        const d = el.duration;
        setDuration(Number.isFinite(d) ? d : 0);
      };

      syncPlayback();
      syncTime();
      el.addEventListener("play", syncPlayback);
      el.addEventListener("pause", syncPlayback);
      el.addEventListener("ended", syncPlayback);
      el.addEventListener("loadeddata", syncPlayback);
      el.addEventListener("loadedmetadata", syncTime);
      el.addEventListener("durationchange", syncTime);
      el.addEventListener("timeupdate", syncTime);

      const unsubscribe = subscribeMediaSync((msg) => {
        if (msg.type !== "request-state") return;
        const state = snapshotMediaState(el, mediaKey);
        if (state) publishMediaSync(state);
      });

      detach = () => {
        el.removeEventListener("play", syncPlayback);
        el.removeEventListener("pause", syncPlayback);
        el.removeEventListener("ended", syncPlayback);
        el.removeEventListener("loadeddata", syncPlayback);
        el.removeEventListener("loadedmetadata", syncTime);
        el.removeEventListener("durationchange", syncTime);
        el.removeEventListener("timeupdate", syncTime);
        unsubscribe();
      };
    });

    return () => {
      stopWait();
      detach();
      setPlaying(false);
      setLoop(false);
      setCurrentTime(0);
      setDuration(0);
    };
  }, [mediaRef, mediaKey]);

  // Keep Live View aligned while playing (drift correction).
  useEffect(() => {
    if (!playing || !mediaKey) return undefined;

    const id = window.setInterval(() => {
      const el = mediaRef?.current;
      if (!el || el.paused) return;
      publishMediaSync({
        type: "seek",
        mediaKey,
        currentTime: el.currentTime || 0,
        playing: true,
        loop: !!el.loop,
      });
    }, 2000);

    return () => window.clearInterval(id);
  }, [playing, mediaKey, mediaRef]);

  const playPause = () => {
    const el = mediaRef?.current;
    if (!el) return;
    if (el.paused || el.ended) {
      el.play().catch(() => {});
      publishMediaSync({
        type: "play",
        mediaKey,
        currentTime: el.currentTime || 0,
        loop: !!el.loop,
      });
    } else {
      el.pause();
      publishMediaSync({
        type: "pause",
        mediaKey,
        currentTime: el.currentTime || 0,
      });
    }
  };

  const stop = () => {
    const el = mediaRef?.current;
    if (!el) return;
    el.pause();
    el.currentTime = 0;
    setPlaying(false);
    setCurrentTime(0);
    publishMediaSync({ type: "stop", mediaKey });
  };

  const toggleLoop = () => {
    const el = mediaRef?.current;
    if (!el) return;
    el.loop = !el.loop;
    setLoop(el.loop);
    publishMediaSync({ type: "loop", mediaKey, loop: el.loop });
  };

  const progress = duration > 0 ? Math.min(100, (currentTime / duration) * 100) : 0;

  const btnBase =
    "w-8 h-8 inline-flex items-center justify-center rounded-sm border transition-colors shrink-0";

  return (
    <div className="flex items-center gap-2 sm:gap-3 min-w-0 max-w-full">
      <div className="flex items-center gap-2 min-w-0 flex-1">
        <span
          className="text-[#6b7280] text-[10px] tabular-nums shrink-0"
          style={MONO}
        >
          {formatTime(currentTime)}
        </span>
        <div
          className="relative h-1 flex-1 min-w-[4rem] max-w-[12rem] rounded-full bg-[rgba(69,70,77,0.45)] overflow-hidden pointer-events-none"
          role="progressbar"
          aria-valuemin={0}
          aria-valuemax={Math.floor(duration) || 0}
          aria-valuenow={Math.floor(currentTime)}
          aria-label={t("media.progressAria")}
        >
          <div
            className="absolute inset-y-0 left-0 bg-[#7bd0ff] rounded-full transition-[width] duration-100 ease-linear"
            style={{ width: `${progress}%` }}
          />
        </div>
        <span
          className="text-[#6b7280] text-[10px] tabular-nums shrink-0"
          style={MONO}
        >
          {formatTime(duration)}
        </span>
      </div>

      <div className="flex items-center gap-1.5 shrink-0">
        <button
          type="button"
          onClick={playPause}
          className={`${btnBase} ${
            playing
              ? "border-[rgba(123,208,255,0.45)] text-[#7bd0ff] bg-[rgba(123,208,255,0.1)]"
              : "border-[rgba(69,70,77,0.4)] text-[#c6c6cd] hover:border-[#7bd0ff] hover:text-[#7bd0ff]"
          }`}
          title={playing ? t("media.pause") : t("media.play")}
          aria-label={playing ? t("media.pause") : t("media.play")}
        >
          {playing ? <IconPause /> : <IconPlay />}
        </button>
        <button
          type="button"
          onClick={stop}
          className={`${btnBase} border-[rgba(69,70,77,0.4)] text-[#c6c6cd] hover:border-[#ffb4ab] hover:text-[#ffb4ab]`}
          title={t("media.stop")}
          aria-label={t("media.stop")}
        >
          <IconStop />
        </button>
        <button
          type="button"
          onClick={toggleLoop}
          className={`${btnBase} ${
            loop
              ? "border-[rgba(123,208,255,0.45)] text-[#7bd0ff] bg-[rgba(123,208,255,0.1)]"
              : "border-[rgba(69,70,77,0.4)] text-[#c6c6cd] hover:border-[#7bd0ff] hover:text-[#7bd0ff]"
          }`}
          title={t("media.loop")}
          aria-label={t("media.loop")}
          aria-pressed={loop}
        >
          <IconLoop />
        </button>
      </div>
    </div>
  );
}

export default MediaConsoleControls;
