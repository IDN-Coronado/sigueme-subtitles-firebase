import { useEffect, useState } from "react";

import {
  getCaptionSettings,
  subscribeCaptionSettings,
} from "../utils/captionSettings";

/**
 * Shared caption (CC) display settings for Console and Live View.
 */
export default function useCaptionSettings() {
  const [settings, setSettings] = useState(getCaptionSettings);

  useEffect(() => subscribeCaptionSettings(setSettings), []);

  return settings;
}
