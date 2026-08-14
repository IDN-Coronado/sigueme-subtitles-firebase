const { contextBridge, ipcRenderer } = require("electron");

// Presence of window.desktop is also how the renderer detects Electron
// (see src/index.jsx, src/components/AuthGate.jsx) — no separate flag needed.
contextBridge.exposeInMainWorld("desktop", {
  signIn: () => ipcRenderer.invoke("auth:signIn"),
});
