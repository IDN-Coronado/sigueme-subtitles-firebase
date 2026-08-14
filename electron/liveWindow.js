const { BrowserWindow, screen } = require("electron");
const path = require("node:path");

let liveWindow = null;
const listeners = new Set();

function isOpen() {
  return Boolean(liveWindow && !liveWindow.isDestroyed());
}

function notify() {
  const open = isOpen();
  for (const send of listeners) send(open);
}

/**
 * First non-primary display, or null when there is only one. Replaces the
 * browser's getScreenDetails() path, which needed the Window Management
 * permission and could still be denied.
 */
function pickDisplay(displays, primaryId) {
  return displays.find((d) => d.id !== primaryId) || null;
}

function open(appUrl) {
  if (isOpen()) {
    liveWindow.focus();
    return;
  }

  const display = pickDisplay(screen.getAllDisplays(), screen.getPrimaryDisplay().id);
  const bounds = display?.bounds;

  liveWindow = new BrowserWindow({
    ...(bounds
      ? { x: bounds.x, y: bounds.y, width: bounds.width, height: bounds.height }
      : { width: 1280, height: 720 }),
    // Only take over the screen when there is a second one. On a single
    // display, fullscreen would cover the console the operator drives from.
    fullscreen: Boolean(display),
    frame: false,
    backgroundColor: "#000000",
    webPreferences: {
      // Same preload as the console: the live view does not call into it, but
      // window.desktop is what tells the renderer to skip service worker
      // registration (see src/index.jsx).
      preload: path.join(__dirname, "preload.js"),
      contextIsolation: true,
      nodeIntegration: false,
    },
  });

  liveWindow.on("closed", () => {
    liveWindow = null;
    notify();
  });

  liveWindow.loadURL(`${appUrl}/live`);
  notify();
}

function close() {
  if (isOpen()) liveWindow.close();
}

function subscribe(send) {
  listeners.add(send);
  return () => listeners.delete(send);
}

module.exports = { open, close, isOpen, subscribe, pickDisplay };
