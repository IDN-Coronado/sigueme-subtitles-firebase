import { useEffect, useState } from "react";

import {
  getLiveViewSize,
  requestLiveViewSize,
  subscribeLiveViewSize,
} from "../utils/liveViewSize";

/**
 * Live viewport size for scaling the console preview.
 * Uses the last reported size (localStorage) and requests a fresh
 * reading when the live window is open.
 */
export default function useLiveViewSize() {
  const [size, setSize] = useState(getLiveViewSize);

  useEffect(() => {
    requestLiveViewSize();
    return subscribeLiveViewSize(setSize);
  }, []);

  return size;
}
