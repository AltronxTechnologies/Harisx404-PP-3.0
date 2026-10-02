import React from "react";
import Image from "next/image";
import Link from "next/link";
import { ArrowUpRight } from "lucide-react";
import { optimizeImageUrl } from "@/app/lib/image-utils";
import { getBlogImageSrc } from "./blogImage";

interface RelatedPostCardProps {
  slug: string;
  title: string;
  summary: string;
  imageName?: string;
}

/** Related-post card for the article's curated recommendations. */
export function RelatedPostCard({ slug, title, summary, imageName }: RelatedPostCardProps) {
  const coverSrc = imageName
    ? getBlogImageSrc(optimizeImageUrl(
        imageName.startsWith("http") || imageName.startsWith("/") ? imageName : `/blog/${imageName}`,
        800,
      ))
    : null;

  return (
    <Link
      href={`/blog/${slug}`}
      className={`group flex h-full min-w-0 flex-col rounded-2xl border border-border-primary bg-white transition-colors hover:border-neutral-400/70 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-text-primary dark:bg-white/[0.02] dark:hover:border-white/25 ${coverSrc ? "p-2" : "min-h-[220px]"}`}
    >
      {coverSrc && (
        <div className="relative aspect-video w-full overflow-hidden rounded-xl bg-neutral-200 dark:bg-neutral-900">
          <Image
            src={coverSrc}
            alt=""
            fill
            sizes="(max-width: 768px) 100vw, (max-width: 1024px) 50vw, 33vw"
            className="object-cover"
          />
          <div aria-hidden="true" className="absolute inset-0 hidden bg-black/25 dark:block" />
        </div>
      )}

      <div className={`flex flex-1 flex-col gap-3 ${coverSrc ? "px-3 pb-3 pt-5 sm:px-4 sm:pb-4" : "p-5 sm:p-6"}`}>
        <h3 className="line-clamp-2 text-2xl font-medium leading-tight text-text-primary [font-family:var(--font-instrument-serif),serif]">
          {title}
        </h3>
        {summary && <p className="line-clamp-3 text-sm leading-relaxed text-text-secondary">{summary}</p>}

        <div className="mt-auto flex items-center justify-between gap-3 border-t border-border-primary pt-4 font-mono text-[11px] uppercase tracking-widest text-text-primary">
          <span>Read article</span>
          <ArrowUpRight aria-hidden="true" className="size-5 shrink-0" />
        </div>
      </div>
    </Link>
  );
}
