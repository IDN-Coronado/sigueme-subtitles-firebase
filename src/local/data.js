import { create } from "zustand";

// The console is desktop-only now (App.jsx renders a notice in a browser), so
// these hooks can assume window.desktop exists. The whole dataset is one JSON
// file — see electron/store.js for why it is a file and not a database.
const EMPTY = { programs: [], songs: [], themes: [], media: [] };

const useDataStore = create((set, get) => ({
  data: EMPTY,
  loaded: false,
  error: null,

  hydrate: async () => {
    if (get().loaded) return;
    try {
      const stored = await window.desktop.store.load();
      set({ data: { ...EMPTY, ...stored }, loaded: true, error: null });
    } catch (err) {
      // Surfaced by LocalDataGate rather than falling back to an empty store:
      // a corrupt file that reads as "no data" would invite a re-import over
      // the only copy of the library.
      set({ error: err });
    }
  },

  // Whole-file write. The renderer holds the authoritative copy and there is
  // only ever one console window, so last-write-wins is the whole story.
  write: (patch) => {
    const data = { ...get().data, ...patch };
    set({ data });
    return window.desktop.store.save(data);
  },
}));

export default useDataStore;

export const newId = () => crypto.randomUUID();

export function byTitle(a, b) {
  return String(a.title || "").localeCompare(String(b.title || ""), undefined, {
    sensitivity: "base",
  });
}
