"use client";

/* LOCKED - owner-approved Home Blog section; see LOCKED_PERFECT.md entry 27. */

import Link from "next/link";
import Image from "next/image";
import { motion, useReducedMotion } from "framer-motion";
import { optimizeImageUrl } from "@/app/lib/image-utils";
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

  /* Edge case: with no companion posts the featured card owns the full
     row instead of leaving a dead 5-column gap beside it. */
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

      <div className="mt-14 grid grid-cols-1 gap-2 lg:grid-cols-10">
        {/* Featured — latest post, hero treatment with the inset cover */}
        <motion.div
          {...entrance}
          transition={{ duration: 0.6, ease: "easeOut" }}
          whileHover={hoverLift}
          className={hasCompanions ? "lg:col-span-6" : "lg:col-span-10"}
        >
          <Link
            href={featured.href ?? `/blog/${featured.slug}`}
            className={`group flex h-full flex-col rounded-3xl border border-border-primary bg-white p-3 transition-all hover:border-neutral-400/70 hover:shadow-lg dark:hover:border-white/25 dark:bg-white/[0.02] ${
              hasCompanions ? "xl:aspect-[16/10.835]" : ""
            }`}
          >
            {/* Inset cover — rounded on its own, floating inside the card.
                Real covers stay clean; only gradient placeholders carry the
                title overlay (the heading below already names the post). */}
            <div
              className={`relative overflow-hidden rounded-2xl ${
                hasCompanions
                  ? "aspect-[16/10.95] md:aspect-[16/10.835] lg:aspect-auto lg:flex-1"
                  : "aspect-[16/9] lg:aspect-[16/6]"
              }`}
            >
              {featured.imageName ? (
                <Image
                  src={optimizeImageUrl(featured.imageName, 1200)}
                  alt=""
                  fill
                  sizes={
                    hasCompanions ? "(max-width: 1024px) 100vw, 60vw" : "100vw"
                  }
                  className="object-cover transition-transform duration-500 ease-out group-hover:scale-105 motion-reduce:transition-none motion-reduce:group-hover:scale-100"
                />
              ) : (
                <>
                  <div
                    className={`h-full w-full bg-gradient-to-br transition-transform duration-500 ease-out group-hover:scale-105 motion-reduce:transition-none motion-reduce:group-hover:scale-100 ${covers[0]}`}
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

            <div className="flex flex-1 flex-col px-2 pb-2 pt-5 sm:px-3 lg:flex-none">
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
              <h3 className="mt-3 line-clamp-2 break-words font-display text-2xl font-medium leading-tight text-text-primary">
                {featured.title}
              </h3>
              <p className="mt-2 line-clamp-2 break-words text-[15px] leading-relaxed text-text-secondary">
                {featured.summary}
              </p>
              <div className="mt-auto flex min-h-7 items-center justify-between gap-2.5 pt-4">
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
          <div className="grid grid-cols-1 gap-2 lg:col-span-4 lg:grid-rows-2">
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
                    {/* Inset thumb — stretches the full card height so it sits
                        flush with the card padding on top, bottom, and left,
                        mirroring the featured card's inset cover. */}
                    <div className="relative aspect-[16/10.95] w-full shrink-0 self-stretch overflow-hidden rounded-2xl md:aspect-auto md:w-[200px] lg:w-[152px]">
                      {post.imageName ? (
                        <>
                          <Image
                            src={optimizeImageUrl(post.imageName, 400)}
                            alt=""
                            fill
                            sizes="140px"
                            className="object-cover transition-transform duration-500 ease-out group-hover:scale-105 motion-reduce:transition-none motion-reduce:group-hover:scale-100"
                          />
                          {/* Subtle inset ring + scrim so tall crops read as a
                              deliberate cover panel rather than a raw photo. */}
                          <div
                            aria-hidden
                            className="absolute inset-0 rounded-2xl bg-gradient-to-t from-black/25 via-transparent to-black/10 ring-1 ring-inset ring-white/10"
                          />
                        </>
                      ) : (
                        <div
                          className={`h-full w-full bg-gradient-to-br transition-transform duration-500 ease-out group-hover:scale-105 motion-reduce:transition-none motion-reduce:group-hover:scale-100 ${covers[(i + 1) % covers.length]}`}
                        />
                      )}
                      <span className="absolute left-2.5 top-2.5 rounded-full border border-white/30 bg-black/70 px-2.5 py-1 font-mono text-[9px] uppercase tracking-widest text-white backdrop-blur-sm sm:left-3 sm:top-3 sm:px-3 sm:text-[10px]">
                        {post.badge || "Latest"}
                      </span>
                    </div>
                    <div className="flex min-w-0 flex-1 flex-col px-2 pb-2 pt-5 sm:px-3 md:justify-center md:px-0 md:py-1 md:pr-2">
                      <div className="flex items-center justify-between gap-3 font-mono text-[11px] uppercase tracking-widest text-text-secondary md:text-xs">
                        <span className="shrink-0">{post.readingTime}</span>
                        <time
                          className="truncate text-right"
                          dateTime={post.publishedAt}
                          title={formatShortDate(post.publishedAt)}
                        >
                          {formatShortDate(post.publishedAt)}
                        </time>
                      </div>
                      <h3 className="mt-3 line-clamp-2 break-words font-display text-2xl font-medium leading-tight text-text-primary md:text-[22px]">
                        {post.title}
                      </h3>
                      <p className="mt-2 line-clamp-2 break-words text-[15px] leading-relaxed text-text-secondary">
                        {post.summary}
                      </p>
                      <div className="mt-auto flex min-h-7 flex-wrap items-center justify-between gap-2.5 pt-4">
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
