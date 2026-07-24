import {
  Children,
  Fragment,
  useCallback,
  useEffect,
  useRef,
  useState,
} from "react";

function loadSizes(key, fallback) {
  if (!key) return fallback;
  try {
    const raw = localStorage.getItem(key);
    if (!raw) return fallback;
    const parsed = JSON.parse(raw);
    if (
      Array.isArray(parsed) &&
      parsed.length === fallback.length &&
      parsed.every((n) => typeof n === "number" && Number.isFinite(n) && n > 0)
    ) {
      return parsed;
    }
  } catch {
    // ignore corrupt storage
  }
  return fallback;
}

function ResizeHandle({ direction, onPointerDown, onPointerMove, onPointerUp }) {
  const isHorizontal = direction === "horizontal";

  return (
    <div
      role="separator"
      aria-orientation={isHorizontal ? "vertical" : "horizontal"}
      tabIndex={0}
      onPointerDown={onPointerDown}
      onPointerMove={onPointerMove}
      onPointerUp={onPointerUp}
      onPointerCancel={onPointerUp}
      className={`group relative shrink-0 z-10 touch-none select-none ${
        isHorizontal
          ? "w-4 cursor-col-resize"
          : "h-4 cursor-row-resize"
      }`}
    >
      <div
        className={`absolute rounded-full bg-[rgba(69,70,77,0.55)] transition-colors group-hover:bg-[#7bd0ff] group-active:bg-[#7bd0ff] ${
          isHorizontal
            ? "inset-y-3 left-1/2 w-px -translate-x-1/2 group-hover:w-0.5 group-active:w-0.5"
            : "inset-x-3 top-1/2 h-px -translate-y-1/2 group-hover:h-0.5 group-active:h-0.5"
        }`}
      />
    </div>
  );
}

/**
 * Flex split panes with drag handles.
 * `direction="horizontal"` = side-by-side; `direction="vertical"` = stacked.
 * `sizes` are relative flex weights (not required to sum to 100).
 */
function ResizableSplit({
  direction = "horizontal",
  defaultSizes,
  minSizes,
  storageKey,
  children,
  className = "",
}) {
  const panes = Children.toArray(children);
  const defaults =
    defaultSizes?.length === panes.length
      ? defaultSizes
      : panes.map(() => 1);
  const mins =
    minSizes?.length === panes.length
      ? minSizes
      : panes.map(() => 10);

  const [sizes, setSizes] = useState(() => loadSizes(storageKey, defaults));
  const containerRef = useRef(null);
  const dragRef = useRef(null);

  useEffect(() => {
    if (!storageKey) return;
    try {
      localStorage.setItem(storageKey, JSON.stringify(sizes));
    } catch {
      // ignore quota / private mode
    }
  }, [sizes, storageKey]);

  const endDrag = useCallback(() => {
    if (!dragRef.current) return;
    dragRef.current = null;
    document.body.style.removeProperty("cursor");
    document.body.style.removeProperty("user-select");
  }, []);

  const onPointerDown = useCallback(
    (index, event) => {
      const container = containerRef.current;
      if (!container) return;

      event.preventDefault();
      const rect = container.getBoundingClientRect();
      dragRef.current = {
        index,
        startPos: direction === "horizontal" ? event.clientX : event.clientY,
        startSizes: [...sizes],
        containerSize:
          direction === "horizontal" ? rect.width : rect.height,
      };
      document.body.style.cursor =
        direction === "horizontal" ? "col-resize" : "row-resize";
      document.body.style.userSelect = "none";
      event.currentTarget.setPointerCapture(event.pointerId);
    },
    [direction, sizes]
  );

  const onPointerMove = useCallback(
    (event) => {
      const drag = dragRef.current;
      if (!drag) return;

      const pos = direction === "horizontal" ? event.clientX : event.clientY;
      const deltaPct = ((pos - drag.startPos) / drag.containerSize) * 100;
      const i = drag.index;
      const total = drag.startSizes[i] + drag.startSizes[i + 1];
      const minA = mins[i];
      const minB = mins[i + 1];

      let nextA = drag.startSizes[i] + deltaPct;
      let nextB = total - nextA;

      if (nextA < minA) {
        nextA = minA;
        nextB = total - nextA;
      }
      if (nextB < minB) {
        nextB = minB;
        nextA = total - nextB;
      }
      if (nextA < minA) return;

      setSizes((prev) => {
        const next = [...prev];
        next[i] = nextA;
        next[i + 1] = nextB;
        return next;
      });
    },
    [direction, mins]
  );

  const isHorizontal = direction === "horizontal";

  return (
    <div
      ref={containerRef}
      className={`min-h-0 min-w-0 flex overflow-hidden ${
        isHorizontal ? "flex-row" : "flex-col"
      } ${className}`}
    >
      {panes.map((child, index) => (
        <Fragment key={index}>
          <div
            className="min-h-0 min-w-0 overflow-hidden flex flex-col"
            style={{
              flexGrow: sizes[index] ?? defaults[index],
              flexShrink: 1,
              flexBasis: 0,
            }}
          >
            {child}
          </div>
          {index < panes.length - 1 && (
            <ResizeHandle
              direction={direction}
              onPointerDown={(e) => onPointerDown(index, e)}
              onPointerMove={onPointerMove}
              onPointerUp={endDrag}
            />
          )}
        </Fragment>
      ))}
    </div>
  );
}

export default ResizableSplit;
