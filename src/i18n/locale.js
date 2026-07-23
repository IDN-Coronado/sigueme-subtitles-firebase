let locale = "es";

export function setLocaleState(next) {
  locale = next;
}

export function getLocale() {
  return locale;
}
