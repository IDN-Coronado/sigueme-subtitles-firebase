import dayjs from "dayjs";
import advancedFormat from "dayjs/plugin/advancedFormat";
import "dayjs/locale/es";

import { getLocale } from "./locale";

dayjs.extend(advancedFormat);

/**
 * Locale-aware program date for the top bar.
 * es → "14 DE JUNIO"
 * en → "JUNE 14TH"
 */
export function formatProgramDate(date) {
  if (!date) return "";
  const value = typeof date?.toDate === "function" ? date.toDate() : date;
  const parsed = dayjs(value);
  if (!parsed.isValid()) return "";

  const locale = getLocale();
  if (locale === "en") {
    return parsed.locale("en").format("MMMM Do").toUpperCase();
  }

  return parsed.locale("es").format("D [DE] MMMM").toUpperCase();
}
