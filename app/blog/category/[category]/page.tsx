import { redirect } from "next/navigation";

/**
 * Legacy route: `/blog/category/<name>`.
 *
 * Nothing in the app links here any more — `BlogFilterBar` navigates to
 * `/blog?category=<name>`, which is the view that actually works. This route
 * was still reachable and rendered an EMPTY page with HTTP 200 for every
 * category, valid or not: a soft 404 that let search engines index
 * `/blog/category/<anything>` as a real page.
 *
 * Rather than delete it (which would 404 any existing inbound link or old
 * search result), redirect to the canonical filtered view. `redirect()` issues
 * a 307 in a Server Component, so crawlers follow it and consolidate ranking
 * onto `/blog`.
 */
export default async function CategoryPage({
  params,
}: {
  params: Promise<{ category: string }>;
}) {
  const { category } = await params;
  const slug = (category ?? "").toLowerCase();
  redirect(slug ? `/blog?category=${encodeURIComponent(slug)}` : "/blog");
}
