import { useEffect, useState } from "react";

// Preview was a Firestore document only so the console and the Live window
// could see the same value. They are two windows on one machine sharing an
// origin, so a BroadcastChannel does the same job without a round trip — and
// without the setDoc/updateDoc merge trap this file used to document, since a
// posted message replaces the value wholesale.
const CHANNEL_NAME = "sigueme-preview";

let channel;
// Last value posted by this window, kept so a Live window that opens *after* a
// preview was set can ask for it. onSnapshot replayed the current value on
// subscribe; a channel has no such replay.
let lastPreview = null;
const listeners = new Set();

function getChannel() {
  if (typeof BroadcastChannel === "undefined") return null;
  if (!channel) {
    channel = new BroadcastChannel(CHANNEL_NAME);
    channel.addEventListener("message", (event) => {
      const data = event?.data;
      if (!data) return;

      if (data.type === "request-state") {
        if (lastPreview) publish(lastPreview);
        return;
      }
      if (data.type === "preview") {
        lastPreview = data.preview;
        listeners.forEach((handler) => handler(data.preview));
      }
    });
  }
  return channel;
}

function publish(preview) {
  lastPreview = preview;
  try {
    getChannel()?.postMessage({ type: "preview", preview });
  } catch {
    // Channel unavailable
  }
}

function usePreview() {
  const [preview, setPreviewState] = useState(lastPreview);

  useEffect(() => {
    const handler = (next) => setPreviewState(next);
    listeners.add(handler);
    getChannel();

    // Ask whoever holds the current value to re-post it. Harmless in the
    // console (it answers itself with what it already has).
    try {
      getChannel()?.postMessage({ type: "request-state" });
    } catch {
      // Channel unavailable
    }

    return () => listeners.delete(handler);
  }, []);

  const setPreview = async (data) => {
    const next = {
      ...(lastPreview || {}),
      ...data,
      updatedAt: new Date().toISOString(),
    };
    setPreviewState(next);
    listeners.forEach((handler) => handler(next));
    publish(next);
  };

  const clearPreviewResource = async () => {
    if (!lastPreview) return;
    const { resource, ...rest } = lastPreview;
    const next = { ...rest, updatedAt: new Date().toISOString() };
    setPreviewState(next);
    listeners.forEach((handler) => handler(next));
    publish(next);
  };

  return { preview, setPreview, clearPreviewResource };
}

export default usePreview;
