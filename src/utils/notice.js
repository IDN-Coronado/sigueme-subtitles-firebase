import { create } from "zustand";

// One error surface for the whole console. Replaces alert(), which blocks the
// window — genuinely bad mid-service, when the operator needs the console to
// stay usable while they read what went wrong.
//
// A store rather than per-component state because the failures come from four
// different components; the banner itself is rendered once, in the app shell.
const useNotice = create((set) => ({
  notice: null, // { title, error } | null
  showError: (title, error = null) => set({ notice: { title, error } }),
  clearNotice: () => set({ notice: null }),
}));

export default useNotice;

/** Callable from outside React (event handlers, catch blocks). */
export const showError = (title, error) =>
  useNotice.getState().showError(title, error);

export const clearNotice = () => useNotice.getState().clearNotice();
