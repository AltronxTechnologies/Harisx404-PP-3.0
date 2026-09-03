"use client";

import { motion, useReducedMotion } from "framer-motion";
import { useEffect, useRef, useState } from "react";
import { BentoCard } from "./BentoCard";

/*
 * Stats bento — a teaser for /stats (site-wide numbers: activity,
 * contributions, projects, write-ups and more). Rendered as a
 * contribution-style activity heatmap with fixed square cells —
 * the column count adapts to the card width, so cells stay crisp
 * squares on every screen size. Deterministic pattern (no hydration
 * mismatch), no invented numbers.
 */

const MAX_ROWS = 7; // a GitHub-style week column
const CELL = 11; // px, square
const GAP = 3; // px
const DEFAULT_COLS = 20;
const DEFAULT_ROWS = 5;
const MAX_COLS = 52; // a full year of weeks

// Deterministic but organic-looking intensity 0..4 per cell. A proper
// avalanche hash (fmix32-style) kills the visible banding a simple
// modulo pattern produces, and the distribution is weighted like a
// real active year: few empty days, a balanced neutral range, and enough
// high-activity cells for the emerald live accent to read clearly.
function intensityAt(i: number): number {
  let h = (i + 0x9e3779b9) | 0;
  h = Math.imul(h ^ (h >>> 16), 0x45d9f3b);
  h = Math.imul(h ^ (h >>> 13), 0x45d9f3b);
  h ^= h >>> 16;
  const v = (h >>> 0) % 100;
  if (v < 10) return 0;
  if (v < 28) return 1;
  if (v < 50) return 2;
  if (v < 70) return 3;
  return 4;
}

// Match the homepage activity chart: neutral history with emerald reserved
// for the strongest, "live" activity level.
const levelClasses = [
  "bg-neutral-200 group-hover:bg-neutral-300 group-active:bg-neutral-300 dark:bg-white/[0.06] dark:group-hover:bg-white/[0.12] dark:group-active:bg-white/[0.12]",
  "bg-neutral-300 group-hover:bg-neutral-400/70 group-active:bg-neutral-400/70 dark:bg-white/[0.12] dark:group-hover:bg-white/[0.20] dark:group-active:bg-white/[0.20]",
  "bg-neutral-400/70 group-hover:bg-neutral-500/75 group-active:bg-neutral-500/75 dark:bg-white/[0.20] dark:group-hover:bg-white/[0.30] dark:group-active:bg-white/[0.30]",
  "bg-neutral-500/75 group-hover:bg-neutral-600/80 group-active:bg-neutral-600/80 dark:bg-white/[0.30] dark:group-hover:bg-white/[0.42] dark:group-active:bg-white/[0.42]",
  "bg-emerald-500/55 group-hover:bg-emerald-500/90 group-active:bg-emerald-500/90 dark:bg-emerald-400/45 dark:group-hover:bg-emerald-400/80 dark:group-active:bg-emerald-400/80",
];

export function StatsBento({ height = "h-[220px]" }: { height?: string }) {
  const reduced = useReducedMotion();
  const [cols, setCols] = useState(DEFAULT_COLS);
  const [rows, setRows] = useState(DEFAULT_ROWS);
  const areaRef = useRef<HTMLDivElement | null>(null);

  /* Fit as many square columns/rows as the card allows (never more
     than a year of weeks wide or a week tall). Runs on mount + resize,
     so the grid always fills the space with zero clipped cells. */
  useEffect(() => {
    const el = areaRef.current;
    if (!el) return;
    const measure = () => {
      const fitCols = Math.floor((el.clientWidth + GAP) / (CELL + GAP));
      const fitRows = Math.floor((el.clientHeight + GAP) / (CELL + GAP));
      setCols(Math.max(4, Math.min(MAX_COLS, fitCols)));
      setRows(Math.max(3, Math.min(MAX_ROWS, fitRows)));
    };
    measure();
    const ro = new ResizeObserver(measure);
    ro.observe(el);
    return () => ro.disconnect();
  }, []);

  const cells = Array.from({ length: cols * rows }, (_, i) => intensityAt(i));

  return (
    <div>
      <BentoCard height={height} className="group" linkTo="/stats">
        {/* Header voice matches the homepage bento cards. */}
        <div className="relative z-20 text-center">
          <motion.h3
            className="text-base font-medium text-text-primary"
            initial={reduced ? false : { opacity: 0, y: -5 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4 }}
          >
            Stats
          </motion.h3>
          <motion.p
            className="mt-1 text-sm text-text-secondary md:text-base"
            initial={reduced ? false : { opacity: 0, y: -5 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4, delay: 0.1 }}
          >
            A peek behind the curtain — content, engagement, code &amp; speed.
          </motion.p>
        </div>

        {/* Activity heatmap: fixed square cells, centered in the free area */}
        <div
          ref={areaRef}
          aria-hidden="true"
          className="absolute inset-x-6 bottom-9 top-[6.5rem] flex items-center justify-center sm:top-[4.75rem]"
        >
          <div
            className="grid"
            style={{
              gridTemplateRows: `repeat(${rows}, ${CELL}px)`,
              gridTemplateColumns: `repeat(${cols}, ${CELL}px)`,
              gridAutoFlow: "column",
              gap: `${GAP}px`,
            }}
          >
            {cells.map((level, i) => (
              <motion.div
                key={`${cols}x${rows}-${i}`}
                className={
                  "rounded-[3px] ring-1 ring-inset ring-black/[0.04] transition-colors duration-500 ease-out motion-reduce:transition-none dark:ring-white/[0.04] " +
                  levelClasses[level]
                }
                initial={reduced ? false : { opacity: 0, scale: 0.6 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{
                  duration: 0.25,
                  delay: Math.floor(i / rows) * 0.015,
                  ease: "easeOut",
                }}
              />
            ))}
          </div>
        </div>

        {/* Footer: timeframe + legend */}
        <div className="absolute bottom-3 left-6 right-6 flex items-center justify-between sm:right-14">
          <span className="font-mono text-[10px] uppercase tracking-widest text-text-secondary">
            Last 12 months
          </span>
          <span className="flex items-center gap-1 font-mono text-[10px] uppercase tracking-widest text-text-secondary">
            less
            {[0, 1, 2, 3, 4].map((l) => (
              <span
                key={l}
                className={
                  "h-2 w-2 rounded-[2px] ring-1 ring-inset ring-black/[0.04] dark:ring-white/[0.04] " +
                  levelClasses[l]
                }
              />
            ))}
            more
          </span>
        </div>
      </BentoCard>
    </div>
  );
}
