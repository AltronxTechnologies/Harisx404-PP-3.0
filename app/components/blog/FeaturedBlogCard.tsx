import Image from "next/image";
import Link from "next/link";
import { DoubleArrow } from "@/app/components/home/DoubleArrow";
import { getBlogImageSrc } from "@/app/components/blog/blogImage";
import { ReactionSummaryPill } from "@/app/components/blog/ReactionSummaryPill";
import type { ReactionSummary } from "@/app/blog/data";

export interface FeaturedBlogCardProps {
  slug: string;
  title: string;
  summary: string;
  readingTime: string;
  publishedAt: string;
  formattedDate: string;
  imageName?: string;
  categories?: string[];
  reactionSummary?: ReactionSummary;
}

export function FeaturedBlogCard({
  slug,
  title,
  summary,
  readingTime,
  publishedAt,
  formattedDate,
  imageName,
  categories = [],
  reactionSummary,
}: FeaturedBlogCardProps) {
  const imageSrc = getBlogImageSrc(imageName);
  return (
    <Link
      href={`/blog/${slug}`}
      className="group relative flex flex-col rounded-3xl border border-border-primary bg-white p-3 transition-all hover:border-neutral-400/70 hover:shadow-lg dark:bg-white/[0.02] dark:hover:border-white/25 md:flex-row"
    >
      <div className="relative aspect-video w-full shrink-0 overflow-hidden rounded-2xl bg-slate-900 md:aspect-auto md:min-h-[360px] md:w-1/2">
        {imageSrc ? (
          <Image
            src={imageSrc}
            alt=""
            aria-hidden
            fill
            priority
            sizes="(max-width: 767px) calc(100vw - 88px), (max-width: 1279px) 50vw, 600px"
            className="object-cover transition-transform duration-500 group-hover:scale-105 motion-reduce:transition-none motion-reduce:group-hover:scale-100"
          />
        ) : (
          <div aria-hidden className="flex size-full items-center justify-center bg-slate-900 p-8">
            <span className="max-w-md text-balance text-center font-display text-3xl font-medium italic leading-tight text-white">
              {title}
            </span>
          </div>
        )}
      </div>

      <div className="flex flex-1 flex-col justify-center px-4 py-6 sm:px-6 md:px-8 md:py-8">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div className="font-mono text-xs uppercase tracking-widest text-text-secondary">
            <span>{readingTime}</span>
            <span className="mx-2" aria-hidden>·</span>
            <time dateTime={publishedAt}>{formattedDate}</time>
          </div>
          <ReactionSummaryPill summary={reactionSummary} />
        </div>

        <h3 className="mt-4 text-balance font-display text-2xl font-medium leading-tight text-text-primary">
          {title}
        </h3>

        <p className="mt-4 line-clamp-3 text-[15px] leading-6 text-text-secondary">
          {summary}
        </p>

        {categories.length > 0 && (
          <div className="mt-6 flex flex-wrap gap-2" aria-label="Article categories">
            {categories.map((category) => (
              <span
                key={category}
                className="rounded-md border border-border-primary px-2 py-1 font-mono text-[11px] uppercase tracking-widest text-text-secondary"
              >
                {category}
              </span>
            ))}
          </div>
        )}

        <div className="mt-8 inline-flex items-center gap-2 self-start font-mono text-xs uppercase tracking-widest text-text-secondary transition-colors group-hover:text-text-primary">
          Read article
          <DoubleArrow />
        </div>
      </div>
    </Link>
  );
}
