"use client";

import { motion } from "framer-motion";
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
// real active year: few empty days, healthy mix of every shade.
function intensityAt(i: number): number {
  let h = (i + 0x9e3779b9) | 0;
  h = Math.imul(h ^ (h >>> 16), 0x45d9f3b);
  h = Math.imul(h ^ (h >>> 13), 0x45d9f3b);
  h ^= h >>> 16;
  const v = (h >>> 0) % 100;
  if (v < 12) return 0;
  if (v < 34) return 1;
  if (v < 60) return 2;
  if (v < 83) return 3;
  return 4;
}

// Light + dark classes per intensity level (emerald ramp, theme-tuned)
const levelClasses = [
  "bg-black/[0.05] dark:bg-white/[0.06]",
  "bg-emerald-200 dark:bg-emerald-900/70",
  "bg-emerald-300 dark:bg-emerald-700/80",
  "bg-emerald-400 dark:bg-emerald-500/90",
  "bg-emerald-500 dark:bg-emerald-400",
];

export function StatsBento({ height = "h-[220px]" }: { height?: string }) {
  const [isHovered, setIsHovered] = useState(false);
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
    <div
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      <BentoCard height={height} className="group" linkTo="/stats">
        {/* Header */}
        <motion.h2
          className="relative z-10 font-medium text-text-primary"
          initial={{ opacity: 0, y: -5 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4 }}
        >
          Stats
        </motion.h2>
        <motion.p
          className="relative z-10 mt-1 text-sm text-text-secondary"
          initial={{ opacity: 0, y: -5 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4, delay: 0.1 }}
        >
          A peek behind the curtain — content, engagement, code &amp; speed.
        </motion.p>

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
                  "rounded-[3px] ring-1 ring-inset ring-black/[0.04] transition-[filter] duration-300 dark:ring-white/[0.04] " +
                  levelClasses[level] +
                  (isHovered && level > 0
                    ? " brightness-110 saturate-[1.15]"
                    : "")
                }
                initial={{ opacity: 0, scale: 0.6 }}
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
        <div className="absolute inset-x-6 bottom-3 flex items-center justify-between">
          <span className="font-mono text-[9px] uppercase tracking-wider text-text-secondary/60">
            Last 12 months
          </span>
          <span className="flex items-center gap-1 font-mono text-[9px] uppercase tracking-wider text-text-secondary/60">
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
