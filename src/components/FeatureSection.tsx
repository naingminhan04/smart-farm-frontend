import { useEffect, useMemo, useRef, useState } from "react";
import {
  buildCloudinaryAssetUrl,
  buildCloudinaryDownloadUrl,
} from "../lib/cloudinary";
import type {
  ShowcaseMediaItem,
  ShowcaseMediaManifest,
} from "../types/showcase";
import { buttonMuted, panelClass } from "./ui";

type FeatureItem = {
  id: string;
  title: string;
  caption: string;
  points: string[];
  imageUrl: string;
  downloadUrl: string;
  alt: string;
};

type ViewerItem = {
  title: string;
  alt: string;
  imageUrl: string;
  downloadUrl: string;
};

type NaturalSize = {
  width: number;
  height: number;
};

type BaseFitSize = {
  width: number;
  height: number;
};

function FeatureCard({
  title,
  body,
  href,
}: {
  title: string;
  body: string;
  href: string;
}) {
  return (
    <article className={`${panelClass} animate-fade-up`}>
      <h3 className="text-base font-semibold text-white">{title}</h3>
      <p className="mt-2 text-sm leading-7 text-slate-300">{body}</p>
      <div className="mt-4">
        <a href={href} className={buttonMuted}>
          → Showcase
        </a>
      </div>
    </article>
  );
}

function resolveImageUrl(item: ShowcaseMediaItem) {
  if (item.secureUrl?.trim()) return item.secureUrl.trim();
  if (!item.publicId?.trim()) return "";
  return buildCloudinaryAssetUrl({
    publicId: item.publicId,
    resourceType: "image",
    format: item.format,
    version: item.version,
    transforms: ["c_limit,w_2000", "f_auto", "q_auto"],
  });
}

function resolveDownloadUrl(item: ShowcaseMediaItem) {
  if (!item.publicId?.trim()) return item.secureUrl?.trim() ?? "";
  return buildCloudinaryDownloadUrl({
    publicId: item.publicId,
    resourceType: "image",
    format: item.format,
    version: item.version,
    fileName: item.downloadFileName ?? item.id,
  });
}

function FeatureImageViewer({
  item,
  zoom,
  onClose,
  onWheelZoom,
}: {
  item: ViewerItem | null;
  zoom: number;
  onClose: () => void;
  onWheelZoom: (deltaY: number) => void;
}) {
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
        height: element.clientHeight,
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
    if (
      !naturalSize ||
      viewportSize.width <= 0 ||
      viewportSize.height <= 0 ||
      baseFitSize
    )
      return;

    const fitRatio = Math.min(
      viewportSize.width / naturalSize.width,
      viewportSize.height / naturalSize.height,
      1,
    );
    setBaseFitSize({
      width: naturalSize.width * fitRatio,
      height: naturalSize.height * fitRatio,
    });
  }, [baseFitSize, naturalSize, viewportSize.height, viewportSize.width]);

  if (!item) return null;

  const imageWidth = baseFitSize ? baseFitSize.width * zoom : undefined;
  const imageHeight = baseFitSize ? baseFitSize.height * zoom : undefined;
  const widthTolerance = 2;
  const needsHorizontalScroll = Boolean(
    imageWidth &&
    viewportSize.width > 0 &&
    imageWidth > viewportSize.width + widthTolerance,
  );
  const canvasWidth =
    imageWidth && viewportSize.width > 0
      ? Math.max(imageWidth, viewportSize.width - widthTolerance)
      : viewportSize.width || undefined;
  const canvasHeight =
    imageHeight && viewportSize.height > 0
      ? Math.max(imageHeight, viewportSize.height)
      : viewportSize.height || undefined;

  function handlePointerDown(event: React.PointerEvent<HTMLDivElement>) {
    if (event.button !== 0 || !viewportRef.current) return;

    const element = viewportRef.current;
    dragStateRef.current = {
      pointerId: event.pointerId,
      startX: event.clientX,
      startY: event.clientY,
      startScrollLeft: element.scrollLeft,
      startScrollTop: element.scrollTop,
    };
    element.setPointerCapture(event.pointerId);
    setIsDragging(true);
  }

  function handlePointerMove(event: React.PointerEvent<HTMLDivElement>) {
    if (!viewportRef.current || !dragStateRef.current) return;
    if (dragStateRef.current.pointerId !== event.pointerId) return;

    const element = viewportRef.current;
    const deltaX = event.clientX - dragStateRef.current.startX;
    const deltaY = event.clientY - dragStateRef.current.startY;

    element.scrollLeft = dragStateRef.current.startScrollLeft - deltaX;
    element.scrollTop = dragStateRef.current.startScrollTop - deltaY;
  }

  function stopDragging(event: React.PointerEvent<HTMLDivElement>) {
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
            <a
              href={item.downloadUrl || item.imageUrl}
              target="_blank"
              rel="noreferrer"
              className={buttonMuted}
            >
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
            cursor: isDragging ? "grabbing" : "grab",
          }}
        >
          <div className="min-h-full min-w-full">
            <div
              className="flex items-center justify-center"
              style={{
                width: canvasWidth ? `${canvasWidth}px` : "100%",
                minWidth: "100%",
                height: canvasHeight ? `${canvasHeight}px` : "100%",
                minHeight: "100%",
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
                    height: event.currentTarget.naturalHeight,
                  })
                }
                style={{
                  width: imageWidth ? `${imageWidth}px` : undefined,
                  height: imageHeight ? `${imageHeight}px` : undefined,
                  maxWidth: "none",
                  maxHeight: "none",
                }}
              />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export function FeatureSection() {
  const [manifest, setManifest] = useState<ShowcaseMediaManifest>({
    items: [],
  });
  const [loading, setLoading] = useState(true);
  const [viewerItem, setViewerItem] = useState<ViewerItem | null>(null);
  const [viewerZoom, setViewerZoom] = useState(1);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const response = await fetch("/showcase-media.json", {
          cache: "no-store",
        });
        if (!response.ok) return;
        const data = (await response.json()) as ShowcaseMediaManifest;
        if (!cancelled)
          setManifest({ items: Array.isArray(data.items) ? data.items : [] });
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  const features = useMemo<FeatureItem[]>(() => {
    const requiredIds = ["circuit-diagram", "system-flowchart"];
    return requiredIds
      .map((id) =>
        manifest.items.find(
          (item) => item.id === id && item.kind === "image" && item.published,
        ),
      )
      .filter((item): item is ShowcaseMediaItem => Boolean(item))
      .map((item) => ({
        id: item.id,
        title: item.title,
        caption: item.caption,
        points: item.points ?? [],
        imageUrl: resolveImageUrl(item),
        downloadUrl: resolveDownloadUrl(item),
        alt: item.alt ?? item.title,
      }))
      .filter((item) => item.imageUrl);
  }, [manifest.items]);

  function openViewer(item: FeatureItem) {
    setViewerZoom(1);
    setViewerItem({
      title: item.title,
      alt: item.alt,
      imageUrl: item.imageUrl,
      downloadUrl: item.downloadUrl,
    });
  }

  const featureCards = useMemo(
    () => [
      {
        title: "Smart Humidification System",
        body: "Automatically monitors humidity and triggers the humidifier when conditions drop below the desired range, helping maintain a stable environment without manual switching.",
      },
      {
        title: "Automatic Lighting System",
        body: "Uses ambient light sensing to turn farm lighting on/off at the right time, improving visibility and saving power while keeping the farm consistent day-to-night.",
      },
      {
        title: "RFID Door Access",
        body: "Only authorized RFID cards can open the gate. Invalid access attempts keep the door closed and can be recorded for review, improving safety and control.",
      },
      {
        title: "Laser-Fence Intrusion Alerts",
        body: "A laser fence detects interruptions as an intrusion signal. The system responds quickly to abnormal events and can surface alerts for monitoring.",
      },
      {
        title: "Live IoT Monitoring",
        body: "Live telemetry is sent to the cloud so you can check farm conditions remotely. This enables tracking trends and responding faster when something changes.",
      },
    ],
    [],
  );

  return (
    <>
      <section className="mt-6 space-y-6">
        <div className="animate-fade-up">
          <h2 className="text-xl font-semibold text-white">Key Features</h2>
          <p className="mt-2 text-sm text-slate-300">
            Short summaries of the main functions.
          </p>
        </div>

        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {featureCards.map((card) => (
            <FeatureCard
              key={card.title}
              title={card.title}
              body={card.body}
              href="#showcase"
            />
          ))}
        </div>

        {loading ? (
          <div
            className={`${panelClass} animate-fade-up [animation-delay:60ms]`}
          >
            <p className="text-sm text-slate-300">Loading diagrams...</p>
          </div>
        ) : null}

        <div className="grid gap-6 md:grid-cols-2">
          {features.map((item, index) => (
            <article
              key={item.id}
              className={`${panelClass} animate-fade-up overflow-hidden p-0 ${index === 1 ? "[animation-delay:80ms]" : ""}`}
            >
              <div className="border-b border-neutral-700/70">
                <button
                  type="button"
                  onClick={() => openViewer(item)}
                  className="group block w-full text-left"
                >
                  <div className="pb-5">
                  <h3 className="text-lg font-semibold text-white">
                    {item.title}
                  </h3>
                  </div>
                  <div className="aspect-[16/10] overflow-hidden bg-black/20 md:aspect-[16/10]">
                    <img
                      src={item.imageUrl}
                      alt={item.alt}
                      className="h-full w-full object-cover transition duration-300 group-hover:opacity-95"
                      loading="lazy"
                    />
                  </div>
                </button>
              </div>
                <div className="mt-4 flex flex-wrap gap-2">
                  <a
                    href={item.downloadUrl || item.imageUrl}
                    target="_blank"
                    rel="noreferrer"
                    className={buttonMuted}
                  >
                    Download diagram
                  </a>
                </div>
                <p className="mt-3 text-sm leading-7 text-slate-300">
                    {item.caption}
                  </p>
                <p className="mt-5 text-sm leading-7 text-slate-300">
                  {item.points.join(" ")}
                </p>
            </article>
          ))}
        </div>
      </section>

      <FeatureImageViewer
        item={viewerItem}
        zoom={viewerZoom}
        onClose={() => setViewerItem(null)}
        onWheelZoom={(deltaY) =>
          setViewerZoom((current) =>
            Math.min(Math.max(current + (deltaY < 0 ? 0.12 : -0.12), 1), 4),
          )
        }
      />
    </>
  );
}
