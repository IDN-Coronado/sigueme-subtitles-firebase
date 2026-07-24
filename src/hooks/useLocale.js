import { useEffect, useState } from "react";

import { getLocale, subscribeLocale } from "../i18n/locale";

/** Subscribe to app locale so UI re-renders when language changes. */
export default function useLocale() {
  const [locale, setLocale] = useState(getLocale);
  useEffect(() => subscribeLocale(setLocale), []);
  return locale;
}
