const { app, BrowserWindow, dialog, ipcMain, shell } = require("electron");
const path = require("node:path");

const { startAppServer } = require("./server");
const live = require("./liveWindow");
const store = require("./store");
const credentials = require("./credentials");
const media = require("./media");

let consoleWindow = null;

const ROOT = path.join(__dirname, "..");
const PORT = 5178;
const isDev = process.argv.includes("--dev");
// Dev mode attaches to an already-running `npm start`; prod serves the build.
// Both are localhost, so the auth and BroadcastChannel behaviour is identical.
const appUrl = isDev ? "http://localhost:5173" : `http://127.0.0.1:${PORT}`;

// app.quit() is asynchronous, so a bare `if (...) app.quit()` would let the
// whole startup below run anyway and collide with the first instance on PORT.
const isFirstInstance = app.requestSingleInstanceLock();
if (!isFirstInstance) {
  // Say so, loudly. `npm run desktop` rebuilds dist and then lands here, which
  // looks exactly like "my changes did nothing" — the running window is still
  // showing the bundle it loaded at startup.
  console.warn(
    "Apostello is already running; focusing that window instead.\n" +
      "Quit it first if you rebuilt and expected to see changes."
  );
  app.quit();
}

function createWindow() {
  const win = new BrowserWindow({
    width: 1440,
    height: 900,
    backgroundColor: "#101415",
    webPreferences: {
      preload: path.join(__dirname, "preload.js"),
      contextIsolation: true,
      nodeIntegration: false,
    },
  });
  consoleWindow = win;

  // The live view is a real BrowserWindow now (see liveWindow.js), so nothing
  // on our own origin should open as a popup. Everything external — YouTube
  // links, the OAuth consent page — goes to the system browser.
  win.webContents.setWindowOpenHandler(({ url }) => {
    shell.openExternal(url);
    return { action: "deny" };
  });

  // Closing the console takes the live view with it; leaving a frameless
  // fullscreen window stranded on the projector with no way to reach it.
  win.on("closed", () => {
    consoleWindow = null;
    live.close();
  });

  return win.loadURL(appUrl);
}

async function start() {
  // Started in dev too: the renderer loads from vite there, but media still
  // comes from here, proxied by vite's /media rule so asset URLs stay relative
  // in both modes.
  await startAppServer(path.join(ROOT, "dist"), PORT, media.mediaRoot());
  ipcMain.handle("liveView:open", () => live.open(appUrl, consoleWindow));
  ipcMain.handle("liveView:close", () => live.close());
  ipcMain.handle("liveView:isOpen", () => live.isOpen());
  ipcMain.handle("credentials:load", () => credentials.load());
  ipcMain.handle("credentials:save", (_event, c) => credentials.save(c));
  ipcMain.handle("store:load", () => store.load());
  ipcMain.handle("store:save", (_event, data) => store.save(data));
  ipcMain.handle("media:list", () => media.list());
  ipcMain.handle("media:save", (_event, p, bytes) => media.save(p, bytes));
  ipcMain.handle("media:remove", (_event, p) => media.remove(p));
  ipcMain.handle("media:exists", (_event, p) => media.exists(p));

  live.subscribe((open) => {
    if (consoleWindow && !consoleWindow.isDestroyed()) {
      consoleWindow.webContents.send("liveView:changed", open);
    }
  });

  await createWindow();

  app.on("activate", () => {
    if (BrowserWindow.getAllWindows().length === 0) createWindow();
  });
}

if (isFirstInstance) {
  app.whenReady().then(() =>
    // Startup failures are silent otherwise: the app would sit with no window
    // and an unhandled rejection in a console nobody is reading.
    start().catch((err) => {
      dialog.showErrorBox("Apostello could not start", String(err?.message || err));
      app.quit();
    })
  );

  app.on("second-instance", () => {
    if (consoleWindow && !consoleWindow.isDestroyed()) {
      if (consoleWindow.isMinimized()) consoleWindow.restore();
      consoleWindow.focus();
    }
  });
}

app.on("window-all-closed", () => app.quit());
