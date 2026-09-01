"use client";

import Link from "next/link";
import { motion, useReducedMotion } from "framer-motion";
import { SectionHeading } from "./SectionHeading";

const cardBase =
  "group relative flex h-full min-h-[260px] flex-col justify-between overflow-hidden rounded-3xl bg-white p-6 ring-1 ring-border-primary transition-all duration-300 card-light-edge hover:shadow-lg active:shadow-lg dark:bg-white/[0.03] hover:dark:bg-white/[0.05] active:dark:bg-white/[0.05] outline-none focus-visible:ring-2 focus-visible:ring-blue-500/40 dark:focus-visible:ring-white/25";

const gridVariants = {
  hidden: {},
  show: { transition: { staggerChildren: 0.05 } },
} as const;

const cardVariants = {
  hidden: { opacity: 0, y: 24 },
  show: { opacity: 1, y: 0, transition: { duration: 0.6, ease: "easeOut" } },
} as const;

// 5 notes on tablets (md), 6 on phones, 7 on large screens — the extra
// notes fill the roomier rows so no breakpoint looks sparse.
const noteTints = [
  { tint: "rotate-[-4deg] bg-amber-500/15", vis: "" },
  { tint: "rotate-[3deg] bg-pink-500/15", vis: "" },
  { tint: "rotate-[-2deg] bg-blue-500/15", vis: "" },
  { tint: "rotate-[5deg] bg-emerald-500/15", vis: "" },
  { tint: "rotate-[-6deg] bg-violet-500/15", vis: "" },
  { tint: "rotate-[4deg] bg-sky-500/15", vis: "md:hidden lg:inline-block" },
  { tint: "rotate-[-3deg] bg-rose-500/15", vis: "hidden lg:inline-block" },
];

/* ── Stats card visual: contribution heatmap ─────────────────────────
   GitHub-style activity grid, 5 rows × 16 weeks. Deterministic pattern
   (SSR-safe, no Math.random) that trends busier toward the right —
   "recent activity". Neutral token grays for levels 0–2; level 3 uses
   the site's emerald "live" accent (same hue as the LIVE badge and
   status pings). On hover a diagonal wave brightens every cell, each
   delayed by its row+column — decorative; real numbers live on /stats. */
const HEATMAP_COLS = 16;
// prettier-ignore
const heatmapLevels = [
  1, 0, 2, 1, 3, 0, 1, 2, 0, 1, 2, 0, 3, 1, 0, 2,
  0, 2, 1, 3, 0, 1, 2, 0, 1, 3, 0, 2, 1, 0, 2, 1,
  2, 0, 1, 0, 2, 3, 0, 1, 2, 0, 1, 2, 0, 3, 1, 0,
  0, 1, 3, 1, 0, 2, 1, 3, 0, 2, 0, 1, 2, 0, 2, 3,
];
const heatmapLevelClass = [
  "bg-neutral-200 group-hover:bg-neutral-300 group-active:bg-neutral-300 dark:bg-white/[0.06] dark:group-hover:bg-white/[0.12] dark:group-active:bg-white/[0.12]",
  "bg-neutral-300 group-hover:bg-neutral-400/70 group-active:bg-neutral-400/70 dark:bg-white/[0.14] dark:group-hover:bg-white/[0.24] dark:group-active:bg-white/[0.24]",
  "bg-neutral-400/80 group-hover:bg-neutral-500 group-active:bg-neutral-500 dark:bg-white/[0.28] dark:group-hover:bg-white/[0.45] dark:group-active:bg-white/[0.45]",
  "bg-emerald-500/45 group-hover:bg-emerald-500/85 group-active:bg-emerald-500/85 dark:bg-emerald-400/40 dark:group-hover:bg-emerald-400/75 dark:group-active:bg-emerald-400/75",
];

function StatsHeatmap() {
  return (
    <div className="flex h-28 items-center" aria-hidden>
      <div
        className="grid w-full gap-1"
        style={{ gridTemplateColumns: `repeat(${HEATMAP_COLS}, minmax(0, 1fr))` }}
      >
        {heatmapLevels.map((level, i) => {
          const row = Math.floor(i / HEATMAP_COLS);
          const col = i % HEATMAP_COLS;
          return (
            <span
              key={i}
              className={`aspect-square w-full rounded-[3px] transition-colors duration-500 ease-out motion-reduce:transition-none ${heatmapLevelClass[level]}`}
              style={{ transitionDelay: `${(row + col) * 25}ms` }}
            />
          );
        })}
      </div>
    </div>
  );
}

function Ambient() {
  return (
    <>
      <span
        aria-hidden
        className="pointer-events-none absolute inset-0 bg-gradient-to-br from-white/[0.02] to-transparent dark:from-white/[0.03]"
      />
      <span
        aria-hidden
        className="pointer-events-none absolute inset-0 z-10 rounded-[inherit] bg-gradient-to-br from-transparent via-transparent to-black/5 opacity-0 transition-opacity duration-300 ease-out group-hover:opacity-100 dark:to-white/5"
      />
    </>
  );
}

export function MySiteGrid() {
  const prefersReducedMotion = useReducedMotion();

  // Reduced motion: keep the variants MOUNTED but make them no-ops.
  // (Removing variants after hydration can strand cards at the already-
  // applied hidden state — opacity 0 — since framer won't reset them.)
  const noopVariants = {
    hidden: { opacity: 1, y: 0 },
    show: { opacity: 1, y: 0 },
  } as const;

  const cardMotion = {
    variants: prefersReducedMotion ? noopVariants : cardVariants,
    whileHover: prefersReducedMotion ? undefined : { y: -4 },
    whileFocus: prefersReducedMotion ? undefined : { y: -4 },
    whileTap: prefersReducedMotion ? undefined : { y: -4 },
    transition: {
      type: "spring",
      stiffness: 400,
      damping: 30,
      mass: 0.8,
    },
  } as const;

  return (
    <section className="px-2 sm:px-4">
      <SectionHeading kicker="Behind the site" animateWords>
        Built in the open,{" "}
        {/* Line break only where there's room for two clean lines —
            on small screens the text wraps naturally instead. */}
        <span className="animate-gradient-x text-colorfull px-1 pb-1 italic [text-shadow:none] md:block">
          explore &amp;&amp; say hello
        </span>
      </SectionHeading>

      <motion.div
        variants={gridVariants}
        initial="show"
        whileInView="show"
        viewport={{ once: true, margin: "-60px" }}
        className="mx-auto mt-14 grid w-full max-w-md grid-cols-1 gap-4 md:max-w-none md:grid-cols-3"
      >
        {/* Changelog */}
        <motion.div {...cardMotion}>
          <Link href="/buildlog" className={`${cardBase} hover:ring-neutral-400/70 active:ring-neutral-400/70 dark:hover:ring-white/25 dark:active:ring-white/25`}>
            <Ambient />
            {/* Mini release log — version chips + muted "entry" bars.
                h-28 keeps all three card visuals the same height so the
                text blocks align across the row. */}
            <div className="flex h-28 flex-col justify-center gap-2.5" aria-hidden>
              {[
                { v: "v2.1", w: "w-[55%]", hw: "motion-safe:group-hover:w-[80%] motion-safe:group-active:w-[80%]", d: "delay-0", live: true },
                { v: "v2.0", w: "w-[80%]", hw: "motion-safe:group-hover:w-[55%] motion-safe:group-active:w-[55%]", d: "delay-75", live: false },
                { v: "v1.4", w: "w-[40%]", hw: "motion-safe:group-hover:w-[65%] motion-safe:group-active:w-[65%]", d: "delay-150", live: false },
              ].map((row) => (
                <div key={row.v} className="flex items-center gap-2.5">
                  <span
                    className={`inline-flex items-center gap-1 rounded-full border border-border-primary px-2 py-0.5 font-mono text-[10px] ${
                      row.live
                        ? "text-text-primary"
                        : "text-text-tertiary"
                    }`}
                  >
                    {row.live && (
                      <span className="relative flex h-1.5 w-1.5">
                        <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-emerald-500 opacity-75 motion-reduce:animate-none" />
                        <span className="relative inline-flex h-1.5 w-1.5 rounded-full bg-emerald-500" />
                      </span>
                    )}
                    {row.v}
                  </span>
                  <span className="flex-1">
                    <span
                      className={`block h-1.5 rounded-full bg-border-primary transition-all duration-500 ease-out group-hover:bg-neutral-400/50 group-active:bg-neutral-400/50 dark:group-hover:bg-white/25 dark:group-active:bg-white/25 ${row.d} ${row.w} ${row.hw}`}
                    />
                  </span>
                </div>
              ))}
            </div>
            <div>
              <p className="font-mono text-xs uppercase tracking-widest text-text-secondary">
                BUILDLOG
              </p>
              <h3 className="mt-2 font-display text-xl font-medium leading-snug text-text-primary md:text-lg lg:text-2xl">
                Every release, from shipped to planned.
              </h3>
            </div>
          </Link>
        </motion.div>

        {/* Stats */}
        <motion.div {...cardMotion}>
          <Link href="/stats" className={`${cardBase} hover:ring-neutral-400/70 active:ring-neutral-400/70 dark:hover:ring-white/25 dark:active:ring-white/25`}>
            <Ambient />
            {/* Contribution heatmap — activity grid that brightens in a
                diagonal wave on hover. Decorative; numbers live on /stats. */}
            <StatsHeatmap />
            <div>
              <p className="font-mono text-xs uppercase tracking-widest text-text-secondary">
                STATS
              </p>
              <h3 className="mt-2 font-display text-xl font-medium leading-snug text-text-primary md:text-lg lg:text-2xl">
                Live metrics for views and write-ups.
              </h3>
            </div>
          </Link>
        </motion.div>

        {/* Community Wall */}
        <motion.div {...cardMotion}>
          <Link href="/community-wall" className={`${cardBase} hover:ring-neutral-400/70 active:ring-neutral-400/70 dark:hover:ring-white/25 dark:active:ring-white/25`}>
            <Ambient />
            <div className="flex h-28 flex-wrap content-center gap-3" aria-hidden>
              {noteTints.map(({ tint, vis }, i) => (
                <span
                  key={tint}
                  className={`h-12 w-14 rounded-md border border-border-primary transition-transform duration-500 ease-out motion-safe:group-hover:rotate-0 motion-safe:group-hover:scale-105 motion-safe:group-active:rotate-0 motion-safe:group-active:scale-105 md:h-9 md:w-10 lg:h-12 lg:w-14 ${
                    ["delay-0", "delay-75", "delay-100", "delay-150", "delay-200", "delay-200", "delay-300"][i]
                  } ${tint} ${vis}`}
                />
              ))}
            </div>
            <div>
              <p className="font-mono text-xs uppercase tracking-widest text-text-secondary">
                COMMUNITY WALL
              </p>
              <h3 className="mt-2 font-display text-xl font-medium leading-snug text-text-primary md:text-lg lg:text-2xl">
                Notes and hellos pinned by every visitor.
              </h3>
            </div>
          </Link>
        </motion.div>
      </motion.div>
    </section>
  );
}
