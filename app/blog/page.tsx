import type { Metadata } from "next";
import readingDuration from "reading-duration";
import { HeroTexture } from "@/app/components/HeroTexture";
import { BlogFilterBar } from "@/app/components/blog/BlogFilterBar";
import { FeaturedBlogCard } from "@/app/components/blog/FeaturedBlogCard";
import { BlogGridCard } from "@/app/components/blog/BlogGridCard";
import { CtaSection } from "@/app/components/home/CtaSection";
import {
  extractUniqueBlogCategories,
  fetchAndSortBlogPosts,
  formatDate,
} from "app/lib/utils";

export const revalidate = 3600;

export const metadata: Metadata = {
  title: "Blog | Handpicked Insights - Muhammad Haris",
  description:
    "Explore deep dives, tutorials, and insights on full-stack development, modern web architecture, Next.js, and security by Muhammad Haris.",
  openGraph: {
    title: "Blog | Handpicked Insights",
    description:
      "Explore deep dives, tutorials, and insights on full-stack development, modern web architecture, Next.js, and security by Muhammad Haris.",
    type: "website",
  },
};

type FormattedPost = {
  slug: string;
  title: string;
  summary: string;
  publishedAt: string;
  formattedDate: string;
  readingTime: string;
  imageName?: string;
  categories: string[];
};

export default async function BlogPage({
  searchParams,
}: {
  searchParams: Promise<{ category?: string }>;
}) {
  const allPosts = await fetchAndSortBlogPosts();
  const categoryParam = (await searchParams).category?.toLowerCase() || "";

  // Extract all categories dynamically from database
  const dynamicCategories = Array.from(
    extractUniqueBlogCategories(allPosts),
  );

  // Curated category list (matching reference)
  const defaultCategories = [
    "nextjs",
    "react",
    "performance",
    "web-vitals",
    "javascript",
    "css",
    "typescript",
    "architecture",
    "security",
    "developer-mindset",
  ];

  const combinedCategories = Array.from(
    new Set([...dynamicCategories, ...defaultCategories]),
  );

  const posts: FormattedPost[] = allPosts.map((post) => ({
    slug: post.slug,
    title: post.title,
    summary: post.summary,
    publishedAt: post.publishedAt,
    formattedDate: formatDate(post.publishedAt),
    readingTime: readingDuration(post.content || "", {
      wordsPerMinute: 200,
      emoji: false,
    }),
    imageName: post.imageName || "",
    categories: post.categories || [],
  }));

  // Filter posts based on active category
  const filteredPosts = categoryParam
    ? posts.filter((post) =>
        post.categories.some(
          (cat) => cat.toLowerCase() === categoryParam,
        ),
      )
    : posts;

  // The first post is featured
  const featuredPost = filteredPosts.length > 0 ? filteredPosts[0] : undefined;
  const latestPosts = featuredPost ? filteredPosts.slice(1) : [];

  return (
    <div className="relative">
      {/* Background paper texture shader */}
      <HeroTexture />

      {/* Main Page Layout — matches reference: pt-38 (152px) pb-24 */}
      <main className="relative z-10 pt-[152px] pb-24">
        {/* Page Header (The Pensieve) — matches reference h1 exactly */}
        <h1 className="relative z-[2] mx-auto mb-16 max-w-xl text-balance font-medium text-5xl tracking-tight max-sm:px-5 sm:text-5xl md:text-6xl text-center dark:[text-shadow:rgba(255,255,255,0.05)_0px_4px_8px,rgba(255,255,255,0.2)_0px_8px_30px]">
          <p className="mb-4 font-mono text-xs font-medium uppercase tracking-widest text-text-secondary">
            The Pensieve
          </p>
          <span className="inline-block text-neutral-900 dark:text-white [font-family:var(--font-instrument-serif),Georgia,serif]">
            Handpicked{" "}
            <span
              className="px-1 pb-1 italic animate-gradient-x text-colorfull"
              style={{
                textShadow: "none",
                maskImage: "linear-gradient(to right, black 70%, transparent 100%)",
                maskSize: "200% 100%",
                maskPosition: "left center",
                maskRepeat: "no-repeat",
              }}
            >
              Insights
            </span>
          </span>
        </h1>

        {/* Hairline Divider */}
        <div aria-hidden="true" className="w-full border-t border-border-primary" />

        {/* Filter Controls Section */}
        <section className="flex flex-col">
          {/* Category + Search + RSS Bar */}
          <BlogFilterBar categories={combinedCategories} />

          {/* Hairline Divider */}
          <div aria-hidden="true" className="w-full border-t border-border-primary" />

          {/* Featured articles kicker + card */}
          {featuredPost && (
            <>
              <h4 className="py-5 text-center font-mono text-text-secondary text-xs uppercase tracking-widest">
                Featured articles
              </h4>
              <div aria-hidden="true" className="w-full border-t border-border-primary" />

              <div className="px-2 py-4 sm:px-4">
                <FeaturedBlogCard
                  slug={featuredPost.slug}
                  title={featuredPost.title}
                  summary={featuredPost.summary}
                  readingTime={featuredPost.readingTime}
                  formattedDate={featuredPost.formattedDate}
                  imageName={featuredPost.imageName}
                  categories={featuredPost.categories}
                />
              </div>
            </>
          )}

          {/* Latest articles section */}
          {latestPosts.length > 0 && (
            <>
              <div aria-hidden="true" className="w-full border-t border-border-primary" />
              <h4 className="py-5 text-center font-mono text-text-secondary text-xs uppercase tracking-widest">
                Latest articles
              </h4>
              <div aria-hidden="true" className="w-full border-t border-border-primary" />

              <div className="px-2 py-4 sm:px-4">
                <div className="grid grid-cols-1 gap-3 md:grid-cols-2 lg:grid-cols-3">
                  {latestPosts.map((post, idx) => (
                    <BlogGridCard
                      key={post.slug}
                      slug={post.slug}
                      title={post.title}
                      summary={post.summary}
                      readingTime={post.readingTime}
                      formattedDate={post.formattedDate}
                      imageName={post.imageName}
                      index={idx}
                    />
                  ))}
                </div>
              </div>
            </>
          )}

          {/* Empty State */}
          {filteredPosts.length === 0 && (
            <div className="py-20 text-center">
              <p className="font-mono text-xs uppercase tracking-widest text-text-secondary">
                No articles found
              </p>
              <p className="mt-2 text-sm text-text-secondary">
                No published articles match the selected category &quot;{categoryParam}&quot;.
              </p>
            </div>
          )}
        </section>

        {/* Hairline Divider before CTA */}
        <div aria-hidden="true" className="mt-14 w-full border-t border-border-primary" />

        {/* Bottom CTA Callout */}
        <CtaSection />
      </main>
    </div>
  );
}
