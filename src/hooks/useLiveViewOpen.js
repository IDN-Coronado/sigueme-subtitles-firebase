import { useEffect, useState } from "react";

import {
  isLiveViewOpen,
  subscribeLiveViewOpen,
} from "../utils/openLiveView";

/** Whether the Live View popup window is currently open. */
export default function useLiveViewOpen() {
  const [open, setOpen] = useState(isLiveViewOpen);
  useEffect(() => subscribeLiveViewOpen(setOpen), []);
  return open;
}
