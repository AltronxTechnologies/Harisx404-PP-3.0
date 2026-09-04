const ALLOWED_REMOTE_HOSTS = new Set([
  "res.cloudinary.com",
  "avatars.githubusercontent.com",
  "images.unsplash.com",
  "cdn.hashnode.com",
]);

export function getBlogImageSrc(value?: string) {
  if (!value) return null;
  if (value.startsWith("/") && !value.startsWith("//")) return value;

  try {
    const url = new URL(value);
    return url.protocol === "https:" && ALLOWED_REMOTE_HOSTS.has(url.hostname)
      ? value
      : null;
  } catch {
    return null;
  }
}
