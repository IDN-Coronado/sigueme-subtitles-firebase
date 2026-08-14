import dayjs from "dayjs";
import advancedFormat from "dayjs/plugin/advancedFormat";
import "dayjs/locale/es";

import { getLocale } from "./locale";

dayjs.extend(advancedFormat);

/**
 * Program dates were Firestore Timestamps; in the local store they are ISO
 * strings, since JSON has no date type. Programs imported from Firestore keep
 * whichever shape they were written with, so every reader normalizes here.
 */
export function toProgramDate(date) {
  return typeof date?.toDate === "function" ? date.toDate() : date;
}

/**
 * Locale-aware program date for the top bar.
 * es → "14 DE JUNIO"
 * en → "JUNE 14TH"
 */
export function formatProgramDate(date) {
  if (!date) return "";
  const parsed = dayjs(toProgramDate(date));
  if (!parsed.isValid()) return "";

  const locale = getLocale();
  if (locale === "en") {
    return parsed.locale("en").format("MMMM Do").toUpperCase();
  }

  return parsed.locale("es").format("D [DE] MMMM").toUpperCase();
}
