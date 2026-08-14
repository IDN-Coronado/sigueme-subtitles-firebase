// The live view is a real BrowserWindow on the second display, created by the
// main process (electron/liveWindow.js). The browser popup implementation this
// file used to carry — window.open with getScreenDetails placement and a 500ms
// poll to notice it had closed — is gone with the web console.

const listeners = new Set();
let open = false;

function notify() {
  listeners.forEach((handler) => {
    try {
      handler(open);
    } catch {
      // ignore
    }
  });
}

window.desktop?.liveView.onChange((next) => {
  open = next;
  notify();
});

// Synchronous because useLiveViewOpen seeds useState with it. False is correct
// at startup — the live window only exists once this console asks for it.
export function isLiveViewOpen() {
  return open;
}

export function closeLiveView() {
  window.desktop?.liveView.close();
}

export function subscribeLiveViewOpen(handler) {
  listeners.add(handler);
  handler(open);
  return () => listeners.delete(handler);
}

export async function openLiveView() {
  await window.desktop?.liveView.open();
  return null;
}

export default openLiveView;
