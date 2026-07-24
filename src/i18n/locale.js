const STORAGE_KEY = "sigueme:locale";
const SUPPORTED = ["es", "en"];

function readStoredLocale() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (SUPPORTED.includes(raw)) return raw;
  } catch {
    // ignore
  }
  return "es";
}

let locale = readStoredLocale();
const listeners = new Set();

export function setLocaleState(next) {
  if (!SUPPORTED.includes(next) || next === locale) return;
  locale = next;
  try {
    localStorage.setItem(STORAGE_KEY, next);
  } catch {
    // ignore quota / private mode
  }
  listeners.forEach((handler) => {
    try {
      handler(locale);
    } catch {
      // ignore
    }
  });
}

export function getLocale() {
  return locale;
}

export function subscribeLocale(handler) {
  listeners.add(handler);
  return () => listeners.delete(handler);
}

export const LOCALES = [
  { id: "es", labelKey: "settingsModal.langEs" },
  { id: "en", labelKey: "settingsModal.langEn" },
];
