const cloudName = import.meta.env.VITE_CLOUDINARY_CLOUD_NAME?.trim() ?? "";

type ResourceType = "image" | "video";

type BuildAssetUrlOptions = {
  publicId: string;
  resourceType?: ResourceType;
  format?: string;
  version?: string;
  transforms?: string[];
};

function normalizePublicId(publicId: string) {
  return publicId.trim().replace(/^\/+/, "");
}

function joinTransforms(transforms: string[] | undefined) {
  return transforms?.filter(Boolean).join("/") ?? "";
}

export function getCloudinaryCloudName() {
  return cloudName;
}

export function hasCloudinaryConfig() {
  return Boolean(cloudName);
}

export function buildCloudinaryAssetUrl({
  publicId,
  resourceType = "image",
  format,
  version,
  transforms
}: BuildAssetUrlOptions) {
  if (!cloudName) return "";

  const normalizedPublicId = normalizePublicId(publicId);
  const transformationPath = joinTransforms(transforms);
  const versionPath = version ? `/${version}` : "";
  const formatSuffix = format ? `.${format}` : "";
  const transformationPrefix = transformationPath ? `/${transformationPath}` : "";

  return `https://res.cloudinary.com/${cloudName}/${resourceType}/upload${transformationPrefix}${versionPath}/${normalizedPublicId}${formatSuffix}`;
}

export function buildCloudinaryDownloadUrl(options: Omit<BuildAssetUrlOptions, "transforms"> & { fileName?: string }) {
  const attachmentName = options.fileName?.trim() ? `fl_attachment:${options.fileName}` : "fl_attachment";

  return buildCloudinaryAssetUrl({
    ...options,
    transforms: [attachmentName]
  });
}
