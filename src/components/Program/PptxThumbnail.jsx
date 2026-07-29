import { useEffect, useState } from "react";

import { t } from "../../i18n";
import {
  createPptxViewer,
  fetchPptxArrayBuffer,
  getCachedPptxThumbnail,
  setCachedPptxThumbnail,
} from "../../utils/pptx";
import { MONO } from "./constants";

/**
 * On-demand first-slide thumbnail for a .pptx media item.
 * Renders off-screen once, then shows a cached data URL image.
 */
function PptxThumbnail({
  url,
  storagePath,
  alt = "",
  className = "w-full h-full object-cover",
}) {
  const [src, setSrc] = useState(() => getCachedPptxThumbnail(url));
  const [failed, setFailed] = useState(false);

  useEffect(() => {
    const cached = getCachedPptxThumbnail(url);
    if (cached) {
      setSrc(cached);
      setFailed(false);
      return undefined;
    }

    if (!url && !storagePath) return undefined;
    let cancelled = false;
    setSrc(null);
    setFailed(false);

    const canvas = document.createElement("canvas");
    canvas.width = 640;
    canvas.height = 360;

    (async () => {
      try {
        const viewer = await createPptxViewer(canvas);
        const buffer = await fetchPptxArrayBuffer({ url, storagePath });
        await viewer.loadFile(buffer);
        await viewer.render(canvas, { slideIndex: 0 });
        const dataUrl = canvas.toDataURL("image/jpeg", 0.82);
        if (url) setCachedPptxThumbnail(url, dataUrl);
        if (!cancelled) setSrc(dataUrl);
      } catch (err) {
        console.error("Failed to render PPTX thumbnail", err);
        if (!cancelled) setFailed(true);
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [url, storagePath]);

  if (src) {
    return <img src={src} alt={alt} className={className} />;
  }

  if (failed) {
    return (
      <div
        className="w-full h-full flex items-center justify-center text-[#45464d] text-[8px]"
        style={MONO}
      >
        {t("media.pptxBadge")}
      </div>
    );
  }

  return (
    <div
      className="w-full h-full flex items-center justify-center text-[#45464d] text-[8px]"
      style={MONO}
    >
      {t("common.loading")}
    </div>
  );
}

export default PptxThumbnail;
