import Image from "next/image";
import Link from "next/link";
import { getBlogImageSrc } from "@/app/components/blog/blogImage";
import { ReactionSummaryPill } from "@/app/components/blog/ReactionSummaryPill";
import type { ReactionSummary } from "@/app/blog/data";
import { AdaptiveCardCopy } from "@/app/components/blog/AdaptiveCardCopy";
import { ArticleCardArrow } from "@/app/components/blog/ArticleCardArrow";

export interface FeaturedBlogCardProps {
  slug: string;
  title: string;
  summary: string;
  readingTime: string;
  publishedAt: string;
  formattedDate: string;
  imageName?: string;
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
  reactionSummary,
}: FeaturedBlogCardProps) {
  const imageSrc = getBlogImageSrc(imageName);
  return (
    <Link
      href={`/blog/${slug}`}
      aria-label={
        reactionSummary
          ? `Read ${title}. ${reactionSummary.total} reactions.`
          : `Read ${title}.`
      }
      className="group relative flex flex-col rounded-3xl border border-border-primary bg-white p-3 transition-all hover:border-neutral-400/70 hover:shadow-lg dark:bg-white/[0.02] dark:hover:border-white/25 md:flex-row"
    >
      <div className="relative aspect-[16/11] w-full shrink-0 overflow-hidden rounded-2xl bg-slate-900 md:aspect-auto md:min-h-[260px] md:w-1/2 lg:min-h-[300px]">
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
          <div aria-hidden className="flex size-full items-center justify-center bg-slate-900 p-6 md:p-8">
            <span className="text-balance text-center font-display text-2xl font-medium italic leading-tight text-white md:max-w-md md:text-3xl">
              {title}
            </span>
          </div>
        )}
        <span className="absolute left-3 top-3 rounded-full border border-white/30 bg-black/70 px-3 py-1 font-mono text-[10px] uppercase tracking-widest text-white backdrop-blur-sm">
          Featured
        </span>
      </div>

      <div className="flex flex-1 flex-col px-2 pb-3 pt-4 md:justify-center md:px-6 md:py-6 lg:px-8 lg:py-8">
        <div className="flex items-center justify-between gap-4 font-mono text-[11px] uppercase tracking-widest text-text-secondary md:text-xs">
          <span className="shrink-0">{readingTime}</span>
          <time className="truncate text-right" dateTime={publishedAt} title={formattedDate}>
            {formattedDate}
          </time>
        </div>

        <AdaptiveCardCopy title={title} summary={summary} featured />

        <div className="mt-auto flex min-h-7 items-center justify-between gap-2.5 pt-4">
          <div className="flex min-h-7 min-w-0 items-center">
            <ReactionSummaryPill summary={reactionSummary} />
          </div>
          <span className="inline-flex shrink-0 items-center gap-2 font-mono text-[11px] uppercase leading-none tracking-widest text-text-secondary transition-colors group-hover:text-text-primary md:text-xs">
            Read article
            <ArticleCardArrow />
          </span>
        </div>
      </div>
    </Link>
  );
}
