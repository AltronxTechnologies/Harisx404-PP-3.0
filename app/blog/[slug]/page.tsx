import { notFound, permanentRedirect } from "next/navigation";
import Link from "next/link";
import { Metadata, ResolvingMetadata } from "next";
import { ArrowUpRight } from "lucide-react";
import { MDXContent } from "@/app/components/mdx";
import { RelatedPostCard } from "@/app/components/blog/RelatedPostCard";
import { ImageLightbox } from "@/app/components/blog/ImageLightbox";
import { BlogArticleImage } from "@/app/components/blog/BlogArticleImage";
import { BlogCodeWindow, BlogInlineCode } from "@/app/components/blog/BlogCode";
import ArticleReactionWrapper from "@/app/components/ArticleReactionsWrapper";
import { CtaSection } from "@/app/components/home/CtaSection";
import { SectionHeading } from "@/app/components/home/SectionHeading";
import { GridWrapper } from "@/app/components/GridWrapper";
import { PaperHeroTexture } from "@/app/components/PaperHeroTexture";
import { CopyUrlButton } from "@/app/components/blog/CopyUrlButton";
import { TableOfContents } from "@/app/components/TableOfContents";
import {
  getRelatedBlogPosts,
  getBlogPostBySlug,
  formatDate,
} from "@/app/lib/utils";
import { optimizeImageUrl } from "@/app/lib/image-utils";
import { fetchBlogIndexPosts, fetchBlogReactionSummaries, isLocalBlogDraft } from "@/app/blog/data";
import { getBlogImageSrc } from "@/app/components/blog/blogImage";
import { formatReadingTime } from "@/app/lib/reading-time";
import { siteMetadata } from "@/app/data/siteMetadata";
import { getPublicSupabase } from "@/app/lib/supabase/safe";

interface BlogPageProps {
  params: Promise<{ slug: string }>;
}

export const revalidate = 60;
export const dynamicParams = true;

export async function generateStaticParams() {
  try {
    const posts = await fetchBlogIndexPosts();
    return (posts ?? []).map((post) => ({ slug: post.slug }));
  } catch {
    return [];
  }
}

function longDate(date: string) {
  return new Intl.DateTimeFormat("en-US", {
    month: "long",
    day: "numeric",
    year: "numeric",
  }).format(new Date(date.includes("T") ? date : `${date}T00:00:00`));
}

async function getPostFromParams(params: BlogPageProps["params"]) {
  const { slug } = await params;
  if (isLocalBlogDraft(slug)) notFound();
  const post = await getBlogPostBySlug(slug);
  if (!post) {
    const supabase = getPublicSupabase();
    if (supabase) {
      const { data: history, error } = await supabase
        .from("blog_slug_history")
        .select("post_id")
        .eq("slug", slug)
        .maybeSingle();
      if (error && error.code !== "PGRST205" && error.code !== "42P01") throw new Error("Unable to resolve Blog article");
      if (history?.post_id) {
        const { data: current, error: lookupError } = await supabase
          .from("blog_posts")
          .select("slug")
          .eq("id", history.post_id)
          .eq("status", "published")
          .lte("published_at", new Date().toISOString())
          .maybeSingle();
        if (lookupError) throw new Error("Unable to resolve Blog article");
        if (current) permanentRedirect(`/blog/${encodeURIComponent(current.slug)}`);
      }
    }
    notFound();
  }
  return post;
}

function safeCanonicalUrl(value: string | undefined, slug: string) {
  if (value) {
    try {
      const url = new URL(value);
      if (["http:", "https:"].includes(url.protocol) && url.hostname && !url.username && !url.password) {
        return url.href;
      }
    } catch {
      // Ignore malformed legacy canonical URLs.
    }
  }
  return `/blog/${slug}`;
}

function blogCoverSrc(imageName: string) {
  if (!imageName) return "";
  const normalized = imageName.startsWith("http") || imageName.startsWith("/")
    ? imageName
    : `/blog/${imageName}`;
  return getBlogImageSrc(optimizeImageUrl(normalized, 1600)) || "";
}

export default async function BlogPage({ params }: BlogPageProps) {
  const post = await getPostFromParams(params);
  const similarPosts = (await getRelatedBlogPosts(post)).filter(
    (related) => !isLocalBlogDraft(related.slug),
  );
  const relatedReactions = await fetchBlogReactionSummaries(similarPosts.map((related) => related.slug));

  const readingTime = post.readingTimeMinutes
    ? `${post.readingTimeMinutes} min read`
    : formatReadingTime(post.code);

  const coverSrc = blogCoverSrc(post.imageName);

  return (
    <div className="blog-detail relative mt-14 min-w-0">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify({
            "@context": "https://schema.org",
            "@type": "BlogPosting",
            headline: post.title,
            ...(coverSrc ? { image: new URL(coverSrc, siteMetadata.siteUrl).href } : {}),
            datePublished: post.publishedAt,
            description: post.summary,
          }).replace(/</g, "\\u003c"),
        }}
      />

      <GridWrapper>
        <div className="relative px-4 xl:px-0">
          <PaperHeroTexture className="-inset-x-2 bottom-0 top-[-128px] sm:-inset-x-3 sm:top-[-144px] md:top-[-176px] lg:inset-x-0" />
          <header className="relative mx-auto flex w-full max-w-3xl flex-col items-center text-center" style={{ maxWidth: "680px" }}>
            <Link
              href="/blog"
              aria-label="Back to Blog"
              className="inline-flex min-h-6 items-center font-mono text-xs font-medium uppercase tracking-widest text-text-primary transition-colors hover:text-neutral-800 focus-visible:rounded-sm focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-current dark:hover:text-neutral-200"
            >
              Blog
            </Link>
            <h1 className="heading-glow mx-auto mt-4 max-w-xl break-words text-balance font-display text-[46px] font-medium leading-none tracking-tight text-text-primary md:text-[56px] md:tracking-[-1.5px]">
              {post.title}
            </h1>
            {post.summary && (
              <p className="mx-auto mt-4 max-w-2xl text-pretty text-[15px] leading-6 text-text-secondary [overflow-wrap:anywhere]">
                {post.summary}
              </p>
            )}
          </header>
        </div>
      </GridWrapper>

      {/* Meta row — reading time + copy URL on the left, date on the right */}
      <div className="relative mt-14 px-4 md:px-6">
        <div className="mx-auto flex w-full max-w-3xl flex-wrap items-center justify-between gap-x-4 gap-y-2 border-b border-border-primary pb-4 text-text-secondary text-sm" style={{ maxWidth: "680px" }}>
          <div className="flex items-center gap-x-4 gap-y-2">
            <div className="flex items-center gap-1.5">
              <svg
                xmlns="http://www.w3.org/2000/svg"
                fill="none"
                viewBox="0 0 24 24"
                strokeWidth={1.5}
                stroke="currentColor"
                className="size-3.5 shrink-0 text-neutral-400 dark:text-neutral-500"
                aria-hidden="true"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M12 6v6h4.5m4.5 0a9 9 0 1 1-18 0 9 9 0 0 1 18 0Z"
                />
              </svg>
              <span>{readingTime}</span>
            </div>
            <CopyUrlButton />
          </div>
          <span
            className="ml-auto cursor-help text-text-secondary"
            title={`Published ${formatDate(post.publishedAt)}`}
          >
            <time dateTime={post.publishedAt}>{longDate(post.publishedAt)}</time>
          </span>
        </div>
      </div>

      {/* Article body — reference: prose prose-neutral, centered max-w-3xl */}
      <div className="relative mt-8 mb-12 px-4 md:px-6">
        <article
          id="blog-article"
          className="blog-article-shell prose prose-neutral dark:prose-invert mx-auto min-w-0 max-w-3xl break-words [&>*:first-child]:mt-0 [&>div>*:first-child]:mt-0"
          style={{ maxWidth: "680px" }}
        >
          <MDXContent code={post.code} components={{ img: BlogArticleImage, Image: BlogArticleImage, pre: BlogCodeWindow, code: BlogInlineCode }} />
        </article>
      </div>

      <section
        aria-labelledby="article-reactions-heading"
        className="relative mb-16 px-4 md:px-6"
      >
        <div className="-mx-2 w-[calc(100%+16px)] border-t border-border-primary pt-8 sm:mx-auto sm:w-full" style={{ maxWidth: "680px" }}>
          <h2 id="article-reactions-heading" className="px-2 text-xl font-medium tracking-tight text-text-primary sm:px-0">
            React to this article
          </h2>
          <ArticleReactionWrapper slug={post.slug} />
        </div>
      </section>

      <TableOfContents headings={post.headings} />
      <ImageLightbox />

      {/* Curated recommendations retain their Admin-defined order. */}
      {similarPosts.length > 0 && (
        <section aria-labelledby="related-articles-heading" className="relative mx-auto max-w-6xl px-4 pb-16 pt-12 sm:px-6">
          <SectionHeading kicker="Continue exploring" headingId="related-articles-heading">
            Related{" "}
            <span className="animate-gradient-x text-colorfull px-1 pb-1 italic [text-shadow:none]">articles</span>
          </SectionHeading>
          <div className="mt-14 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {similarPosts.map((related, index) => (
              <RelatedPostCard
                key={related.slug}
                className={index >= 2 ? "hidden lg:flex" : undefined}
                slug={related.slug}
                title={related.title}
                summary={related.summary}
                imageName={related.imageName}
                reactionSummary={relatedReactions[related.slug]}
              />
            ))}
          </div>
        </section>
      )}
      {similarPosts.length === 0 && (
        <div className="mx-auto max-w-6xl px-4 py-14 text-center sm:px-6">
          <p className="font-mono text-xs uppercase tracking-widest text-text-secondary">Keep exploring</p>
          <Link href="/blog" className="mt-4 inline-flex min-h-11 items-center gap-2 rounded-full border border-border-primary px-5 text-sm font-medium text-text-primary transition-colors hover:border-neutral-400/70 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-text-primary dark:hover:border-white/25">
            Browse all articles <ArrowUpRight className="size-4" aria-hidden="true" />
          </Link>
        </div>
      )}

      {/* Contact CTA — same section used across the site */}
      <div className={similarPosts.length > 0 ? "relative mt-10" : "relative mt-6"}>
        <CtaSection />
      </div>
    </div>
  );
}

export async function generateMetadata(
  { params }: BlogPageProps,
  parent: ResolvingMetadata,
): Promise<Metadata> {
  const slug = (await params).slug;
  if (isLocalBlogDraft(slug)) notFound();
  const post = await getBlogPostBySlug(slug);

  if (!post) {
    return { title: "Blog Post Not Found" };
  }

  const previousImages = (await parent)?.openGraph?.images || [];
  const coverSrc = blogCoverSrc(post.imageName);
  const socialImage = coverSrc
    ? new URL(coverSrc, siteMetadata.siteUrl).href
    : `/api/og?title=${encodeURIComponent(post.title)}&category=Blog`;

  return {
    title: post.title,
    description: post.summary,
    alternates: {
      canonical: safeCanonicalUrl(post.canonicalUrl, post.slug),
    },
    openGraph: {
      title: post.title,
      description: post.summary,
      type: "article",
      publishedTime: post.publishedAt,
      images: [
        {
          url: socialImage,
          alt: post.title,
        },
        ...previousImages,
      ],
    },
    twitter: {
      card: "summary_large_image",
      title: post.title,
      description: post.summary,
      images: [socialImage],
    },
  };
}
