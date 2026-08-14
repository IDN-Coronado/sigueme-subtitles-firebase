const { app, BrowserWindow, ipcMain, shell } = require("electron");
const path = require("node:path");

const { startAppServer } = require("./server");
const { signInWithGoogle } = require("./oauth");

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

if (!app.requestSingleInstanceLock()) app.quit();

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

  // Keeps openLiveView.js's window.open working unchanged; step 2 replaces it
  // with a real BrowserWindow placed on the second display. Anything not on
  // our own origin (YouTube links, OAuth) goes to the system browser.
  win.webContents.setWindowOpenHandler(({ url }) => {
    if (url.startsWith(appUrl)) return { action: "allow" };
    shell.openExternal(url);
    return { action: "deny" };
  });

  return win.loadURL(appUrl);
}

app.whenReady().then(async () => {
  if (!isDev) await startAppServer(path.join(ROOT, "dist"), PORT);
  ipcMain.handle("auth:signIn", () => signInWithGoogle());
  await createWindow();

  app.on("activate", () => {
    if (BrowserWindow.getAllWindows().length === 0) createWindow();
  });
});

app.on("second-instance", () => {
  const [win] = BrowserWindow.getAllWindows();
  if (win) win.focus();
});

app.on("window-all-closed", () => app.quit());
