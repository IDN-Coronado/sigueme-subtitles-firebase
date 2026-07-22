const LIVE_WINDOW_NAME = "sigueme-live-view";

function liveViewUrl() {
  return `${window.location.origin}/live`;
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

/**
 * Opens the Live View window on a secondary display when the
 * Window Management API is available; otherwise opens a normal popup.
 * Returns the opened window, or null if blocked.
 */
export async function openLiveView() {
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

  win?.focus();
  return win;
}

export default openLiveView;
