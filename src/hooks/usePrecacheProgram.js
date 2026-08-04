import { useCallback, useRef, useState } from "react";

import { precacheSchedule } from "../utils/precacheSchedule";

// Thin React wrapper around precacheSchedule. Tracks per-item progress and
// guards against overlapping runs (e.g. rapidly switching which program is
// active) with a run token — stale progress updates from a superseded run
// are ignored rather than clobbering the current one.
//
// `status` reflects precacheSchedule's own verified outcome — "success"
// only when every target was confirmed written to Cache Storage, never
// just because the run finished without throwing. See precacheSchedule for
// the full status vocabulary (success/partial/error/unavailable).
function usePrecacheProgram() {
  const [status, setStatus] = useState("idle"); // idle | running | success | partial | error | unavailable
  const [progress, setProgress] = useState({}); // { [itemId]: { status, url, ... } }
  const runToken = useRef(0);

  const run = useCallback(async (schedule, mainLogo) => {
    const token = ++runToken.current;
    setStatus("running");
    setProgress({});

    try {
      const result = await precacheSchedule(schedule, {
        mainLogo,
        onProgress: (update) => {
          if (runToken.current !== token) return;
          setProgress((prev) => ({ ...prev, [update.id]: update }));
        },
      });
      if (runToken.current === token) setStatus(result.status);
    } catch {
      if (runToken.current === token) setStatus("error");
    }
  }, []);

  return { status, progress, run };
}

export default usePrecacheProgram;
