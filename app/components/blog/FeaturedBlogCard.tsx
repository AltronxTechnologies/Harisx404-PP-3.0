import Link from "next/link";
import Image from "next/image";
import { optimizeImageUrl } from "@/app/lib/image-utils";

export interface FeaturedBlogCardProps {
  slug: string;
  title: string;
  summary: string;
  readingTime: string;
  formattedDate: string;
  imageName?: string;
  categories?: string[];
}

export function FeaturedBlogCard({
  slug,
  title,
  summary,
  readingTime,
  formattedDate,
  imageName,
  categories = [],
}: FeaturedBlogCardProps) {
  return (
    <Link
      href={`/blog/${slug}`}
      className="group relative flex flex-col rounded-3xl p-2.5 ring-1 ring-border-primary transition-all duration-300 hover:bg-neutral-50 md:flex-row dark:hover:bg-neutral-900/40"
    >
      {/* Left: Cover Image with In-Image Title Overlay */}
      <div className="relative aspect-video w-full shrink-0 overflow-hidden rounded-2xl bg-neutral-100 md:aspect-auto md:w-1/2 dark:bg-neutral-900">
        {imageName ? (
          <img
            src={optimizeImageUrl(imageName, 1200)}
            alt={title}
            className="size-full object-cover transition-transform duration-500 group-hover:scale-[1.03] motion-reduce:transition-none motion-reduce:group-hover:scale-100"
          />
        ) : (
          <div className="size-full bg-gradient-to-br from-violet-600/30 via-indigo-900/40 to-black/60" />
        )}
        {/* Dark overlay for text readability */}
        <div className="absolute inset-0 bg-black/30 dark:bg-black/40" />
        {/* In-cover title — reference: font-normal text-2xl md:text-3xl, NOT font-instrument-serif */}
        <div className="absolute inset-0 flex items-center justify-center p-8">
          <span className="text-balance text-center font-normal text-2xl text-white leading-snug tracking-tight [filter:drop-shadow(0_1px_2px_rgba(0,0,0,0.55))_drop-shadow(0_2px_10px_rgba(0,0,0,0.4))] md:text-3xl">
            {title}
          </span>
        </div>
      </div>

      {/* Right: Details Panel */}
      <div className="flex flex-1 flex-col justify-center px-5 py-4 md:px-8 md:py-6">
        {/* Featured badge */}
        <span className="mb-4 font-mono text-[11px] text-text-secondary uppercase tracking-wide">
          Featured
        </span>

        {/* Read Time & Date */}
        <div className="mb-4 font-mono text-text-secondary text-xs uppercase tracking-wide">
          <span>{readingTime}</span>
          <span className="mx-1.5">·</span>
          <time>{formattedDate}</time>
        </div>

        {/* Article Headline */}
        <h2 className="font-semibold text-2xl text-neutral-900 leading-tight transition-colors duration-300 group-hover:text-neutral-600 md:text-3xl dark:text-white dark:group-hover:text-neutral-300">
          {title}
        </h2>

        {/* Excerpt */}
        <p className="mt-4 line-clamp-3 text-text-secondary text-sm leading-relaxed md:text-base">
          {summary}
        </p>

        {/* Category Tags — reference: bg-neutral-50, not bg-neutral-100 */}
        {categories.length > 0 && (
          <div className="mt-6 flex flex-wrap gap-2">
            {categories.map((cat) => (
              <span
                key={cat}
                className="rounded-md bg-neutral-50 px-2 py-0.5 font-mono text-neutral-600 text-xs dark:bg-neutral-800/60 dark:text-neutral-400"
              >
                {cat}
              </span>
            ))}
          </div>
        )}

        {/* Sliding Dual-Arrow Action Pill — exact reference structure */}
        <div className="mt-8 flex items-center gap-2.5 self-end text-text-secondary text-sm tracking-wide transition-colors duration-300 group-hover:text-neutral-900 dark:group-hover:text-white">
          <span>Read article</span>
          <div className="size-[25px] overflow-hidden rounded-lg border border-neutral-300 border-dashed bg-[#f9f9fa80] transition-all duration-500 group-hover:bg-neutral-200 dark:border-white/10 dark:bg-white/5 dark:group-hover:bg-white/10">
            <div className="flex w-12 -translate-x-1/2 transition-transform duration-500 ease-in-out group-hover:translate-x-0 motion-reduce:transition-none">
              <span className="flex size-6">
                <svg
                  fill="none"
                  height="24"
                  viewBox="0 0 24 24"
                  width="24"
                  xmlns="http://www.w3.org/2000/svg"
                  className="m-auto size-3.5"
                >
                  <path
                    d="M18.5 12L4.99997 12"
                    stroke="currentColor"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth="1.5"
                  />
                  <path
                    d="M13 18C13 18 19 13.5811 19 12C19 10.4188 13 6 13 6"
                    stroke="currentColor"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth="1.5"
                  />
                </svg>
              </span>
              <span className="flex size-6">
                <svg
                  fill="none"
                  height="24"
                  viewBox="0 0 24 24"
                  width="24"
                  xmlns="http://www.w3.org/2000/svg"
                  className="m-auto size-3.5"
                >
                  <path
                    d="M18.5 12L4.99997 12"
                    stroke="currentColor"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth="1.5"
                  />
                  <path
                    d="M13 18C13 18 19 13.5811 19 12C19 10.4188 13 6 13 6"
                    stroke="currentColor"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth="1.5"
                  />
                </svg>
              </span>
            </div>
          </div>
        </div>
      </div>
    </Link>
  );
}
