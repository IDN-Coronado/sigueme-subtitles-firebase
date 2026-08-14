const { contextBridge, ipcRenderer } = require("electron");

// Presence of window.desktop is also how the renderer detects Electron
// (see src/index.jsx, src/components/AuthGate.jsx) — no separate flag needed.
contextBridge.exposeInMainWorld("desktop", {
  signIn: () => ipcRenderer.invoke("auth:signIn"),
  store: {
    load: () => ipcRenderer.invoke("store:load"),
    save: (data) => ipcRenderer.invoke("store:save", data),
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
