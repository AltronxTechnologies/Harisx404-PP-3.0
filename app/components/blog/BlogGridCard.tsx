import Image from "next/image";
import Link from "next/link";
import { DoubleArrow } from "@/app/components/home/DoubleArrow";
import { getBlogImageSrc } from "@/app/components/blog/blogImage";

export interface BlogGridCardProps {
  slug: string;
  title: string;
  summary: string;
  readingTime: string;
  publishedAt: string;
  formattedDate: string;
  imageName?: string;
  index?: number;
}

export function BlogGridCard({
  slug,
  title,
  summary,
  readingTime,
  publishedAt,
  formattedDate,
  imageName,
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
        <h3 className="text-balance font-display text-[22px] font-medium leading-tight text-text-primary">
          {title}
        </h3>

        <p className="mt-3 line-clamp-3 text-[15px] leading-6 text-text-secondary">
          {summary}
        </p>

        <div className="mt-auto flex flex-wrap items-end justify-between gap-4 pt-6">
          <div className="font-mono text-[11px] uppercase tracking-widest text-text-secondary">
            <span>{readingTime}</span>
            <span className="mx-1.5" aria-hidden>·</span>
            <time dateTime={publishedAt}>{formattedDate}</time>
          </div>
          <div className="inline-flex items-center gap-2 font-mono text-[11px] uppercase tracking-widest text-text-secondary transition-colors group-hover:text-text-primary">
            Read article
            <DoubleArrow />
          </div>
        </div>
      </div>
    </Link>
  );
}
