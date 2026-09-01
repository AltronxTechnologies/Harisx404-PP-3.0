import { notFound } from "next/navigation";
import Image from "next/image";
import Link from "next/link";
import readingDuration from "reading-duration";
import { Metadata, ResolvingMetadata } from "next";
import { MDXContent } from "@/app/components/mdx";
import { RelatedPostCard } from "@/app/components/blog/RelatedPostCard";
import { ImageLightbox } from "@/app/components/blog/ImageLightbox";
import { NewsletterSignUp } from "@/app/components/NewsletterSignUp";
import { CtaSection } from "@/app/components/home/CtaSection";
import { CopyUrlButton } from "@/app/components/blog/CopyUrlButton";
import { TableOfContents } from "@/app/components/TableOfContents";
import {
  getRelatedBlogPosts,
  getBlogPostBySlug,
  fetchAndSortBlogPosts,
  formatDate,
} from "@/app/lib/utils";
import { optimizeImageUrl } from "@/app/lib/image-utils";

interface BlogPageProps {
  params: Promise<{ slug: string }>;
}

export const revalidate = 3600;
export const dynamicParams = true;

export async function generateStaticParams() {
  try {
    const posts = await fetchAndSortBlogPosts();
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
  const post = await getBlogPostBySlug(slug);
  if (!post) notFound();
  return post;
}

export default async function BlogPage({ params }: BlogPageProps) {
  const post = await getPostFromParams(params);
  const similarPosts = await getRelatedBlogPosts(post);

  const readingTime = readingDuration(post.code, {
    wordsPerMinute: 200,
    emoji: false,
  });

  const coverSrc = post.imageName
    ? optimizeImageUrl(
        post.imageName.startsWith("http") || post.imageName.startsWith("/")
          ? post.imageName
          : `/blog/${post.imageName}`,
        1600,
      )
    : "";

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
            ...(coverSrc ? { image: coverSrc } : {}),
            datePublished: post.publishedAt,
            author: { "@type": "Person", name: "Muhammad Haris" },
            description: post.summary,
          }),
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
      <header className="relative mx-auto flex w-full max-w-3xl flex-col items-center gap-y-5 px-4 pt-40 text-center sm:pt-36 md:px-6">
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
        <div className="mx-auto flex w-full max-w-3xl flex-wrap items-center justify-between gap-x-4 gap-y-2 text-text-secondary text-sm">
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
            <span className="hidden sm:inline">Updated </span>
            <time dateTime={post.publishedAt}>{longDate(post.publishedAt)}</time>
          </span>
        </div>
      </div>

      {/* Article body — reference: prose prose-neutral, centered max-w-3xl */}
      <div className="relative mt-6 mb-16 px-4 md:px-6">
        <article
          id="blog-article"
          className="blog-article-shell prose prose-neutral dark:prose-invert mx-auto min-w-0 max-w-3xl overflow-x-hidden break-words [&>*:first-child]:mt-0 [&>div>*:first-child]:mt-0"
        >
          <MDXContent code={post.code} />
        </article>
      </div>

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

      {/* Newsletter — stay in the loop after reading */}
      <div className="relative mx-auto mt-10 w-full max-w-3xl px-4 md:px-6">
        <NewsletterSignUp
          title="Enjoyed this write-up?"
          description="Get new articles on web, security, and AI/ML straight to your inbox. No spam, unsubscribe anytime."
        />
      </div>

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

  return {
    title: post.title,
    description: post.summary,
    openGraph: {
      title: post.title,
      description: post.summary,
      type: "article",
      publishedTime: post.publishedAt,
      authors: ["Muhammad Haris"],
      images: [
        {
          url: `/api/og?title=${encodeURIComponent(post.title)}&summary=${encodeURIComponent(post.summary)}&image=${encodeURIComponent(post.imageName)}`,
          width: 1200,
          height: 630,
          alt: post.title,
        },
        ...previousImages,
      ],
    },
    twitter: {
      card: "summary_large_image",
      title: post.title,
      description: post.summary,
      images: [
        `/api/og?title=${encodeURIComponent(post.title)}&summary=${encodeURIComponent(post.summary)}&image=${encodeURIComponent(post.imageName)}`,
      ],
    },
  };
}
