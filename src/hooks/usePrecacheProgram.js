import { useCallback, useRef, useState } from "react";

import { precacheSchedule } from "../utils/precacheSchedule";

// Thin React wrapper around precacheSchedule. Tracks per-item progress and
// guards against overlapping runs (e.g. rapidly switching which program is
// active) with a run token — stale progress updates from a superseded run
// are ignored rather than clobbering the current one.
function usePrecacheProgram() {
  const [status, setStatus] = useState("idle"); // idle | running | done | error
  const [progress, setProgress] = useState({}); // { [itemId]: { status, url, ... } }
  const runToken = useRef(0);

  const run = useCallback(async (schedule) => {
    const token = ++runToken.current;
    setStatus("running");
    setProgress({});

    try {
      await precacheSchedule(schedule, {
        onProgress: (update) => {
          if (runToken.current !== token) return;
          setProgress((prev) => ({ ...prev, [update.id]: update }));
        },
      });
      if (runToken.current === token) setStatus("done");
    } catch {
      if (runToken.current === token) setStatus("error");
    }
  }, []);

  return { status, progress, run };
}

export default usePrecacheProgram;
