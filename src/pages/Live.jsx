import { useEffect, useRef, useState } from "react";

import PreviewConsole from "../components/Program/PreviewConsole";
import usePreview from "../firebase/usePreview";
import { MONO } from "../components/Program/constants";
import { t } from "../i18n";
import { startLiveViewSizeReporter } from "../utils/liveViewSize";
import { subscribeCacheProgress } from "../utils/cacheProgressSync";

async function requestPageFullscreen() {
  if (document.fullscreenElement) return true;
  const el = document.documentElement;
  if (!el.requestFullscreen) return false;
  try {
    await el.requestFullscreen({ navigationUI: "hide" });
    return true;
  } catch {
    return false;
  }
}

function Live() {
  const { preview } = usePreview();
  const mediaRef = useRef(null);
  const [fullscreenHint, setFullscreenHint] = useState(true);
  const [cacheProgress, setCacheProgress] = useState(null);

  useEffect(() => startLiveViewSizeReporter(), []);

  useEffect(
    () =>
      subscribeCacheProgress((msg) => {
        if (msg.status === "running") setCacheProgress(msg);
        else setCacheProgress(null); // done/error — clear the indicator
      }),
    []
  );

  useEffect(() => {
    let cancelled = false;

    const tryFullscreen = async () => {
      const ok = await requestPageFullscreen();
      if (!cancelled && ok) setFullscreenHint(false);
    };

    // Attempt shortly after open (may succeed when opened from a user gesture).
    const timeoutId = window.setTimeout(tryFullscreen, 100);
    return () => {
      cancelled = true;
      window.clearTimeout(timeoutId);
    };
  }, []);

  useEffect(() => {
    const onFsChange = () => {
      if (document.fullscreenElement) setFullscreenHint(false);
    };
    document.addEventListener("fullscreenchange", onFsChange);
    return () => document.removeEventListener("fullscreenchange", onFsChange);
  }, []);

  const enterFullscreen = async () => {
    const ok = await requestPageFullscreen();
    if (ok) setFullscreenHint(false);
  };

  return (
    <div
      className="h-screen w-screen bg-black overflow-hidden relative"
      onDoubleClick={enterFullscreen}
    >
      <PreviewConsole preview={preview} mediaRef={mediaRef} variant="live" />

      {cacheProgress?.total > 0 && (
        <div
          className="absolute bottom-4 left-4 z-20 text-[#c6c6cd]/80 text-xs border border-[rgba(69,70,77,0.5)] bg-[rgba(11,15,16,0.75)] px-3 py-1.5 rounded-sm"
          style={MONO}
        >
          {t("program.preparingMedia", {
            done: cacheProgress.completed,
            total: cacheProgress.total,
          })}
        </div>
      )}

      {fullscreenHint && (
        <button
          type="button"
          onClick={enterFullscreen}
          className="absolute bottom-4 right-4 z-20 text-[#c6c6cd]/80 text-xs border border-[rgba(69,70,77,0.5)] bg-[rgba(11,15,16,0.75)] px-3 py-1.5 rounded-sm hover:text-[#e0e3e5] hover:border-[#7bd0ff] transition-colors"
          style={MONO}
        >
          {t("live.fullscreenHint")}
        </button>
      )}
    </div>
  );
}

export default Live;
