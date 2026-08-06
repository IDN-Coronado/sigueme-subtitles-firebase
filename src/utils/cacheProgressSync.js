// Separate channel from mediaSync's "sigueme-media-sync" (playback control:
// play/pause/stop/loop/seek) — cache-prep status is a different concern and
// applyMediaSyncCommand has no case for it, so keeping them apart avoids
// mixing playback-control messages with cache-status ones.
const CHANNEL_NAME = "sigueme-cache-progress";

let channel;

function getChannel() {
  if (typeof BroadcastChannel === "undefined") return null;
  if (!channel) channel = new BroadcastChannel(CHANNEL_NAME);
  return channel;
}

export function publishCacheProgress(message) {
  try {
    getChannel()?.postMessage(message);
  } catch {
    // Channel unavailable
  }
}

export function subscribeCacheProgress(handler) {
  const ch = getChannel();
  if (!ch) return () => {};

  const onMessage = (event) => {
    if (event?.data) handler(event.data);
  };
  ch.addEventListener("message", onMessage);
  return () => ch.removeEventListener("message", onMessage);
}
