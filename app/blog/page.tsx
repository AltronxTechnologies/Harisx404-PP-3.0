import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";
import { BlogFilterBar } from "@/app/components/blog/BlogFilterBar";
import { BlogGridCard } from "@/app/components/blog/BlogGridCard";
import { FeaturedBlogCard } from "@/app/components/blog/FeaturedBlogCard";
import { BlogViewportMode } from "@/app/components/blog/BlogViewportMode";
import { GridWrapper } from "@/app/components/GridWrapper";
import { PaperHeroTexture } from "@/app/components/PaperHeroTexture";
import { CtaSection } from "@/app/components/home/CtaSection";
import {
  fetchBlogIndexPosts,
  fetchBlogReactionSummaries,
} from "@/app/blog/data";

export const revalidate = 3600;

const DESKTOP_FIRST_PAGE_POSTS = 10;
const DESKTOP_LATER_PAGE_POSTS = 9;
const COMPACT_FIRST_PAGE_POSTS = 7;
const COMPACT_LATER_PAGE_POSTS = 8;

const description =
  "Explore practical deep dives on software engineering, modern web architecture, performance, and security.";

type BlogSearchParams = {
  category?: string | string[];
  page?: string | string[];
  view?: string | string[];
};

function firstParam(value: string | string[] | undefined) {
  return Array.isArray(value) ? value[0] : value;
}

function normalizeCategory(value: string | undefined) {
  return value?.trim().toLowerCase().slice(0, 80) || "";
}

function formatPublishedDate(value: string) {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "Date unavailable";
  return new Intl.DateTimeFormat("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
    timeZone: "UTC",
  }).format(date);
}

function pageHref(page: number, category: string, compact = false) {
  const params = new URLSearchParams();
  if (category) params.set("category", category);
  if (page > 1) params.set("page", String(page));
  if (compact) params.set("view", "compact");
  const query = params.toString();
  return query ? `/blog?${query}` : "/blog";
}

export async function generateMetadata({
  searchParams,
}: {
  searchParams: Promise<BlogSearchParams>;
}): Promise<Metadata> {
  const params = await searchParams;
  const ambiguousCategory = Array.isArray(params.category);
  const category = Array.isArray(params.category)
    ? ""
    : normalizeCategory(params.category);
  const rawPage = firstParam(params.page);
  const page = rawPage && /^\d+$/.test(rawPage)
    ? Math.max(1, Number.parseInt(rawPage, 10))
    : 1;
  const compact = firstParam(params.view) === "compact";
  const qualifier = [
    category ? category.replace(/-/g, " ") : "",
    page > 1 ? `Page ${page}` : "",
  ].filter(Boolean).join(" · ");
  const title = qualifier
    ? `Blog · ${qualifier} | Muhammad Haris`
    : "Blog | Handpicked Insights - Muhammad Haris";
  const categoryPosts = category ? await fetchBlogIndexPosts() : [];
  const validCategory = categoryPosts.some((post) =>
    post.categories.some(
      (candidate) => candidate.toLowerCase() === category,
    ),
  );
  const invalidCategory = ambiguousCategory || Boolean(category && !validCategory);

  return {
    title,
    description,
    alternates: {
      canonical: invalidCategory || compact ? "/blog" : pageHref(page, category),
    },
    robots: invalidCategory || compact ? { index: false, follow: true } : undefined,
    openGraph: {
      title,
      description,
      type: "website",
    },
  };
}

function paginationItems(currentPage: number, totalPages: number) {
  if (totalPages <= 5) return Array.from({ length: totalPages }, (_, index) => index + 1);
  const pages = new Set([1, totalPages, currentPage - 1, currentPage, currentPage + 1]);
  const sorted = Array.from(pages)
    .filter((page) => page >= 1 && page <= totalPages)
    .sort((a, b) => a - b);
  const items: Array<number | "gap"> = [];
  sorted.forEach((page, index) => {
    if (index > 0 && page - sorted[index - 1] > 1) items.push("gap");
    items.push(page);
  });
  return items;
}

function paginationConfig(compact: boolean) {
  return compact
    ? { firstPage: COMPACT_FIRST_PAGE_POSTS, laterPages: COMPACT_LATER_PAGE_POSTS }
    : { firstPage: DESKTOP_FIRST_PAGE_POSTS, laterPages: DESKTOP_LATER_PAGE_POSTS };
}

function pageBounds(page: number, compact: boolean) {
  const { firstPage, laterPages } = paginationConfig(compact);
  if (page === 1) return { start: 0, end: firstPage };
  const start = firstPage + (page - 2) * laterPages;
  return { start, end: start + laterPages };
}

export default async function BlogPage({
  searchParams,
}: {
  searchParams: Promise<BlogSearchParams>;
}) {
  const allPosts = await fetchBlogIndexPosts();
  const params = await searchParams;
  const ambiguousCategory = Array.isArray(params.category);
  const categoryParam = ambiguousCategory
    ? ""
    : normalizeCategory(firstParam(params.category));
  const rawPage = firstParam(params.page);
  const rawView = firstParam(params.view);
  const compact = rawView === "compact";
  const invalidView = Array.isArray(params.view) || Boolean(rawView && rawView !== "compact");
  const requestedPage = rawPage && /^\d+$/.test(rawPage)
    ? Number.parseInt(rawPage, 10)
    : 1;

  const categories = allPosts
    .flatMap((post) => post.categories)
    .filter(
      (category, index, values) =>
        values.findIndex(
          (candidate) => candidate.toLowerCase() === category.toLowerCase(),
        ) === index,
    );

  const posts = allPosts.map((post) => ({
    slug: post.slug,
    title: post.title,
    summary: post.summary,
    publishedAt: post.publishedAt,
    formattedDate: formatPublishedDate(post.publishedAt),
    readingTime: post.readingTime,
    imageName: post.imageName || "",
    categories: post.categories || [],
    featured: post.featured,
  }));

  const validCategory = categories.some(
    (category) => category.toLowerCase() === categoryParam,
  );
  const filteredPosts = ambiguousCategory
    ? []
    : categoryParam
    ? posts.filter((post) =>
        post.categories.some(
          (category) => category.toLowerCase() === categoryParam,
        ),
      )
    : posts;
  const editorialFeatured = categoryParam
    ? undefined
    : filteredPosts.find((post) => post.featured);
  const orderedPosts = editorialFeatured
    ? [editorialFeatured, ...filteredPosts.filter((post) => post !== editorialFeatured)]
    : filteredPosts;
  const { firstPage, laterPages } = paginationConfig(compact);
  const totalPages = orderedPosts.length <= firstPage
    ? 1
    : 1 + Math.ceil((orderedPosts.length - firstPage) / laterPages);
  const currentPage = Number.isFinite(requestedPage)
    ? Math.min(Math.max(requestedPage, 1), totalPages)
    : 1;
  const canonicalPage = currentPage > 1 ? String(currentPage) : undefined;
  const rawCategory = firstParam(params.category);
  if (
    !ambiguousCategory &&
    params.page !== undefined &&
    (Array.isArray(params.page) || rawPage !== canonicalPage)
  ) {
    redirect(pageHref(currentPage, categoryParam, compact));
  }
  if (!ambiguousCategory && rawCategory !== undefined && rawCategory !== categoryParam) {
    redirect(pageHref(currentPage, categoryParam, compact));
  }
  if (invalidView) {
    redirect(pageHref(currentPage, categoryParam));
  }
  const { start: pageStart, end: pageEnd } = pageBounds(currentPage, compact);
  const pagePosts = orderedPosts.slice(pageStart, pageEnd);
  const reactionSummaries = await fetchBlogReactionSummaries(
    pagePosts.map((post) => post.slug),
  );
  const featuredPost = currentPage === 1 ? pagePosts[0] : undefined;
  const latestPosts = featuredPost ? pagePosts.slice(1) : pagePosts;
  const hasInvalidCategory = ambiguousCategory || Boolean(categoryParam && !validCategory);

  return (
    <div className="relative mt-14 pb-24">
      <BlogViewportMode />
      <GridWrapper>
        <div className="relative px-4 xl:px-0">
          <PaperHeroTexture className="-inset-x-2 bottom-0 top-[-128px] sm:-inset-x-3 sm:top-[-144px] md:top-[-176px] lg:inset-x-0" />
          <header className="relative mx-auto max-w-3xl text-center">
            <p className="font-mono text-xs font-medium uppercase tracking-widest text-text-secondary">
              The Pensieve
            </p>
            <h1 className="heading-glow mx-auto mt-4 max-w-xl text-balance [font-family:var(--font-instrument-serif),serif] text-[46px] font-medium leading-none tracking-tight text-text-primary md:text-[56px] md:tracking-[-1.5px]">
              Handpicked{" "}
              <span className="animate-gradient-x text-colorfull px-1 pb-1 italic [text-shadow:none]">
                Insights
              </span>
            </h1>
            <p className="mx-auto mt-4 max-w-2xl text-pretty text-[15px] leading-6 text-text-secondary">
              Practical notes on building thoughtful software, from resilient
              interfaces and web performance to architecture and security.
            </p>
          </header>
        </div>
      </GridWrapper>

      <section aria-label="Browse articles" className="mt-14">
        <BlogFilterBar
          categories={categories}
          invalidCategory={ambiguousCategory}
          compact={compact}
        />

        <div className={compact ? "lg:hidden" : "hidden lg:block"}>
        <div className="mt-14 space-y-14 px-2 sm:px-4">
          {featuredPost && (
            <section aria-labelledby="featured-article-heading">
              <div className="mb-6 flex items-center justify-between gap-4">
                <h2
                  id="featured-article-heading"
                  className="font-mono text-xs font-medium uppercase tracking-widest text-text-secondary"
                >
                  {categoryParam
                    ? `Newest in ${categoryParam}`
                    : editorialFeatured
                      ? "Featured article"
                      : "Newest article"}
                </h2>
                <span className="font-mono text-[11px] uppercase tracking-widest text-text-secondary">
                  {String(orderedPosts.length).padStart(2, "0")} {orderedPosts.length === 1 ? "article" : "articles"}
                </span>
              </div>
              <FeaturedBlogCard
                slug={featuredPost.slug}
                title={featuredPost.title}
                summary={featuredPost.summary}
                readingTime={featuredPost.readingTime}
                publishedAt={featuredPost.publishedAt}
                formattedDate={featuredPost.formattedDate}
                imageName={featuredPost.imageName}
                reactionSummary={reactionSummaries[featuredPost.slug]}
              />
            </section>
          )}

          {latestPosts.length > 0 && (
            <section aria-labelledby="latest-articles-heading">
              <div className="mb-6 flex items-center justify-between gap-4 border-b border-border-primary pb-4" role="status" aria-live="polite">
                <h2
                  id="latest-articles-heading"
                  className="font-mono text-xs font-medium uppercase tracking-widest text-text-secondary"
                >
                  {currentPage === 1 ? "Latest articles" : `Articles, page ${currentPage}`}
                </h2>
                <span className="font-mono text-[11px] uppercase tracking-widest text-text-secondary">
                  Page {String(currentPage).padStart(2, "0")} / {String(totalPages).padStart(2, "0")}
                </span>
              </div>
              <div className="grid grid-cols-1 gap-3 md:grid-cols-2 lg:grid-cols-3">
                {latestPosts.map((post, index) => (
                  <BlogGridCard
                    key={post.slug}
                    slug={post.slug}
                    title={post.title}
                    summary={post.summary}
                    readingTime={post.readingTime}
                    publishedAt={post.publishedAt}
                    formattedDate={post.formattedDate}
                    imageName={post.imageName}
                    index={index}
                    reactionSummary={reactionSummaries[post.slug]}
                  />
                ))}
              </div>
            </section>
          )}

          {pagePosts.length === 0 && (
            <div className="rounded-3xl border border-border-primary bg-white px-6 py-16 text-center dark:bg-white/[0.02]">
              <p className="font-mono text-xs font-medium uppercase tracking-widest text-text-secondary">
                {hasInvalidCategory ? "Unknown category" : "No articles yet"}
              </p>
              <h2 className="mt-4 font-display text-3xl font-medium text-text-primary">
                {hasInvalidCategory
                  ? "That filter does not match the published collection."
                  : "The next article is still being prepared."}
              </h2>
              <Link
                href="/blog"
                className="mt-6 inline-flex min-h-8 items-center rounded-full border border-border-primary px-4 font-mono text-[11px] uppercase tracking-widest text-text-secondary transition-colors hover:border-neutral-400/70 hover:text-text-primary active:border-neutral-400/70 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-text-primary dark:hover:border-white/25 dark:active:border-white/25"
              >
                View all articles
              </Link>
            </div>
          )}

          {orderedPosts.length > firstPage && (
            <nav aria-label="Blog pages" className="flex flex-col items-center gap-4 pt-2">
              <div className="flex flex-wrap items-center justify-center gap-2">
                {currentPage === 1 ? (
                  <span className="inline-flex min-h-8 items-center rounded-full border border-border-primary px-4 font-mono text-[11px] uppercase tracking-widest text-text-secondary opacity-40">
                    Previous
                  </span>
                ) : (
                  <Link
                    prefetch={false}
                    href={pageHref(currentPage - 1, categoryParam, compact)}
                    className="inline-flex min-h-8 items-center rounded-full border border-border-primary px-4 font-mono text-[11px] uppercase tracking-widest text-text-secondary transition-colors hover:border-neutral-400/70 hover:text-text-primary active:border-neutral-400/70 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-text-primary dark:hover:border-white/25 dark:active:border-white/25"
                  >
                    Previous
                  </Link>
                )}
                {paginationItems(currentPage, totalPages).map((item, index) =>
                  item === "gap" ? (
                    <span key={`gap-${index}`} aria-hidden className="px-0.5 font-mono text-xs text-text-secondary">…</span>
                  ) : (
                    <Link
                      prefetch={false}
                      key={item}
                      href={pageHref(item, categoryParam, compact)}
                      aria-current={item === currentPage ? "page" : undefined}
                      aria-label={`Page ${item}${item === currentPage ? ", current page" : ""}`}
                      className={`inline-flex size-8 items-center justify-center rounded-full border font-mono text-xs transition-colors focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-text-primary ${
                        item === currentPage
                          ? "border-text-primary bg-text-primary text-bg-primary"
                          : "border-border-primary text-text-secondary hover:border-neutral-400/70 hover:text-text-primary active:border-neutral-400/70 dark:hover:border-white/25 dark:active:border-white/25"
                      }`}
                    >
                      {String(item).padStart(2, "0")}
                    </Link>
                  ),
                )}
                {currentPage === totalPages ? (
                  <span className="inline-flex min-h-8 items-center rounded-full border border-border-primary px-4 font-mono text-[11px] uppercase tracking-widest text-text-secondary opacity-40">
                    Next
                  </span>
                ) : (
                  <Link
                    prefetch={false}
                    href={pageHref(currentPage + 1, categoryParam, compact)}
                    className="inline-flex min-h-8 items-center rounded-full border border-border-primary px-4 font-mono text-[11px] uppercase tracking-widest text-text-secondary transition-colors hover:border-neutral-400/70 hover:text-text-primary active:border-neutral-400/70 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-text-primary dark:hover:border-white/25 dark:active:border-white/25"
                  >
                    Next
                  </Link>
                )}
              </div>
              <p className="font-mono text-[11px] uppercase tracking-[0.2em] text-text-secondary">
                Showing {String(pageStart + 1).padStart(2, "0")}–{String(Math.min(pageEnd, orderedPosts.length)).padStart(2, "0")} of {String(orderedPosts.length).padStart(2, "0")}
              </p>
            </nav>
          )}
        </div>
        <div className="mt-28">
          <CtaSection />
        </div>
        </div>

        <div
          role="status"
          className={`min-h-screen items-start justify-center pt-20 font-mono text-xs uppercase tracking-widest text-text-secondary ${
            compact ? "hidden lg:flex" : "flex lg:hidden"
          }`}
        >
          Aligning articles to this screen
        </div>
      </section>
    </div>
  );
}
