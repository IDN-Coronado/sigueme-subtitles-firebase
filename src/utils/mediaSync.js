const CHANNEL_NAME = "sigueme-media-sync";

let channel;

function getChannel() {
  if (typeof BroadcastChannel === "undefined") return null;
  if (!channel) channel = new BroadcastChannel(CHANNEL_NAME);
  return channel;
}

export function publishMediaSync(message) {
  try {
    getChannel()?.postMessage(message);
  } catch {
    // Channel unavailable
  }
}

export function subscribeMediaSync(handler) {
  const ch = getChannel();
  if (!ch) return () => {};

  const onMessage = (event) => {
    if (event?.data) handler(event.data);
  };
  ch.addEventListener("message", onMessage);
  return () => ch.removeEventListener("message", onMessage);
}

export function snapshotMediaState(el, mediaKey) {
  if (!el) return null;
  return {
    type: "state",
    mediaKey,
    playing: !el.paused && !el.ended,
    currentTime: el.currentTime || 0,
    loop: !!el.loop,
  };
}

/**
 * Apply a master command onto a follower media element.
 * Returns true if the command was applied.
 */
export function applyMediaSyncCommand(el, msg, mediaKey) {
  if (!el || !msg) return false;
  if (msg.mediaKey && mediaKey && msg.mediaKey !== mediaKey) return false;

  const setTime = (t) => {
    if (typeof t !== "number" || !Number.isFinite(t)) return;
    if (Math.abs((el.currentTime || 0) - t) > 0.35) {
      try {
        el.currentTime = t;
      } catch {
        // Not seekable yet
      }
    }
  };

  switch (msg.type) {
    case "play": {
      if (typeof msg.loop === "boolean") el.loop = msg.loop;
      setTime(msg.currentTime);
      el.play().catch(() => {});
      return true;
    }
    case "pause": {
      setTime(msg.currentTime);
      el.pause();
      return true;
    }
    case "stop": {
      el.pause();
      try {
        el.currentTime = 0;
      } catch {
        // ignore
      }
      return true;
    }
    case "loop": {
      el.loop = !!msg.loop;
      return true;
    }
    case "seek":
    case "state": {
      if (typeof msg.loop === "boolean") el.loop = msg.loop;
      setTime(msg.currentTime);
      if (msg.playing) {
        el.play().catch(() => {});
      } else {
        el.pause();
      }
      return true;
    }
    default:
      return false;
  }
}
