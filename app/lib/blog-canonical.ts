export function isOwnBlogCanonical(slug: string, canonicalUrl: string | null, siteUrl: string) {
  if (!canonicalUrl) return true;
  try {
    const own = new URL(`/blog/${slug}`, siteUrl);
    const canonical = new URL(canonicalUrl);
    if (!["http:", "https:"].includes(canonical.protocol) || canonical.username || canonical.password) return true;
    return canonical.href === own.href;
  } catch {
    // Invalid legacy values are ignored by article metadata as well.
    return true;
  }
}
