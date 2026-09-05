import { useEffect, useState } from "react";

import { t } from "../../i18n";
import {
  createPdfDocument,
  fetchPdfArrayBuffer,
  getCachedPdfThumbnail,
  setCachedPdfThumbnail,
} from "../../utils/pdf";
import { MONO } from "./constants";

/**
 * On-demand first-page thumbnail for a .pdf media item.
 * Renders off-screen once, then shows a cached data URL image.
 */
function PdfThumbnail({
  url,
  storagePath,
  alt = "",
  className = "w-full h-full object-cover",
}) {
  const [src, setSrc] = useState(() => getCachedPdfThumbnail(url));
  const [failed, setFailed] = useState(false);

  useEffect(() => {
    const cached = getCachedPdfThumbnail(url);
    if (cached) {
      setSrc(cached);
      setFailed(false);
      return undefined;
    }

    if (!url && !storagePath) return undefined;
    let cancelled = false;
    setSrc(null);
    setFailed(false);

    (async () => {
      let pdf = null;
      try {
        const buffer = await fetchPdfArrayBuffer({ url, storagePath });
        pdf = await createPdfDocument(buffer);
        const page = await pdf.getPage(1);

        const base = page.getViewport({ scale: 1 });
        const viewport = page.getViewport({
          scale: (640 / base.width) || 1,
        });

        const canvas = document.createElement("canvas");
        canvas.width = Math.max(1, Math.round(viewport.width));
        canvas.height = Math.max(1, Math.round(viewport.height));

        await page.render({ canvas, viewport }).promise;
        const dataUrl = canvas.toDataURL("image/jpeg", 0.82);
        if (url) setCachedPdfThumbnail(url, dataUrl);
        if (!cancelled) setSrc(dataUrl);
      } catch (err) {
        console.error("Failed to render PDF thumbnail", err);
        if (!cancelled) setFailed(true);
      } finally {
        pdf?.destroy();
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
        {t("media.pdfBadge")}
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

export default PdfThumbnail;
