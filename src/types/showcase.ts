export type ShowcaseAccent = "sky" | "emerald" | "amber" | "rose";

export type ShowcaseMediaItem = {
  id: string;
  kind: "image" | "video";
  title: string;
  caption: string;
  alt?: string;
  publicId?: string;
  secureUrl?: string;
  format?: string;
  version?: string;
  posterPublicId?: string;
  posterFormat?: string;
  posterVersion?: string;
  downloadFileName?: string;
  published: boolean;
  accent?: ShowcaseAccent;
  points: string[];
};

export type ShowcaseMediaManifest = {
  items: ShowcaseMediaItem[];
};
