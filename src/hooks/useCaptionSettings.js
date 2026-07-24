import { useEffect, useState } from "react";

import {
  getEffectiveCaptionBundle,
  getStyleFromBundle,
  subscribeCaptionSettings,
} from "../utils/captionSettings";

/**
 * Effective caption styles for a program (program override or global).
 * Returns `{ song, bible }`.
 */
export default function useCaptionSettings(programId) {
  const [bundle, setBundle] = useState(() =>
    getEffectiveCaptionBundle(programId)
  );

  useEffect(() => {
    const sync = () => setBundle(getEffectiveCaptionBundle(programId));
    sync();
    return subscribeCaptionSettings(sync);
  }, [programId]);

  return bundle;
}

/**
 * Single style for a content type within a program context.
 */
export function useCaptionStyle(programId, contentType) {
  const bundle = useCaptionSettings(programId);
  return getStyleFromBundle(bundle, contentType);
}
