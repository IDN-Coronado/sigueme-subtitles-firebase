const LIVE_WINDOW_NAME = "sigueme-live-view";

let liveWindow = null;
let pollId = null;
const listeners = new Set();

function liveViewUrl() {
  return `${window.location.origin}/live`;
}

function notify() {
  const open = isLiveViewOpen();
  listeners.forEach((handler) => {
    try {
      handler(open);
    } catch {
      // ignore
    }
  });
}

// Under Electron the live view is a real BrowserWindow on the second display
// (electron/liveWindow.js): no Window Management permission, no popup blocker,
// no polling for close, and real fullscreen without a user gesture. The
// browser implementation below stays for the deployed web console.
const desktopLive =
  typeof window !== "undefined" ? window.desktop?.liveView : null;

// isLiveViewOpen() is synchronous (useLiveViewOpen seeds useState with it), so
// main's state is mirrored here rather than awaited. False is correct at
// startup — the live window only exists once this console asks for it.
let desktopOpen = false;

if (desktopLive) {
  desktopLive.onChange((open) => {
    desktopOpen = open;
    notify();
  });
}

function stopPolling() {
  if (pollId != null) {
    window.clearInterval(pollId);
    pollId = null;
  }
}

function startPolling() {
  stopPolling();
  pollId = window.setInterval(() => {
    if (!liveWindow || liveWindow.closed) {
      liveWindow = null;
      stopPolling();
      notify();
    }
  }, 500);
}

function screenFeatures(screen) {
  return [
    `left=${Math.round(screen.availLeft)}`,
    `top=${Math.round(screen.availTop)}`,
    `width=${Math.round(screen.availWidth)}`,
    `height=${Math.round(screen.availHeight)}`,
    "popup=yes",
  ].join(",");
}

function placeOnScreen(win, screen) {
  if (!win || win.closed || !screen) return;
  try {
    win.moveTo(Math.round(screen.availLeft), Math.round(screen.availTop));
    win.resizeTo(
      Math.round(screen.availWidth),
      Math.round(screen.availHeight)
    );
  } catch {
    // Cross-screen move may fail without Window Management permission
  }
}

async function resolveTargetScreen() {
  if (!("getScreenDetails" in window)) return null;

  try {
    const details = await window.getScreenDetails();
    const screens = details?.screens || [];
    if (screens.length < 2) return null;

    const current = details.currentScreen;
    return (
      screens.find((s) => s !== current) ||
      screens.find((s) => !s.isPrimary) ||
      screens[1] ||
      null
    );
  } catch {
    return null;
  }
}

export function isLiveViewOpen() {
  if (desktopLive) return desktopOpen;
  return Boolean(liveWindow && !liveWindow.closed);
}

export function closeLiveView() {
  if (desktopLive) {
    desktopLive.close();
    return;
  }

  if (liveWindow && !liveWindow.closed) {
    try {
      liveWindow.close();
    } catch {
      // ignore
    }
  }
  liveWindow = null;
  stopPolling();
  notify();
}

export function subscribeLiveViewOpen(handler) {
  listeners.add(handler);
  handler(isLiveViewOpen());
  return () => listeners.delete(handler);
}

/**
 * Opens the Live View window on a secondary display when the
 * Window Management API is available; otherwise opens a normal popup.
 * Returns the opened window, or null if blocked.
 */
export async function openLiveView() {
  if (desktopLive) {
    await desktopLive.open();
    return null;
  }

  const url = liveViewUrl();
  const targetScreen = await resolveTargetScreen();
  const features = targetScreen
    ? screenFeatures(targetScreen)
    : "popup=yes,width=1280,height=720";

  let win = window.open(url, LIVE_WINDOW_NAME, features);

  // If the permission prompt consumed the user gesture, retry without features.
  if (!win) {
    win = window.open(url, LIVE_WINDOW_NAME);
  }

  if (win && targetScreen) {
    placeOnScreen(win, targetScreen);
  }

  if (win) {
    liveWindow = win;
    startPolling();
    notify();
    win.focus();
  }

  return win;
}

export default openLiveView;
