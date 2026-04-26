export type FeatureItem = {
  id: string;
  title: string;
  caption: string;
  points: string[];
  imageUrl: string;
  downloadUrl: string;
  alt: string;
};

export type ViewerItem = {
  title: string;
  alt: string;
  imageUrl: string;
  downloadUrl: string;
};

export type NaturalSize = {
  width: number;
  height: number;
};

export type BaseFitSize = {
  width: number;
  height: number;
};

export type FeatureCardItem = {
  title: string;
  body: string;
};
