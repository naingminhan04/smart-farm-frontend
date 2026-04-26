import { useEffect, useMemo, useRef, useState } from "react";
import { buildCloudinaryAssetUrl, buildCloudinaryDownloadUrl } from "../lib/cloudinary";
import { FeatureImageViewer } from "./FeatureImageViewer";
import type {
  FeatureCardItem,
  FeatureCardProps,
  FeatureItem,
  ShowcaseMediaItem,
  ShowcaseMediaManifest,
  ViewerItem
} from "../types";
import { buttonMuted, panelClass } from "./ui";

const FEATURE_CARDS: FeatureCardItem[] = [
  {
    title: "Smart Humidification System",
    body: "Automatically monitors humidity and triggers the humidifier when conditions drop below the desired range, helping maintain a stable environment without manual switching."
  },
  {
    title: "Automatic Lighting System",
    body: "Uses ambient light sensing to turn farm lighting on/off at the right time, improving visibility and saving power while keeping the farm consistent day-to-night."
  },
  {
    title: "RFID Door Access",
    body: "Only authorized RFID cards can open the gate. Invalid access attempts keep the door closed and can be recorded for review, improving safety and control."
  },
  {
    title: "Laser-Fence Intrusion Alerts",
    body: "A laser fence detects interruptions as an intrusion signal. The system responds quickly to abnormal events and can surface alerts for monitoring."
  },
  {
    title: "Live IoT Monitoring",
    body: "Live telemetry is sent to the cloud so you can check farm conditions remotely. This enables tracking trends and responding faster when something changes."
  }
];

function FeatureCard({ title, body, href }: FeatureCardProps) {
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
          {FEATURE_CARDS.map((card) => (
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
