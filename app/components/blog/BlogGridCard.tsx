import Link from "next/link";
import Image from "next/image";
import { optimizeImageUrl } from "@/app/lib/image-utils";

export interface BlogGridCardProps {
  slug: string;
  title: string;
  summary: string;
  readingTime: string;
  formattedDate: string;
  imageName?: string;
  index?: number;
}

const gradientCovers = [
  "from-violet-600/30 via-purple-900/40 to-slate-900/60",
  "from-blue-600/30 via-indigo-900/40 to-slate-900/60",
  "from-emerald-600/30 via-teal-900/40 to-slate-900/60",
  "from-pink-600/30 via-rose-900/40 to-slate-900/60",
  "from-amber-600/30 via-orange-900/40 to-slate-900/60",
  "from-cyan-600/30 via-sky-900/40 to-slate-900/60",
];

export function BlogGridCard({
  slug,
  title,
  summary,
  readingTime,
  formattedDate,
  imageName,
  index = 0,
}: BlogGridCardProps) {
  return (
    <Link
      href={`/blog/${slug}`}
      className="group flex h-full flex-col rounded-3xl p-2.5 ring-1 ring-border-primary transition-all duration-300 hover:bg-neutral-50 dark:hover:bg-neutral-900/40"
    >
      {/* Cover Image / Gradient with Centered Title */}
      <div className="relative aspect-[16/11] overflow-hidden rounded-2xl bg-neutral-100 dark:bg-neutral-900">
        {imageName ? (
          <img
            src={optimizeImageUrl(imageName, 800)}
            alt={title}
            loading="lazy"
            decoding="async"
            className="size-full object-cover transition-transform duration-500 group-hover:scale-105 motion-reduce:transition-none motion-reduce:group-hover:scale-100"
          />
        ) : (
          <div
            className={`size-full bg-gradient-to-br transition-transform duration-500 group-hover:scale-105 ${
              gradientCovers[index % gradientCovers.length]
            }`}
          />
        )}
        {/* Dark overlay */}
        <div className="absolute inset-0 bg-black/30 dark:bg-black/40" />
        {/* In-cover title — reference: font-normal text-xl, NO font-instrument-serif */}
        <div className="absolute inset-0 flex items-center justify-center p-6">
          <span className="text-balance text-center font-normal text-white text-xl leading-snug tracking-tight drop-shadow-[0_1px_2px_rgba(0,0,0,0.55)]">
            {title}
          </span>
        </div>
      </div>

      {/* Card Content */}
      <div className="flex flex-1 flex-col px-2 pt-4 pb-3">
        <h3 className="font-semibold text-lg text-neutral-900 leading-snug transition-colors duration-300 group-hover:text-neutral-600 dark:text-white dark:group-hover:text-neutral-300">
          {title}
        </h3>

        <p className="mt-2 line-clamp-3 text-text-secondary text-sm leading-relaxed">
          {summary}
        </p>

        {/* Footer Row */}
        <div className="mt-auto flex items-center justify-between gap-3 pt-4">
          {/* Read time & date — exact reference classes */}
          <div className="font-mono text-[11px] text-text-secondary uppercase tracking-wide">
            <span>{readingTime}</span>
            <span className="mx-1.5">·</span>
            <time>{formattedDate}</time>
          </div>

          {/* Dual-arrow action pill — exact reference structure */}
          <div className="flex shrink-0 items-center gap-2 text-text-secondary text-xs tracking-wide transition-colors duration-300 group-hover:text-neutral-900 dark:group-hover:text-white">
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
                    className="m-auto size-[14px]"
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
                    className="m-auto size-[14px]"
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
      </div>
    </Link>
  );
}
