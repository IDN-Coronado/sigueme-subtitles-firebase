import { useEffect, useRef } from "react";

import { createPdfDocument, fetchPdfArrayBuffer } from "../../utils/pdf";

/**
 * Renders a PDF page into a canvas sized to the live stage.
 * slideIndex is 0-based and driven by Firestore preview state — the field is
 * shared with the rest of the media schema, so a page is a "slide" here.
 */
function PdfStage({
  url,
  storagePath,
  slideIndex = 0,
  stageWidth,
  stageHeight,
  onLoaded,
}) {
  const wrapRef = useRef(null);
  const canvasRef = useRef(null);
  const docRef = useRef(null);
  const renderTaskRef = useRef(null);
  const loadedKeyRef = useRef(null);
  const slideIndexRef = useRef(slideIndex);
  const onLoadedRef = useRef(onLoaded);
  const stageSizeRef = useRef({ width: stageWidth, height: stageHeight });
  const sourceKey = storagePath || url || "";

  slideIndexRef.current = slideIndex;
  onLoadedRef.current = onLoaded;
  stageSizeRef.current = { width: stageWidth, height: stageHeight };

  const resolveSize = () => {
    const fromPropsW = Number(stageSizeRef.current.width);
    const fromPropsH = Number(stageSizeRef.current.height);
    if (
      Number.isFinite(fromPropsW) &&
      Number.isFinite(fromPropsH) &&
      fromPropsW > 0 &&
      fromPropsH > 0
    ) {
      return {
        width: Math.round(fromPropsW),
        height: Math.round(fromPropsH),
      };
    }
    const el = wrapRef.current;
    return {
      width: Math.max(1, Math.round(el?.clientWidth) || 1),
      height: Math.max(1, Math.round(el?.clientHeight) || 1),
    };
  };

  const renderCurrent = async () => {
    const pdf = docRef.current;
    const canvas = canvasRef.current;
    if (!pdf || !canvas) return;

    const count = pdf.numPages;
    if (!count || count < 1) return;
    const index = Math.max(
      0,
      Math.min(count - 1, Number(slideIndexRef.current) || 0)
    );

    const page = await pdf.getPage(index + 1);
    const { width, height } = resolveSize();
    const base = page.getViewport({ scale: 1 });
    const scale =
      Math.min(width / base.width, height / base.height) || 1;
    const viewport = page.getViewport({ scale });

    // A page still painting is stale the moment the index or size changes.
    renderTaskRef.current?.cancel();

    canvas.width = Math.max(1, Math.round(viewport.width));
    canvas.height = Math.max(1, Math.round(viewport.height));
    canvas.style.width = `${canvas.width}px`;
    canvas.style.height = `${canvas.height}px`;

    const task = page.render({ canvas, viewport });
    renderTaskRef.current = task;
    try {
      await task.promise;
    } catch (err) {
      if (err?.name !== "RenderingCancelledException") throw err;
    }
  };

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas || !sourceKey) return undefined;

    let cancelled = false;
    let resizeObserver = null;

    const load = async () => {
      try {
        const buffer = await fetchPdfArrayBuffer({ url, storagePath });
        if (cancelled) return;

        const pdf = await createPdfDocument(buffer);
        if (cancelled) {
          pdf.destroy();
          return;
        }
        docRef.current = pdf;

        loadedKeyRef.current = sourceKey;
        onLoadedRef.current?.({ slideCount: pdf.numPages });
        await renderCurrent();
      } catch (err) {
        console.error("Failed to load PDF for stage", err);
      }
    };

    load();

    resizeObserver = new ResizeObserver(() => {
      if (!docRef.current) return;
      renderCurrent().catch(() => {});
    });
    if (wrapRef.current) resizeObserver.observe(wrapRef.current);

    return () => {
      cancelled = true;
      resizeObserver?.disconnect();
      renderTaskRef.current?.cancel();
      renderTaskRef.current = null;
      docRef.current?.destroy();
      docRef.current = null;
      loadedKeyRef.current = null;
    };
  }, [sourceKey, url, storagePath]);

  useEffect(() => {
    if (!docRef.current || loadedKeyRef.current !== sourceKey) return;
    renderCurrent().catch(() => {});
  }, [slideIndex, sourceKey, stageWidth, stageHeight]);

  return (
    <div
      ref={wrapRef}
      className="absolute inset-0 overflow-hidden bg-black flex items-center justify-center"
    >
      <canvas ref={canvasRef} className="block" aria-hidden />
    </div>
  );
}

export default PdfStage;
