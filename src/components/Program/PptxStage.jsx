import { useEffect, useRef } from "react";

import { createPptxViewer, fetchPptxArrayBuffer } from "../../utils/pptx";

/**
 * pptxviewjs uses canvas.style.width/height (parseFloat) when set.
 * Percentage values like "100%" become 100px — always set explicit px.
 * Prefer layout size, not getBoundingClientRect, because the console stage
 * is CSS-scaled inside ScaledLiveStage.
 */
function applyCanvasCssSize(canvas, width, height) {
  if (!canvas) return false;
  const w = Math.max(1, Math.round(width) || 1);
  const h = Math.max(1, Math.round(height) || 1);
  const nextW = `${w}px`;
  const nextH = `${h}px`;
  if (canvas.style.width === nextW && canvas.style.height === nextH) {
    return false;
  }
  canvas.style.width = nextW;
  canvas.style.height = nextH;
  return true;
}

/**
 * Renders a PPTX slide into a canvas sized to the live stage.
 * slideIndex is 0-based and driven by Firestore preview state.
 */
function PptxStage({
  url,
  storagePath,
  slideIndex = 0,
  stageWidth,
  stageHeight,
  onLoaded,
}) {
  const wrapRef = useRef(null);
  const canvasRef = useRef(null);
  const viewerRef = useRef(null);
  const loadedKeyRef = useRef(null);
  const slideIndexRef = useRef(slideIndex);
  const onLoadedRef = useRef(onLoaded);
  const stageSizeRef = useRef({ width: stageWidth, height: stageHeight });
  const renderSeqRef = useRef(0);
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
    const viewer = viewerRef.current;
    const canvas = canvasRef.current;
    if (!viewer?.isLoaded || !canvas) return;

    const { width, height } = resolveSize();
    applyCanvasCssSize(canvas, width, height);

    const count = viewer.getSlideCount();
    if (!count || count < 1) return;
    const index = Math.max(
      0,
      Math.min(count - 1, Number(slideIndexRef.current) || 0)
    );

    const seq = ++renderSeqRef.current;
    await viewer.render(canvas, { slideIndex: index });
    if (seq !== renderSeqRef.current) return;
  };

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas || !sourceKey) return undefined;

    let cancelled = false;
    let resizeObserver = null;

    const load = async () => {
      try {
        const { width, height } = resolveSize();
        applyCanvasCssSize(canvas, width, height);

        const viewer = await createPptxViewer(canvas);
        if (cancelled) return;
        viewerRef.current = viewer;

        const buffer = await fetchPptxArrayBuffer({ url, storagePath });
        if (cancelled) return;

        await viewer.loadFile(buffer);
        if (cancelled) return;

        loadedKeyRef.current = sourceKey;
        const slideCount = viewer.getSlideCount();
        onLoadedRef.current?.({ slideCount });
        await renderCurrent();
      } catch (err) {
        console.error("Failed to load PPTX for stage", err);
      }
    };

    load();

    resizeObserver = new ResizeObserver(() => {
      if (!viewerRef.current?.isLoaded) return;
      renderCurrent().catch(() => {});
    });
    if (wrapRef.current) resizeObserver.observe(wrapRef.current);

    return () => {
      cancelled = true;
      resizeObserver?.disconnect();
      viewerRef.current = null;
      loadedKeyRef.current = null;
    };
  }, [sourceKey, url, storagePath]);

  useEffect(() => {
    if (!viewerRef.current?.isLoaded || loadedKeyRef.current !== sourceKey) {
      return;
    }
    renderCurrent().catch(() => {});
  }, [slideIndex, sourceKey, stageWidth, stageHeight]);

  return (
    <div ref={wrapRef} className="absolute inset-0 overflow-hidden bg-black">
      <canvas ref={canvasRef} className="block" aria-hidden />
    </div>
  );
}

export default PptxStage;
