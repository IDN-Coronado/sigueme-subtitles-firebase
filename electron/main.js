const { app, BrowserWindow, dialog, ipcMain, shell } = require("electron");
const path = require("node:path");

const { startAppServer } = require("./server");
const { signInWithGoogle } = require("./oauth");
const live = require("./liveWindow");

let consoleWindow = null;

const ROOT = path.join(__dirname, "..");
const PORT = 5178;
const isDev = process.argv.includes("--dev");
// Dev mode attaches to an already-running `npm start`; prod serves the build.
// Both are localhost, so the auth and BroadcastChannel behaviour is identical.
const appUrl = isDev ? "http://localhost:5173" : `http://127.0.0.1:${PORT}`;

// GOOGLE_DESKTOP_CLIENT_ID / _SECRET live in .env alongside the VITE_ vars,
// but are read here at runtime rather than inlined into the renderer bundle.
try {
  process.loadEnvFile(path.join(ROOT, ".env"));
} catch {
  // No .env — signInWithGoogle reports the missing vars with a clear error.
}

// app.quit() is asynchronous, so a bare `if (...) app.quit()` would let the
// whole startup below run anyway and collide with the first instance on PORT.
const isFirstInstance = app.requestSingleInstanceLock();
if (!isFirstInstance) app.quit();

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
  if (!isDev) await startAppServer(path.join(ROOT, "dist"), PORT);
  ipcMain.handle("auth:signIn", () => signInWithGoogle());
  ipcMain.handle("liveView:open", () => live.open(appUrl));
  ipcMain.handle("liveView:close", () => live.close());
  ipcMain.handle("liveView:isOpen", () => live.isOpen());

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
