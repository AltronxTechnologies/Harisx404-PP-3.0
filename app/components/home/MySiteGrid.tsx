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
        <span className="text-gradient-animated font-display italic md:block">
          explore &amp;&amp; say hello
        </span>
      </SectionHeading>

      <motion.div
        variants={gridVariants}
        initial="hidden"
        whileInView="show"
        viewport={{ once: true, margin: "-60px" }}
        className="mx-auto mt-14 grid w-full max-w-md grid-cols-1 gap-4 md:max-w-none md:grid-cols-3"
      >
        {/* Changelog */}
        <motion.div {...cardMotion}>
          <Link href="/buildlog" className={`${cardBase} hover:ring-text-tertiary/60 active:ring-text-tertiary/60`}>
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
                      className={`block h-1.5 rounded-full bg-border-primary transition-all duration-500 ease-out group-hover:bg-text-tertiary/50 group-active:bg-text-tertiary/50 ${row.d} ${row.w} ${row.hw}`}
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
          <Link href="/stats" className={`${cardBase} hover:ring-text-tertiary/60 active:ring-text-tertiary/60`}>
            <Ambient />
            {/* Analytics sparkline — gradient line + soft area fill; the
                line redraws itself on hover. Decorative; numbers live
                on /stats. */}
            <div className="flex h-28 items-center" aria-hidden>
              <div className="relative w-full">
              <svg viewBox="0 0 220 72" fill="none" preserveAspectRatio="none" className="h-[88px] w-full">
                <defs>
                  <linearGradient id="msg-spark-stroke" x1="0" y1="0" x2="1" y2="0">
                    <stop offset="0%" stopColor="#3b82f6" />
                    <stop offset="50%" stopColor="#8b5cf6" />
                    <stop offset="100%" stopColor="#ec4899" />
                  </linearGradient>
                  <linearGradient id="msg-spark-fill" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="#8b5cf6" stopOpacity="0.22" />
                    <stop offset="100%" stopColor="#8b5cf6" stopOpacity="0" />
                  </linearGradient>
                </defs>
                {/* faint baseline grid */}
                <line x1="2" y1="66" x2="218" y2="66" vectorEffect="non-scaling-stroke" className="stroke-border-primary" strokeWidth="1" strokeDasharray="3 4" />
                {/* area fill */}
                <path
                  d="M2,54 C30,50 40,28 62,32 C84,36 92,14 116,20 C140,26 150,40 168,30 C186,20 202,12 216,9 L216,66 L2,66 Z"
                  fill="url(#msg-spark-fill)"
                  className="opacity-30 transition-opacity duration-500 group-hover:opacity-90 group-active:opacity-90"
                />
                {/* line — redraws on hover */}
                <path
                  d="M2,54 C30,50 40,28 62,32 C84,36 92,14 116,20 C140,26 150,40 168,30 C186,20 202,12 216,9"
                  stroke="url(#msg-spark-stroke)"
                  strokeWidth="2.5"
                  strokeLinecap="round"
                  pathLength={1}
                  className="opacity-45 transition-opacity duration-500 group-hover:opacity-100 group-active:opacity-100 [stroke-dasharray:1] [stroke-dashoffset:0] motion-safe:group-hover:animate-[sparkline-draw_1.1s_ease-out] motion-safe:group-active:animate-[sparkline-draw_1.1s_ease-out]"
                />
                {/* endpoint dot with pulse halo */}
                <circle
                  cx="216"
                  cy="9"
                  r="3.5"
                  fill="#ec4899"
                  className="animate-ping opacity-25 transition-opacity duration-500 group-hover:opacity-60 group-active:opacity-60 motion-reduce:animate-none"
                  style={{ transformBox: "fill-box", transformOrigin: "center" }}
                />
                <circle cx="216" cy="9" r="3.5" fill="#ec4899" className="opacity-50 transition-opacity duration-500 group-hover:opacity-100 group-active:opacity-100" />
              </svg>
              </div>
            </div>
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
          <Link href="/community-wall" className={`${cardBase} hover:ring-text-tertiary/60 active:ring-text-tertiary/60`}>
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
