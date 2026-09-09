const { contextBridge, ipcRenderer } = require("electron");

// Presence of window.desktop is also how the renderer detects Electron
// (see src/index.jsx, src/components/DesktopGate.jsx) — no separate flag needed.
contextBridge.exposeInMainWorld("desktop", {
  credentials: {
    load: () => ipcRenderer.invoke("credentials:load"),
    save: (c) => ipcRenderer.invoke("credentials:save", c),
  },
  store: {
    load: () => ipcRenderer.invoke("store:load"),
    save: (data) => ipcRenderer.invoke("store:save", data),
  },
  media: {
    list: () => ipcRenderer.invoke("media:list"),
    save: (storagePath, bytes) =>
      ipcRenderer.invoke("media:save", storagePath, bytes),
    remove: (storagePath) => ipcRenderer.invoke("media:remove", storagePath),
    exists: (storagePath) => ipcRenderer.invoke("media:exists", storagePath),
  },
  liveView: {
    open: () => ipcRenderer.invoke("liveView:open"),
    close: () => ipcRenderer.invoke("liveView:close"),
    isOpen: () => ipcRenderer.invoke("liveView:isOpen"),
    onChange: (handler) => {
      const listener = (_event, open) => handler(open);
      ipcRenderer.on("liveView:changed", listener);
      return () => ipcRenderer.off("liveView:changed", listener);
    },
  },
});
