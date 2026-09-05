import Image from "next/image";
import Link from "next/link";
import { DoubleArrow } from "@/app/components/home/DoubleArrow";
import { getBlogImageSrc } from "@/app/components/blog/blogImage";
import { ReactionSummaryPill } from "@/app/components/blog/ReactionSummaryPill";
import type { ReactionSummary } from "@/app/blog/data";
import { AdaptiveCardCopy } from "@/app/components/blog/AdaptiveCardCopy";

export interface BlogGridCardProps {
  slug: string;
  title: string;
  summary: string;
  readingTime: string;
  publishedAt: string;
  formattedDate: string;
  imageName?: string;
  index?: number;
  reactionSummary?: ReactionSummary;
}

export function BlogGridCard({
  slug,
  title,
  summary,
  readingTime,
  publishedAt,
  formattedDate,
  imageName,
  reactionSummary,
}: BlogGridCardProps) {
  const imageSrc = getBlogImageSrc(imageName);
  return (
    <Link
      href={`/blog/${slug}`}
      className="group flex h-full flex-col rounded-3xl border border-border-primary bg-white p-3 transition-all hover:border-neutral-400/70 hover:shadow-lg dark:bg-white/[0.02] dark:hover:border-white/25"
    >
      <div className="relative aspect-[16/11] overflow-hidden rounded-2xl bg-slate-900">
        {imageSrc ? (
          <Image
            src={imageSrc}
            alt=""
            aria-hidden
            fill
            sizes="(max-width: 767px) calc(100vw - 88px), (max-width: 1023px) calc(50vw - 80px), 380px"
            className="object-cover transition-transform duration-500 group-hover:scale-105 motion-reduce:transition-none motion-reduce:group-hover:scale-100"
          />
        ) : (
          <div aria-hidden className="flex size-full items-center justify-center bg-slate-900 p-6">
            <span className="text-balance text-center font-display text-2xl font-medium italic leading-tight text-white">
              {title}
            </span>
          </div>
        )}
      </div>

      <div className="flex flex-1 flex-col px-2 pb-3 pt-4">
        <div className="flex items-center justify-between gap-3 font-mono text-[11px] uppercase tracking-widest text-text-secondary">
          <span className="shrink-0">{readingTime}</span>
          <time className="truncate text-right" dateTime={publishedAt} title={formattedDate}>
            {formattedDate}
          </time>
        </div>

        <AdaptiveCardCopy title={title} summary={summary} />

        <div className="mt-auto flex min-h-7 items-center justify-between gap-2.5 pt-4">
          <div className="flex min-h-7 min-w-0 items-center">
            <ReactionSummaryPill summary={reactionSummary} />
          </div>
          <span className="inline-flex shrink-0 items-center gap-2 font-mono text-[11px] uppercase tracking-widest text-text-secondary transition-colors group-hover:text-text-primary">
            Read article
            <DoubleArrow />
          </span>
        </div>
      </div>
    </Link>
  );
}
