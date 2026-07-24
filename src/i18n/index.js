import es from "./es";
import en from "./en";
import { getLocale, setLocaleState } from "./locale";

const catalogs = { es, en };

export function setLocale(next) {
  if (catalogs[next]) setLocaleState(next);
}

export { getLocale };

/**
 * Resolve a dotted key from the active locale catalog.
 * @param {string} key e.g. "confirm.deleteMedia"
 * @param {Record<string, string|number>} [vars] optional `{name}` replacements
 * @returns {string}
 */
export function t(key, vars) {
  const parts = String(key).split(".");
  let node = catalogs[getLocale()];
  for (const part of parts) {
    if (node == null || typeof node !== "object") return key;
    node = node[part];
  }
  let str = typeof node === "string" ? node : key;
  if (vars && typeof vars === "object") {
    for (const [name, value] of Object.entries(vars)) {
      str = str.replaceAll(`{${name}}`, String(value));
    }
  }
  return str;
}

export { formatProgramDate } from "./formatProgramDate";

export default catalogs[getLocale()];
