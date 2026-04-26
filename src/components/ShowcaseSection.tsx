import { useEffect, useMemo, useRef, useState } from "react";
import { buildCloudinaryAssetUrl, buildCloudinaryDownloadUrl, getCloudinaryCloudName, hasCloudinaryConfig } from "../lib/cloudinary";
import type { ShowcaseAccent, ShowcaseMediaItem, ShowcaseMediaManifest } from "../types/showcase";
import { badgeClass, buttonMuted, panelClass } from "./ui";
import { cx } from "./utils";

type ResolvedShowcaseMediaItem = ShowcaseMediaItem & {
  accentClass: string;
  mediaUrl: string;
  previewUrl: string;
  downloadUrl: string;
  posterUrl?: string;
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


const walkthroughSteps = [
  "Initialize the ESP32 and connected modules so the system starts in a known, stable state.",
  "Read live data from humidity, light, RFID, and laser-fence inputs.",
  "Make decisions automatically for access control, lighting, humidifier control, and intrusion alerts.",
  "Update the LCD with the latest system condition so the farm status is visible locally.",
  "Send records and live telemetry to the cloud for monitoring outside the physical device."
];

const featureHighlights = [
  "RFID-based gate access with servo control",
  "Automatic farm lighting based on ambient darkness",
  "Humidity regulation through relay-controlled humidifiers",
  "Laser fence alerting for physical security",
  "Live monitoring status through LCD and IoT updates",
  "Expandable structure for future video demonstrations"
];

const accentMap: Record<ShowcaseAccent, string> = {
  sky: "from-sky-400/20 via-sky-400/8 to-transparent",
  emerald: "from-emerald-400/20 via-emerald-400/8 to-transparent",
  amber: "from-amber-400/20 via-amber-400/8 to-transparent",
  rose: "from-rose-400/20 via-rose-400/8 to-transparent"
};

function resolveAccent(accent?: ShowcaseAccent) {
  return accentMap[accent ?? "sky"];
}

function resolveMediaUrl(item: ShowcaseMediaItem) {
  if (item.secureUrl?.trim()) return item.secureUrl.trim();
  if (!item.publicId?.trim()) return "";

  if (item.kind === "video") {
    return buildCloudinaryAssetUrl({
      publicId: item.publicId,
      resourceType: "video",
      format: item.format,
      version: item.version,
      transforms: ["c_limit,w_1600", "q_auto"]
    });
  }

  return buildCloudinaryAssetUrl({
    publicId: item.publicId,
    resourceType: "image",
    format: item.format,
    version: item.version,
    transforms: ["c_limit,w_1600", "f_auto", "q_auto"]
  });
}

function resolvePreviewUrl(item: ShowcaseMediaItem) {
  if (item.kind === "video") return resolveMediaUrl(item);
  if (item.secureUrl?.trim()) return item.secureUrl.trim();
  if (!item.publicId?.trim()) return "";

  return buildCloudinaryAssetUrl({
    publicId: item.publicId,
    resourceType: "image",
    format: item.format,
    version: item.version,
    transforms: ["c_fill,g_auto,h_900,w_1600", "f_auto", "q_auto"]
  });
}

function resolveDownloadUrl(item: ShowcaseMediaItem) {
  if (!item.publicId?.trim()) return item.secureUrl?.trim() ?? "";

  return buildCloudinaryDownloadUrl({
    publicId: item.publicId,
    resourceType: item.kind === "video" ? "video" : "image",
    format: item.format,
    version: item.version,
    fileName: item.downloadFileName ?? item.id
  });
}

function resolvePosterUrl(item: ShowcaseMediaItem) {
  if (!item.posterPublicId?.trim()) return undefined;

  return buildCloudinaryAssetUrl({
    publicId: item.posterPublicId,
    resourceType: "image",
    format: item.posterFormat,
    version: item.posterVersion,
    transforms: ["c_fill,g_auto,h_720,w_1280", "f_auto", "q_auto"]
  });
}

function ImageViewerModal({
  item,
  zoom,
  onClose,
  onWheelZoom
}: {
  item: ViewerItem | null;
  zoom: number;
  onClose: () => void;
  onWheelZoom: (deltaY: number) => void;
}) {
  const viewportRef = useRef<HTMLDivElement | null>(null);
  const [naturalSize, setNaturalSize] = useState<NaturalSize | null>(null);
  const [viewportSize, setViewportSize] = useState({ width: 0, height: 0 });
  const [baseFitSize, setBaseFitSize] = useState<BaseFitSize | null>(null);

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
  const needsHorizontalScroll = Boolean(imageWidth && viewportSize.width > 0 && imageWidth > viewportSize.width + widthTolerance);
  const canvasWidth =
    imageWidth && viewportSize.width > 0
      ? Math.max(imageWidth, viewportSize.width - widthTolerance)
      : viewportSize.width || undefined;
  const canvasHeight =
    imageHeight && viewportSize.height > 0 ? Math.max(imageHeight, viewportSize.height) : viewportSize.height || undefined;

  return (
    <div className="fixed inset-0 z-50 overscroll-none bg-slate-950/96 backdrop-blur-md">
      <div className="absolute inset-0" onClick={onClose} aria-hidden="true" />
      <div className="relative z-10 flex h-screen w-screen flex-col overflow-hidden">
        <div className="flex flex-wrap items-center justify-between gap-3 border-b border-white/10 bg-slate-950/85 px-4 py-3 sm:px-5">
          <div>
            <p className="text-sm font-semibold text-white">{item.title}</p>
            <p className="text-xs text-slate-400">Full-screen image viewer.</p>
          </div>
          <div className="flex flex-wrap items-center gap-2">
            <a href={item.downloadUrl || item.imageUrl} target="_blank" rel="noreferrer" className={buttonMuted}>
              Download
            </a>
            <span className="rounded-xl border border-white/10 bg-white/5 px-3 py-2 text-sm font-semibold text-slate-200">
              {Math.round(zoom * 100)}%
            </span>
            <button type="button" onClick={onClose} className={buttonMuted}>
              Close
            </button>
          </div>
        </div>

        <div
          ref={viewportRef}
          className="min-h-0 flex-1 overflow-y-auto overscroll-none bg-[radial-gradient(circle_at_center,rgba(30,41,59,0.45),rgba(2,6,23,0.98))]"
          style={{
            overflowX: needsHorizontalScroll ? "auto" : "hidden",
            scrollbarGutter: "stable both-edges"
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
                className="max-h-full max-w-full select-none rounded-2xl border border-white/10 object-contain shadow-[0_20px_80px_rgba(0,0,0,0.35)]"
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

export function ShowcaseSection() {
  const [manifest, setManifest] = useState<ShowcaseMediaManifest>({ items: [] });
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [viewerItem, setViewerItem] = useState<ViewerItem | null>(null);
  const [viewerZoom, setViewerZoom] = useState(1);

  useEffect(() => {
    let cancelled = false;

    async function loadManifest() {
      try {
        setLoading(true);
        setLoadError(null);
        const response = await fetch("/showcase-media.json", { cache: "no-store" });

        if (!response.ok) {
          throw new Error(`Could not load showcase manifest (${response.status}).`);
        }

        const data = (await response.json()) as ShowcaseMediaManifest;
        if (!cancelled) setManifest({ items: Array.isArray(data.items) ? data.items : [] });
      } catch (error) {
        if (!cancelled) {
          setLoadError(error instanceof Error ? error.message : "Could not load showcase media.");
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    }

    void loadManifest();

    return () => {
      cancelled = true;
    };
  }, []);

  useEffect(() => {
    if (!viewerItem) return;

    const previousHtmlOverflow = document.documentElement.style.overflow;
    const previousBodyOverflow = document.body.style.overflow;

    document.documentElement.style.overflow = "hidden";
    document.body.style.overflow = "hidden";

    return () => {
      document.documentElement.style.overflow = previousHtmlOverflow;
      document.body.style.overflow = previousBodyOverflow;
    };
  }, [viewerItem]);

  const showcaseMedia = useMemo<ResolvedShowcaseMediaItem[]>(() => {
    return manifest.items
      .filter((item) => item.published)
      .map((item) => ({
        ...item,
        accentClass: resolveAccent(item.accent),
        mediaUrl: resolveMediaUrl(item),
        previewUrl: resolvePreviewUrl(item),
        downloadUrl: resolveDownloadUrl(item),
        posterUrl: resolvePosterUrl(item)
      }))
      .filter((item) => item.mediaUrl);
  }, [manifest.items]);

  const imageCount = showcaseMedia.filter((item) => item.kind === "image").length;
  const videoCount = showcaseMedia.filter((item) => item.kind === "video").length;
  const cloudName = getCloudinaryCloudName();

  function openViewer(item: ResolvedShowcaseMediaItem) {
    if (item.kind !== "image") return;

    setViewerZoom(1);
    setViewerItem({
      title: item.title,
      alt: item.alt ?? item.title,
      imageUrl:
        item.publicId?.trim()
          ? buildCloudinaryAssetUrl({
              publicId: item.publicId,
              resourceType: "image",
              format: item.format,
              version: item.version,
              transforms: ["c_limit,w_2400", "f_auto", "q_auto"]
            })
          : item.mediaUrl,
      downloadUrl: item.downloadUrl
    });
  }

  return (
    <>
      <section className="mt-6 space-y-6">
        <div className={`${panelClass} overflow-hidden p-0`}>
          <div className="relative">
            <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_left,rgba(125,211,252,0.18),transparent_35%),radial-gradient(circle_at_80%_20%,rgba(52,211,153,0.16),transparent_30%),linear-gradient(135deg,rgba(15,23,42,0.96),rgba(15,23,42,0.82))]" />
            <div className="relative grid gap-6 px-5 py-6 sm:px-6 lg:grid-cols-[1.4fr_0.9fr] lg:items-end">
              <div className="animate-fade-up">
                <span className={badgeClass}>Showcase Tab</span>
                <h2 className="mt-4 max-w-3xl text-3xl font-semibold tracking-tight text-white sm:text-[2.4rem]">
                  A cleaner project story, now ready for Cloudinary media.
                </h2>
                <p className="mt-3 max-w-2xl text-sm leading-7 text-slate-300 sm:text-base">
                  This section now reads a frontend manifest and builds Cloudinary delivery URLs at runtime, so you can
                  swap diagrams, add videos, and keep the component code untouched.
                </p>
              </div>

              <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-1">
                <div className="rounded-2xl border border-white/10 bg-white/5 p-4 backdrop-blur-xl">
                  <p className="text-xs font-semibold uppercase tracking-[0.24em] text-sky-200/80">Published media</p>
                  <p className="mt-2 text-2xl font-semibold text-white">{showcaseMedia.length}</p>
                  <p className="mt-1 text-sm text-slate-300">
                    {imageCount} image{imageCount === 1 ? "" : "s"} and {videoCount} video{videoCount === 1 ? "" : "s"} ready.
                  </p>
                </div>
                <div className="rounded-2xl border border-white/10 bg-white/5 p-4 backdrop-blur-xl">
                  <p className="text-xs font-semibold uppercase tracking-[0.24em] text-emerald-200/80">Cloudinary</p>
                  <p className="mt-2 text-sm font-semibold text-white">
                    {hasCloudinaryConfig() ? `Connected to ${cloudName}` : "Waiting for VITE_CLOUDINARY_CLOUD_NAME"}
                  </p>
                  <p className="mt-1 text-sm text-slate-300">Media comes from `public/showcase-media.json` instead of bundled imports.</p>
                </div>
              </div>
            </div>
          </div>
        </div>

        <div className="grid gap-4 lg:grid-cols-[1.15fr_0.85fr]">
          <div className={panelClass}>
            <div className="flex items-center justify-between gap-3">
              <div>
                <p className="text-xs font-semibold uppercase tracking-[0.24em] text-sky-200/80">Project Walkthrough</p>
                <h3 className="mt-2 text-xl font-semibold text-white">Simple step-by-step explanation</h3>
              </div>
              <span className={badgeClass}>5 Steps</span>
            </div>

            <div className="mt-5 space-y-3">
              {walkthroughSteps.map((step, index) => (
                <div
                  key={step}
                  className="flex gap-4 rounded-2xl border border-white/10 bg-slate-950/35 p-4 transition hover:border-sky-300/20 hover:bg-slate-950/50"
                >
                  <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl bg-sky-400/15 text-sm font-semibold text-sky-200">
                    {index + 1}
                  </div>
                  <p className="pt-1 text-sm leading-7 text-slate-300">{step}</p>
                </div>
              ))}
            </div>
          </div>

          <div className={panelClass}>
            <p className="text-xs font-semibold uppercase tracking-[0.24em] text-emerald-200/80">Feature Highlights</p>
            <h3 className="mt-2 text-xl font-semibold text-white">What this system can do</h3>
            <div className="mt-5 flex flex-wrap gap-3">
              {featureHighlights.map((feature) => (
                <div
                  key={feature}
                  className="rounded-full border border-emerald-300/15 bg-emerald-400/8 px-4 py-2 text-sm text-emerald-100"
                >
                  {feature}
                </div>
              ))}
            </div>

            <div className="mt-6 rounded-2xl border border-dashed border-white/12 bg-white/[0.03] p-4">
              <p className="text-sm font-semibold text-white">Image viewer and video-ready structure</p>
              <p className="mt-2 text-sm leading-7 text-slate-300">
                Images open in a zoomable viewer with a Cloudinary download action. Videos render in the same showcase
                grid later without changing the page structure.
              </p>
            </div>
          </div>
        </div>

        {!hasCloudinaryConfig() || loadError || (!loading && showcaseMedia.length === 0) ? (
          <div className={panelClass}>
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div>
                <p className="text-xs font-semibold uppercase tracking-[0.24em] text-amber-200/80">Setup Status</p>
                <h3 className="mt-2 text-xl font-semibold text-white">Showcase is waiting for Cloudinary media</h3>
              </div>
              <span className={badgeClass}>{loading ? "Loading manifest" : "Configuration needed"}</span>
            </div>

            <div className="mt-5 grid gap-4 lg:grid-cols-2">
              <div className="rounded-2xl border border-white/10 bg-slate-950/35 p-4">
                <p className="text-sm font-semibold text-white">1. Set your cloud name</p>
                <p className="mt-2 text-sm leading-7 text-slate-300">
                  Add `VITE_CLOUDINARY_CLOUD_NAME=your-cloud-name` to your frontend env file so the app can generate media URLs.
                </p>
              </div>
              <div className="rounded-2xl border border-white/10 bg-slate-950/35 p-4">
                <p className="text-sm font-semibold text-white">2. Publish items in the manifest</p>
                <p className="mt-2 text-sm leading-7 text-slate-300">
                  Open `frontend/public/showcase-media.json`, paste each asset public ID, and set `published` to `true`.
                </p>
              </div>
              <div className="rounded-2xl border border-white/10 bg-slate-950/35 p-4">
                <p className="text-sm font-semibold text-white">3. Keep videos light</p>
                <p className="mt-2 text-sm leading-7 text-slate-300">
                  Future videos will use the same manifest. Add a `posterPublicId` if you want a custom thumbnail before playback.
                </p>
              </div>
              <div className="rounded-2xl border border-white/10 bg-slate-950/35 p-4">
                <p className="text-sm font-semibold text-white">4. Use the viewer tools</p>
                <p className="mt-2 text-sm leading-7 text-slate-300">
                  Published images automatically get zoomable preview and a Cloudinary-powered download button.
                </p>
              </div>
            </div>

            {loadError && <p className="mt-4 text-sm text-rose-300">{loadError}</p>}
          </div>
        ) : null}

        {loading ? (
          <div className="grid gap-6">
            {Array.from({ length: 2 }).map((_, index) => (
              <div key={index} className={`${panelClass} overflow-hidden p-0`}>
                <div className="grid animate-pulse gap-0 lg:grid-cols-[1.2fr_0.9fr]">
                  <div className="min-h-[280px] bg-white/5" />
                  <div className="space-y-4 p-5 sm:p-6">
                    <div className="h-6 w-32 rounded-full bg-white/10" />
                    <div className="h-10 w-full rounded-2xl bg-white/10" />
                    <div className="h-24 rounded-2xl bg-white/10" />
                    <div className="h-24 rounded-2xl bg-white/10" />
                  </div>
                </div>
              </div>
            ))}
          </div>
        ) : null}

        <div className="grid gap-6">
          {showcaseMedia.map((item, index) => (
            <article
              key={item.id}
              className={`${panelClass} overflow-hidden p-0 ${index % 2 === 1 ? "lg:[&_.showcase-copy]:order-2" : ""}`}
            >
              <div className="grid gap-0 lg:grid-cols-[1.2fr_0.9fr]">
                <div className="relative overflow-hidden border-b border-white/10 lg:border-b-0 lg:border-r">
                  <div className={`absolute inset-0 bg-gradient-to-br ${item.accentClass}`} />
                  {item.kind === "image" ? (
                    <button
                      type="button"
                      onClick={() => openViewer(item)}
                      className="group relative block aspect-[4/3] w-full text-left lg:aspect-[16/9]"
                    >
                      <img
                        src={item.previewUrl}
                        alt={item.alt ?? item.title}
                        className="relative h-full w-full object-cover object-top transition duration-300 group-hover:scale-[1.02]"
                        loading="lazy"
                      />
                      <div className="absolute inset-x-4 bottom-4 flex items-center justify-between rounded-2xl border border-white/10 bg-slate-950/70 px-4 py-3 backdrop-blur-xl">
                        <div>
                          <p className="text-sm font-semibold text-white">Open image viewer</p>
                          <p className="text-xs text-slate-300">Zoom in and inspect the full diagram.</p>
                        </div>
                        <span className="rounded-full bg-sky-400 px-3 py-1 text-xs font-semibold text-slate-950">View</span>
                      </div>
                    </button>
                  ) : (
                    <div className="relative aspect-[4/3] w-full bg-slate-950 lg:aspect-[16/9]">
                      <video
                        className="relative h-full w-full object-cover"
                        controls
                        preload="none"
                        playsInline
                        poster={item.posterUrl}
                      >
                        <source src={item.mediaUrl} type="video/mp4" />
                        Your browser does not support video playback.
                      </video>
                    </div>
                  )}
                </div>

                <div className="showcase-copy p-5 sm:p-6">
                  <div className="flex flex-wrap items-center gap-2">
                    <span className={badgeClass}>{item.title}</span>
                    <span className={badgeClass}>{item.kind === "image" ? "Image" : "Video"}</span>
                  </div>
                  <p className="mt-4 text-lg font-semibold text-white sm:text-xl">{item.caption}</p>

                  <div className="mt-4 flex flex-wrap gap-2">
                    {item.kind === "image" ? (
                      <button type="button" onClick={() => openViewer(item)} className={buttonMuted}>
                        Open viewer
                      </button>
                    ) : (
                      <a href={item.mediaUrl} target="_blank" rel="noreferrer" className={buttonMuted}>
                        Open video
                      </a>
                    )}
                    <a href={item.downloadUrl || item.mediaUrl} target="_blank" rel="noreferrer" className={buttonMuted}>
                      Download
                    </a>
                  </div>

                  <div className="mt-5 space-y-3">
                    {item.points.map((point) => (
                      <div
                        key={point}
                        className="rounded-2xl border border-white/10 bg-slate-950/30 px-4 py-3 text-sm leading-7 text-slate-300"
                      >
                        {point}
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </article>
          ))}
        </div>
      </section>

      <ImageViewerModal
        item={viewerItem}
        zoom={viewerZoom}
        onClose={() => setViewerItem(null)}
        onWheelZoom={(deltaY) => setViewerZoom((current) => Math.min(Math.max(current + (deltaY < 0 ? 0.12 : -0.12), 1), 4))}
      />
    </>
  );
}
