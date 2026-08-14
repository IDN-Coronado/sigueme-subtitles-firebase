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
 * A display other than the one the console is on, or null if there isn't one.
 *
 * Deliberately keyed on the console's display rather than "not primary": the
 * operator may have dragged the console onto the secondary screen, and picking
 * by primary would then drop a fullscreen window straight on top of it.
 * Replaces the browser's getScreenDetails() path, which needed the Window
 * Management permission and could still be denied.
 */
function pickDisplay(displays, consoleDisplayId) {
  return displays.find((d) => d.id !== consoleDisplayId) || null;
}

function open(appUrl, consoleWindow) {
  if (isOpen()) {
    liveWindow.focus();
    return;
  }

  const consoleDisplay =
    consoleWindow && !consoleWindow.isDestroyed()
      ? screen.getDisplayMatching(consoleWindow.getBounds())
      : screen.getPrimaryDisplay();

  const display = pickDisplay(screen.getAllDisplays(), consoleDisplay.id);
  const bounds = display?.bounds;

  liveWindow = new BrowserWindow({
    ...(bounds
      ? { x: bounds.x, y: bounds.y, width: bounds.width, height: bounds.height }
      : { width: 1280, height: 720 }),
    // Fullscreen only when there is a screen to take over that the console is
    // not on. Otherwise it would cover the console the operator drives from.
    fullscreen: Boolean(display),
    // Frameless only when fullscreen. A frameless *windowed* live view has no
    // title bar, so no close button and nothing behind it to click — there
    // would be no way to get rid of it. Escape closes it either way, below.
    frame: !display,
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

  // The escape hatch. A fullscreen frameless window on the projector has no
  // close button, and if it ever lands on the same screen as the console there
  // is nothing clickable behind it either — Escape is the only way out that
  // does not depend on where the window ended up.
  liveWindow.webContents.on("before-input-event", (_event, input) => {
    if (input.type === "keyDown" && input.key === "Escape") close();
  });

  liveWindow.on("closed", () => {
    liveWindow = null;
    notify();
    // Hand focus back, so closing the live view never leaves the operator
    // looking at whatever was behind it.
    if (consoleWindow && !consoleWindow.isDestroyed()) consoleWindow.focus();
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
