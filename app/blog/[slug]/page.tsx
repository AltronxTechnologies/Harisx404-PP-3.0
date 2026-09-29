import { notFound, permanentRedirect } from "next/navigation";
import Image from "next/image";
import Link from "next/link";
import { Metadata, ResolvingMetadata } from "next";
import { MDXContent } from "@/app/components/mdx";
import { RelatedPostCard } from "@/app/components/blog/RelatedPostCard";
import { ImageLightbox } from "@/app/components/blog/ImageLightbox";
import { BlogArticleImage } from "@/app/components/blog/BlogArticleImage";
import { BlogCodeWindow, BlogInlineCode } from "@/app/components/blog/BlogCode";
import ArticleReactionWrapper from "@/app/components/ArticleReactionsWrapper";
import { CtaSection } from "@/app/components/home/CtaSection";
import { CopyUrlButton } from "@/app/components/blog/CopyUrlButton";
import { TableOfContents } from "@/app/components/TableOfContents";
import {
  getRelatedBlogPosts,
  getBlogPostBySlug,
  formatDate,
} from "@/app/lib/utils";
import { optimizeImageUrl } from "@/app/lib/image-utils";
import { fetchBlogIndexPosts, isLocalBlogDraft } from "@/app/blog/data";
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

  const readingTime = post.readingTimeMinutes
    ? `${post.readingTimeMinutes} min read`
    : formatReadingTime(post.code);

  const coverSrc = blogCoverSrc(post.imageName);

  return (
    <div className="relative min-w-0 pb-20">
      {/* Decorative hatched side rails — reference frame: 12px mobile / 32px desktop */}
      <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-y-0 left-0 hidden w-3 border-r border-border-primary sm:block lg:w-8 [background-image:repeating-linear-gradient(45deg,var(--tw-shadow-color,rgba(0,0,0,0.04))_0px,var(--tw-shadow-color,rgba(0,0,0,0.04))_1px,transparent_1px,transparent_7px)] dark:[background-image:repeating-linear-gradient(45deg,rgba(255,255,255,0.05)_0px,rgba(255,255,255,0.05)_1px,transparent_1px,transparent_7px)]"
      />
      <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-y-0 right-0 hidden w-3 border-l border-border-primary sm:block lg:w-8 [background-image:repeating-linear-gradient(45deg,var(--tw-shadow-color,rgba(0,0,0,0.04))_0px,var(--tw-shadow-color,rgba(0,0,0,0.04))_1px,transparent_1px,transparent_7px)] dark:[background-image:repeating-linear-gradient(45deg,rgba(255,255,255,0.05)_0px,rgba(255,255,255,0.05)_1px,transparent_1px,transparent_7px)]"
      />
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

      {/* Background hero cover — reference: absolute masked image behind the header */}
      {coverSrc && (
        <div
          aria-hidden="true"
          className="absolute inset-x-0 -top-16 z-0 h-80 w-full overflow-hidden bg-neutral-100/50 dark:bg-neutral-950/60 sm:-top-20"
          style={{
            maskImage:
              "linear-gradient(rgb(0,0,0) 40%, rgba(0,0,0,0) 100%)",
            WebkitMaskImage:
              "linear-gradient(rgb(0,0,0) 40%, rgba(0,0,0,0) 100%)",
          }}
        >
          <Image
            src={coverSrc}
            alt=""
            fill
            priority
            sizes="100vw"
            className="pointer-events-none select-none object-cover mix-blend-overlay"
          />
        </div>
      )}

      {/* Article header — reference: centered max-w-3xl, pt-56 total from top */}
      <header className="relative mx-auto flex w-full max-w-3xl flex-col items-center gap-y-5 px-4 pt-40 text-center sm:pt-36 md:px-6" style={{ maxWidth: "680px" }}>
        <Link
          href="/blog"
          className="text-neutral-500 text-sm transition-colors hover:text-neutral-700 dark:text-neutral-400 dark:hover:text-neutral-200"
        >
          Blog
        </Link>
        <h1 className="text-balance font-display text-3xl tracking-wide text-neutral-900 dark:text-white sm:text-4xl md:text-5xl">
          {post.title}
        </h1>
        {post.summary && (
          <p className="max-w-2xl text-pretty text-base text-text-secondary leading-relaxed sm:text-lg">
            {post.summary}
          </p>
        )}
      </header>

      {/* Meta row — reading time + copy URL on the left, date on the right */}
      <div className="relative mt-16 px-4 md:px-6">
        <div className="mx-auto flex w-full max-w-3xl flex-wrap items-center justify-between gap-x-4 gap-y-2 text-text-secondary text-sm" style={{ maxWidth: "680px" }}>
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
            className="cursor-help text-text-secondary"
            title={`Published ${formatDate(post.publishedAt)}`}
          >
            <span className="hidden sm:inline">Published </span>
            <time dateTime={post.publishedAt}>{longDate(post.publishedAt)}</time>
          </span>
        </div>
      </div>

      {/* Article body — reference: prose prose-neutral, centered max-w-3xl */}
      <div className="relative mt-6 mb-16 px-4 md:px-6">
        <article
          id="blog-article"
          className="blog-article-shell prose prose-neutral dark:prose-invert mx-auto min-w-0 max-w-3xl overflow-x-hidden break-words [&>*:first-child]:mt-0 [&>div>*:first-child]:mt-0"
          style={{ maxWidth: "680px" }}
        >
          <MDXContent code={post.code} components={{ img: BlogArticleImage, Image: BlogArticleImage, pre: BlogCodeWindow, code: BlogInlineCode }} />
        </article>
      </div>

      <section
        aria-labelledby="article-reactions-heading"
        className="relative mx-auto mb-16 w-full max-w-3xl border-t border-border-primary px-4 pt-6 md:px-6"
        style={{ maxWidth: "680px" }}
      >
        <h2
          id="article-reactions-heading"
          className="font-mono text-xs font-medium uppercase tracking-widest text-text-secondary"
        >
          React to this article
        </h2>
        <ArticleReactionWrapper slug={post.slug} />
      </section>

      <TableOfContents headings={post.headings} />
      <ImageLightbox />

      {/* More posts — reference: mono label between hairline dividers + 3-col grid */}
      {similarPosts.length > 0 && (
        <div className="relative py-10">
          <p className="mb-6 text-center font-mono text-[10px] text-text-secondary uppercase tracking-widest">
            More posts
          </p>
          <div aria-hidden="true" className="w-full border-t border-border-primary" />
          <div className="px-2 py-4 sm:px-4">
            <div className="mx-auto grid max-w-6xl grid-cols-1 gap-3 md:grid-cols-2 lg:grid-cols-3">
              {similarPosts.slice(0, 3).map((related) => (
                <RelatedPostCard
                  key={related.slug}
                  slug={related.slug}
                  title={related.title}
                  summary={related.summary}
                  imageName={related.imageName}
                />
              ))}
            </div>
          </div>
          <div aria-hidden="true" className="w-full border-t border-border-primary" />
        </div>
      )}

      {/* Contact CTA — same section used across the site */}
      <div className="relative mt-6">
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
