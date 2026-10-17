"use client";

/* LOCKED - owner-approved Home Blog section; see LOCKED_PERFECT.md entry 27. */

import Link from "next/link";
import Image from "next/image";
import { useState } from "react";
import { motion, useReducedMotion } from "framer-motion";
import { isOriginalBlogWebp, optimizeImageUrl } from "@/app/lib/image-utils";
import type { HomePost } from "@/app/data/fallback-home";
import type { ReactionSummary } from "@/app/blog/data";
import { ArticleCardArrow } from "@/app/components/blog/ArticleCardArrow";
import { ReactionSummaryPill } from "@/app/components/blog/ReactionSummaryPill";
import { SectionHeading } from "./SectionHeading";
import { DoubleArrow } from "./DoubleArrow";

export type WritingPost = HomePost & {
  imageName?: string;
  badge?: "Featured" | "Latest";
  reactionSummary?: ReactionSummary;
};

/* Gradient placeholder covers for posts without an image — same palette
   family as the BlogCard component so /blog and the homepage stay in sync. */
const covers = [
  "from-violet-500/30 to-indigo-900/40",
  "from-blue-500/30 to-sky-900/40",
  "from-pink-500/30 to-rose-900/40",
];

/* Short editorial date ("Jan 1, 2026") — the full formatDate() string with
   its "(7mo ago)" suffix truncates inside the compact meta rows. UTC keeps
   server and client renders identical (no hydration mismatch). */
const shortDate = new Intl.DateTimeFormat("en-US", {
  month: "short",
  day: "numeric",
  year: "numeric",
  timeZone: "UTC",
});

function formatShortDate(iso: string): string {
  const d = new Date(iso);
  return Number.isNaN(d.getTime()) ? "" : shortDate.format(d);
}

/* Same action treatment as the locked Blog cards. */
function ReadCta() {
  return (
    <span className="inline-flex shrink-0 items-center gap-2 font-mono text-[11px] uppercase leading-none tracking-widest text-text-secondary transition-colors group-hover:text-text-primary">
      Read article
      <ArticleCardArrow />
    </span>
  );
}

export function Writings({
  posts,
}: {
  posts: WritingPost[];
  /** Accepted for API compatibility; dates are formatted locally (short form). */
  formattedDates?: string[];
}) {
  const reduced = useReducedMotion();
  const [failedImages, setFailedImages] = useState<string[]>([]);
  const markFailed = (url: string) => setFailedImages((current) => current.includes(url) ? current : [...current, url]);
  const [featured, ...rest] = posts;
  if (!featured) return null;

  /* Motion presets — collapse to static rendering for reduced-motion users
     (the hero and bento sections follow the same convention). */
  const entrance = reduced
    ? {}
    : {
        initial: false,
        whileInView: { opacity: 1, y: 0 },
        viewport: { once: true, margin: "-60px" },
      };
  const hoverLift = reduced
    ? undefined
    : {
        y: -4,
        transition: {
          type: "spring" as const,
          stiffness: 400,
          damping: 30,
          mass: 0.8,
        },
      };

  /* Edge case: with no companion posts the featured card owns the full row. */
  const hasCompanions = rest.length > 0;

  return (
    <section className="px-2 sm:px-4">
      <motion.div
        initial={false}
        whileInView={reduced ? undefined : { opacity: 1, y: 0 }}
        viewport={{ once: true, margin: "-80px" }}
        transition={{ duration: 0.6 }}
      >
        <SectionHeading kicker="The Blog">
          Latest{" "}
          <span className="animate-gradient-x text-colorfull px-1 pb-1 italic [text-shadow:none]">
            write-ups.
          </span>
        </SectionHeading>
      </motion.div>

      <div className={`mt-14 grid grid-cols-1 gap-2 ${hasCompanions ? "lg:grid-cols-2" : ""}`}>
        {/* Featured — latest post, hero treatment with the inset cover */}
        <motion.div
          {...entrance}
          transition={{ duration: 0.6, ease: "easeOut" }}
          whileHover={hoverLift}
        >
          <Link
            href={featured.href ?? `/blog/${featured.slug}`}
            className="group flex h-full flex-col rounded-3xl border border-border-primary bg-white p-3 transition-all hover:border-neutral-400/70 hover:shadow-lg dark:hover:border-white/25 dark:bg-white/[0.02]"
          >
            {/* Inset cover — rounded on its own, floating inside the card.
                Real covers stay clean; only gradient placeholders carry the
                title overlay (the heading below already names the post). */}
            <div
              className="relative aspect-video w-full shrink-0 overflow-hidden rounded-2xl"
            >
              {featured.imageName && !failedImages.includes(featured.imageName) ? (
                <Image
                  src={optimizeImageUrl(featured.imageName, 1200)}
                   unoptimized={isOriginalBlogWebp(featured.imageName)}
                  alt=""
                  fill
                  onError={() => markFailed(featured.imageName!)}
                  sizes={
                      hasCompanions ? "(max-width: 1023px) 100vw, 50vw" : "100vw"
                  }
                   className="object-cover transition-transform duration-500 ease-out motion-safe:[@media(hover:hover)]:group-hover:scale-[1.03] motion-reduce:transition-none"
                />
              ) : (
                <>
                  <div
                     className={`h-full w-full bg-gradient-to-br transition-transform duration-500 ease-out motion-safe:[@media(hover:hover)]:group-hover:scale-[1.03] motion-reduce:transition-none ${covers[0]}`}
                  />
                  <span
                    aria-hidden
                    className="absolute inset-0 flex items-center justify-center px-6"
                  >
                    <span className="line-clamp-3 break-words text-center font-display text-xl italic leading-snug text-white/90 [text-shadow:0_1px_12px_rgba(0,0,0,0.45)] sm:text-2xl">
                      {featured.title}
                    </span>
                  </span>
                </>
              )}
               <span className="absolute left-3 top-3 rounded-full border border-white/30 bg-black/70 px-3 py-1 font-mono text-[10px] uppercase tracking-widest text-white backdrop-blur-sm">
                 {featured.badge || "Featured"}
               </span>
             </div>

            <div className="flex flex-1 flex-col px-2 pb-2 pt-5 sm:px-3 lg:flex-none lg:pt-4">
              <div className="flex items-center justify-between gap-3 font-mono text-[11px] uppercase tracking-widest text-text-secondary md:text-xs">
                <span className="shrink-0">{featured.readingTime}</span>
                <time
                  className="truncate text-right"
                  dateTime={featured.publishedAt}
                  title={formatShortDate(featured.publishedAt)}
                >
                  {formatShortDate(featured.publishedAt)}
                </time>
              </div>
              <h3 className={`mt-3 line-clamp-2 break-words font-display text-2xl font-medium leading-tight text-text-primary ${hasCompanions ? "lg:text-[22px] lg:tracking-[-0.01em]" : ""}`}>
                {featured.title}
              </h3>
              <p className="mt-2 line-clamp-2 break-words text-[15px] leading-relaxed text-text-secondary">
                {featured.summary}
              </p>
              <div className="mt-auto flex min-h-7 items-center justify-between gap-2.5 pt-4 lg:pt-2">
                <div className="flex min-h-7 min-w-0 items-center">
                  <ReactionSummaryPill summary={featured.reactionSummary} />
                </div>
                <ReadCta />
              </div>
            </div>
          </Link>
        </motion.div>

        {/* Companion posts — same inset-cover card language, compact rows */}
        {hasCompanions && (
           <div className="grid grid-cols-1 gap-2 lg:grid-rows-2">
            {rest.map((post, i) => (
              <motion.div
                key={post.slug}
                {...entrance}
                transition={{
                  duration: 0.6,
                  ease: "easeOut",
                  delay: reduced ? 0 : (i + 1) * 0.08,
                }}
                whileHover={hoverLift}
                className="h-full"
              >
                <Link
                  href={post.href ?? `/blog/${post.slug}`}
                  className="group flex h-full flex-col rounded-3xl border border-border-primary bg-white p-3 transition-all hover:border-neutral-400/70 hover:shadow-lg dark:hover:border-white/25 dark:bg-white/[0.02]"
                >
                  <div className="flex h-full flex-col items-stretch gap-0 md:flex-row md:gap-4">
                     {/* Keep the landscape thumb centered beside the copy on wider cards. */}
                      <div className="relative aspect-video w-full shrink-0 overflow-hidden rounded-2xl md:w-[220px] md:self-center lg:w-[41%]">
                      {post.imageName && !failedImages.includes(post.imageName) ? (
                        <>
                           <Image
                             src={optimizeImageUrl(post.imageName, 400)}
                              unoptimized={isOriginalBlogWebp(post.imageName)}
                             alt=""
                             fill
                             onError={() => markFailed(post.imageName!)}
                              sizes="(max-width: 767px) 100vw, (max-width: 1023px) 220px, 230px"
                             className="object-cover transition-transform duration-500 ease-out motion-safe:[@media(hover:hover)]:group-hover:scale-[1.03] motion-reduce:transition-none"
                          />
                           {/* Subtle inset ring + scrim keeps landscape thumbnails legible. */}
                          <div
                            aria-hidden
                            className="absolute inset-0 rounded-2xl bg-gradient-to-t from-black/25 via-transparent to-black/10 ring-1 ring-inset ring-white/10"
                          />
                        </>
                      ) : (
                        <div
                           className={`h-full w-full bg-gradient-to-br transition-transform duration-500 ease-out motion-safe:[@media(hover:hover)]:group-hover:scale-[1.03] motion-reduce:transition-none ${covers[(i + 1) % covers.length]}`}
                        />
                      )}
                      <span className="absolute left-2.5 top-2.5 rounded-full border border-white/30 bg-black/70 px-2.5 py-1 font-mono text-[9px] uppercase tracking-widest text-white backdrop-blur-sm sm:left-3 sm:top-3 sm:px-3 sm:text-[10px]">
                        {post.badge || "Latest"}
                      </span>
                    </div>
                    <div className="flex min-w-0 flex-1 flex-col px-2 pb-2 pt-5 sm:px-3 md:justify-center md:px-0 md:py-1 md:pr-2">
                      <h3 className="mt-3 line-clamp-2 break-words font-display text-2xl font-medium leading-tight text-text-primary md:text-[22px]">
                        {post.title}
                      </h3>
                      <p className="mt-2 line-clamp-2 break-words text-[15px] leading-relaxed text-text-secondary">
                        {post.summary}
                      </p>
                      <div className="mt-auto flex min-h-7 flex-wrap items-center justify-between gap-2.5 pt-4 md:mt-4">
                        <div className="flex min-h-7 min-w-0 items-center">
                          <ReactionSummaryPill summary={post.reactionSummary} />
                        </div>
                        <ReadCta />
                      </div>
                    </div>
                  </div>
                </Link>
              </motion.div>
            ))}
          </div>
        )}
      </div>

      <div className="mt-16 flex justify-center">
        <Link
          href="/blog"
          className="group inline-flex items-center gap-3 font-mono text-xs font-normal uppercase tracking-widest text-text-secondary transition-colors hover:text-text-primary"
        >
          Read more posts
          <span className="inline-flex size-8 items-center justify-center rounded-full border border-border-primary transition-colors group-hover:border-neutral-400/70 group-active:border-neutral-400/70 dark:group-hover:border-white/25 dark:group-active:border-white/25">
            <DoubleArrow />
          </span>
        </Link>
      </div>
    </section>
  );
}
