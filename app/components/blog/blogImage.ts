const ALLOWED_REMOTE_HOSTS = new Set([
  "res.cloudinary.com",
  "avatars.githubusercontent.com",
  "images.unsplash.com",
  "cdn.hashnode.com",
  "media.giphy.com",
  "dev-to-uploads.s3.amazonaws.com",
  "badges.pufler.dev",
  "img.shields.io",
  "framerusercontent.com",
]);

export function isAllowedBlogImageUrl(value: string) {
  try {
    const url = new URL(value);
    return url.protocol === "https:" && ALLOWED_REMOTE_HOSTS.has(url.hostname);
  } catch {
    return false;
  }
}

export function getBlogImageSrc(value?: string) {
  if (!value) return null;
  if (value.startsWith("/") && !value.startsWith("//")) return value;

  try {
    return isAllowedBlogImageUrl(value) ? value : null;
  } catch {
    return null;
  }
}
