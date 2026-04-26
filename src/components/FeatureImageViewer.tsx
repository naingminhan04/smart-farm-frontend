import { useEffect, useRef, useState, type PointerEvent as ReactPointerEvent } from "react";
import type { FeatureImageViewerProps } from "../types";
import type { BaseFitSize, NaturalSize } from "../types";
import { buttonMuted } from "./ui";

export function FeatureImageViewer({ item, zoom, onClose, onWheelZoom }: FeatureImageViewerProps) {
  const viewportRef = useRef<HTMLDivElement | null>(null);
  const dragStateRef = useRef<{
    pointerId: number;
    startX: number;
    startY: number;
    startScrollLeft: number;
    startScrollTop: number;
  } | null>(null);
  const [naturalSize, setNaturalSize] = useState<NaturalSize | null>(null);
  const [viewportSize, setViewportSize] = useState({ width: 0, height: 0 });
  const [baseFitSize, setBaseFitSize] = useState<BaseFitSize | null>(null);
  const [isDragging, setIsDragging] = useState(false);

  useEffect(() => {
    if (!item || !viewportRef.current) return;

    const element = viewportRef.current;
    const updateViewport = () => {
      setViewportSize({
        width: element.clientWidth,
        height: element.clientHeight
      });
    };

    const handleWheel = (event: WheelEvent) => {
      event.preventDefault();
      onWheelZoom(event.deltaY);
    };

    updateViewport();

    const resizeObserver = new ResizeObserver(updateViewport);
    resizeObserver.observe(element);
    window.addEventListener("resize", updateViewport);
    element.addEventListener("wheel", handleWheel, { passive: false });

    return () => {
      resizeObserver.disconnect();
      window.removeEventListener("resize", updateViewport);
      element.removeEventListener("wheel", handleWheel);
    };
  }, [item, onWheelZoom]);

  useEffect(() => {
    if (!item) return;
    setNaturalSize(null);
    setBaseFitSize(null);
  }, [item]);

  useEffect(() => {
    if (!naturalSize || viewportSize.width <= 0 || viewportSize.height <= 0 || baseFitSize) return;

    const fitRatio = Math.min(viewportSize.width / naturalSize.width, viewportSize.height / naturalSize.height, 1);
    setBaseFitSize({
      width: naturalSize.width * fitRatio,
      height: naturalSize.height * fitRatio
    });
  }, [baseFitSize, naturalSize, viewportSize.height, viewportSize.width]);

  if (!item) return null;

  const imageWidth = baseFitSize ? baseFitSize.width * zoom : undefined;
  const imageHeight = baseFitSize ? baseFitSize.height * zoom : undefined;
  const widthTolerance = 2;
  const needsHorizontalScroll = Boolean(
    imageWidth && viewportSize.width > 0 && imageWidth > viewportSize.width + widthTolerance
  );
  const canvasWidth =
    imageWidth && viewportSize.width > 0
      ? Math.max(imageWidth, viewportSize.width - widthTolerance)
      : viewportSize.width || undefined;
  const canvasHeight =
    imageHeight && viewportSize.height > 0
      ? Math.max(imageHeight, viewportSize.height)
      : viewportSize.height || undefined;

  function handlePointerDown(event: ReactPointerEvent<HTMLDivElement>) {
    if (event.button !== 0 || !viewportRef.current) return;

    const element = viewportRef.current;
    dragStateRef.current = {
      pointerId: event.pointerId,
      startX: event.clientX,
      startY: event.clientY,
      startScrollLeft: element.scrollLeft,
      startScrollTop: element.scrollTop
    };
    element.setPointerCapture(event.pointerId);
    setIsDragging(true);
  }

  function handlePointerMove(event: ReactPointerEvent<HTMLDivElement>) {
    if (!viewportRef.current || !dragStateRef.current) return;
    if (dragStateRef.current.pointerId !== event.pointerId) return;

    const element = viewportRef.current;
    const deltaX = event.clientX - dragStateRef.current.startX;
    const deltaY = event.clientY - dragStateRef.current.startY;

    element.scrollLeft = dragStateRef.current.startScrollLeft - deltaX;
    element.scrollTop = dragStateRef.current.startScrollTop - deltaY;
  }

  function stopDragging(event: ReactPointerEvent<HTMLDivElement>) {
    if (!viewportRef.current || !dragStateRef.current) return;
    if (dragStateRef.current.pointerId !== event.pointerId) return;

    viewportRef.current.releasePointerCapture(event.pointerId);
    dragStateRef.current = null;
    setIsDragging(false);
  }

  return (
    <div className="fixed inset-0 z-50 overscroll-none bg-slate-950/96 backdrop-blur-md">
      <div className="absolute inset-0" onClick={onClose} aria-hidden="true" />
      <div className="relative z-10 flex h-screen w-screen flex-col overflow-hidden">
        <div className="flex flex-wrap items-center justify-between gap-3 border-b border-neutral-700/70 bg-neutral-900 px-4 py-3 sm:px-5">
          <div>
            <p className="text-sm font-semibold text-white">{item.title}</p>
          </div>
          <div className="flex flex-wrap items-center gap-2">
            <a href={item.downloadUrl || item.imageUrl} target="_blank" rel="noreferrer" className={buttonMuted}>
              Download
            </a>
            <span className="rounded-xl border border-neutral-700/70 bg-neutral-800/70 px-3 py-2 text-sm font-semibold text-slate-200">
              {Math.round(zoom * 100)}%
            </span>
            <button type="button" onClick={onClose} className={buttonMuted}>
              Close
            </button>
          </div>
        </div>

        <div
          ref={viewportRef}
          className="min-h-0 flex-1 overflow-y-auto overscroll-none bg-black/40"
          onPointerDown={handlePointerDown}
          onPointerMove={handlePointerMove}
          onPointerUp={stopDragging}
          onPointerCancel={stopDragging}
          style={{
            overflowX: needsHorizontalScroll ? "auto" : "hidden",
            scrollbarGutter: "stable both-edges",
            cursor: isDragging ? "grabbing" : "grab"
          }}
        >
          <div className="min-h-full min-w-full">
            <div
              className="flex items-center justify-center"
              style={{
                width: canvasWidth ? `${canvasWidth}px` : "100%",
                minWidth: "100%",
                height: canvasHeight ? `${canvasHeight}px` : "100%",
                minHeight: "100%"
              }}
            >
              <img
                src={item.imageUrl}
                alt={item.alt}
                className="max-h-full max-w-full select-none rounded-2xl border border-neutral-700/70 object-contain shadow-[0_20px_80px_rgba(0,0,0,0.35)]"
                draggable={false}
                onLoad={(event) =>
                  setNaturalSize({
                    width: event.currentTarget.naturalWidth,
                    height: event.currentTarget.naturalHeight
                  })
                }
                style={{
                  width: imageWidth ? `${imageWidth}px` : undefined,
                  height: imageHeight ? `${imageHeight}px` : undefined,
                  maxWidth: "none",
                  maxHeight: "none"
                }}
              />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
