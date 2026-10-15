/**
 * Cloudinary delivery optimization.
 *
 * Injects `f_auto,q_auto,w_{width}` transforms into Cloudinary upload URLs so
 * remote content images are served in modern formats at sane sizes. Non-
 * Cloudinary URLs (or URLs already carrying `f_auto`) are returned unchanged.
 */
export function optimizeImageUrl(url: string, width = 1200): string {
  if (
    !url ||
    isOriginalBlogWebp(url) ||
    !url.includes("res.cloudinary.com") ||
    !url.includes("/upload/") ||
    url.includes("f_auto")
  ) {
    return url;
  }
  return url.replace("/upload/", `/upload/f_auto,q_auto,w_${width}/`);
}

export function isOriginalBlogWebp(url: string): boolean {
  return /^https:\/\/res\.cloudinary\.com\/[^/]+\/image\/upload\/v\d+\/portfolio\/blog\/[0-9a-f-]{36}\/[^?#]+\.webp(?:\?[^#]*)?$/.test(url);
}
