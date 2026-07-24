import { useLayoutEffect, useRef, useState } from "react";

/**
 * Fits a live-sized canvas into the container via CSS scale.
 * Scale = min(containerW / stageWidth, containerH / stageHeight)
 * so console elements are liveSize × (consoleWidth / liveWidth).
 */
function ScaledLiveStage({
  stageWidth,
  stageHeight,
  children,
  className = "",
}) {
  const containerRef = useRef(null);
  const [scale, setScale] = useState(1);

  const width = Math.max(1, Math.round(stageWidth) || 1);
  const height = Math.max(1, Math.round(stageHeight) || 1);

  useLayoutEffect(() => {
    const el = containerRef.current;
    if (!el) return undefined;

    const update = () => {
      const rect = el.getBoundingClientRect();
      if (rect.width <= 0 || rect.height <= 0) return;
      setScale(Math.min(rect.width / width, rect.height / height));
    };

    update();
    const ro = new ResizeObserver(update);
    ro.observe(el);
    return () => ro.disconnect();
  }, [width, height]);

  return (
    <div
      ref={containerRef}
      className={`relative h-full w-full min-h-0 overflow-hidden ${className}`}
    >
      <div
        className="absolute left-1/2 top-1/2"
        style={{
          width,
          height,
          transform: `translate(-50%, -50%) scale(${scale})`,
          transformOrigin: "center center",
        }}
      >
        {children}
      </div>
    </div>
  );
}

export default ScaledLiveStage;
