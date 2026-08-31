"use client";

import Link from "next/link";
import Image from "next/image";
import { motion, useReducedMotion } from "framer-motion";
import { optimizeImageUrl } from "@/app/lib/image-utils";
import type { HomePost } from "@/app/data/fallback-home";
import { SectionHeading } from "./SectionHeading";
import { DoubleArrow } from "./DoubleArrow";

export type WritingPost = HomePost & { imageName?: string };

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

/* Shared CTA — mono uppercase with a sliding arrow, matching the
   "View case study" CTA in the Case Studies section. `compact` shortens
   the label to "Read" on phones where horizontal space is tight. */
function ReadCta({ compact = false }: { compact?: boolean }) {
  return (
    <span className="inline-flex shrink-0 items-center gap-2 font-mono text-xs uppercase tracking-widest text-text-secondary transition-colors group-hover:text-text-primary">
      {compact ? (
        <>
          <span className="sm:hidden">Read</span>
          <span className="hidden sm:inline">Read article</span>
        </>
      ) : (
        "Read article"
      )}
      <span
        aria-hidden
        className="inline-block transition-transform duration-300 group-hover:translate-x-1"
      >
        →
      </span>
    </span>
  );
}

function Meta({ text }: { text: string }) {
  return (
    <span className="font-mono text-xs uppercase tracking-widest text-text-tertiary">
      {text}
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
            write-ups
          </span>
        </SectionHeading>
      </motion.div>

      <div className="mt-16 grid grid-cols-1 gap-2 lg:grid-cols-10">
        {/* Featured — latest post, hero treatment with the inset cover */}
        <motion.div
          {...entrance}
          transition={{ duration: 0.6, ease: "easeOut" }}
          whileHover={hoverLift}
          className={hasCompanions ? "lg:col-span-6" : "lg:col-span-10"}
        >
          <Link
            href={`/blog/${featured.slug}`}
            className={`group flex h-full flex-col rounded-3xl border border-border-primary bg-white p-3 transition-all hover:border-text-tertiary/60 hover:shadow-lg dark:bg-white/[0.02] ${
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
                  className="object-cover transition-transform duration-500 ease-out group-hover:scale-105"
                />
              ) : (
                <>
                  <div
                    className={`h-full w-full bg-gradient-to-br transition-transform duration-500 ease-out group-hover:scale-105 ${covers[0]}`}
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
              <span className="absolute left-3 top-3 rounded-full border border-white/25 bg-black/45 px-3 py-1 font-mono text-[10px] uppercase tracking-widest text-white/90 backdrop-blur-sm">
                Latest
              </span>
            </div>

            <div className="flex flex-1 flex-col px-2 pb-2 pt-5 sm:px-3 lg:flex-none">
              <h3 className="line-clamp-2 break-words font-display text-2xl font-medium leading-tight text-text-primary">
                {featured.title}
              </h3>
              <p className="mt-2.5 line-clamp-2 break-words text-sm leading-relaxed text-text-secondary">
                {featured.summary}
              </p>
              <div className="mt-auto flex items-center justify-between gap-3 pt-6">
                <Meta
                  text={`${featured.readingTime} · ${formatShortDate(featured.publishedAt)}`}
                />
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
                  href={`/blog/${post.slug}`}
                  className="group flex h-full flex-col rounded-3xl border border-border-primary bg-white p-3 transition-all hover:border-text-tertiary/60 hover:shadow-lg dark:bg-white/[0.02]"
                >
                  <div className="flex h-full items-stretch gap-4">
                    {/* Inset thumb — stretches the full card height so it sits
                        flush with the card padding on top, bottom, and left,
                        mirroring the featured card's inset cover. */}
                    <div className="relative w-[112px] shrink-0 self-stretch overflow-hidden rounded-2xl sm:w-[128px] md:w-[140px] lg:w-[152px]">
                      {post.imageName ? (
                        <>
                          <Image
                            src={optimizeImageUrl(post.imageName, 400)}
                            alt=""
                            fill
                            sizes="140px"
                            className="object-cover transition-transform duration-500 ease-out group-hover:scale-105"
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
                          className={`h-full w-full bg-gradient-to-br transition-transform duration-500 ease-out group-hover:scale-105 ${covers[(i + 1) % covers.length]}`}
                        />
                      )}
                    </div>
                    <div className="flex min-w-0 flex-1 flex-col justify-center py-1 pr-1 sm:pr-2">
                      <h3 className="line-clamp-2 break-words font-display text-lg font-medium leading-tight text-text-primary sm:text-xl lg:text-[22px]">
                        {post.title}
                      </h3>
                      <p className="mt-1.5 line-clamp-2 break-words text-sm leading-relaxed text-text-secondary lg:line-clamp-4">
                        {post.summary}
                      </p>
                      <div className="mt-3 flex flex-wrap items-center justify-between gap-x-3 gap-y-1">
                        <span className="font-mono text-xs uppercase tracking-widest text-text-tertiary">
                          {post.readingTime}
                          <span className="hidden md:inline lg:hidden">
                            {" "}
                            · {formatShortDate(post.publishedAt)}
                          </span>
                        </span>
                        <ReadCta compact />
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
          <span className="inline-flex size-8 items-center justify-center rounded-full border border-border-primary">
            <DoubleArrow />
          </span>
        </Link>
      </div>
    </section>
  );
}
