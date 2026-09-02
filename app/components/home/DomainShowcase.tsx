"use client";

import { useRef, useState } from "react";
import { AnimatePresence, motion, useReducedMotion } from "framer-motion";

/* ============================================================
   Domain showcase — an abstract animated illustration that
   morphs with the headline's current domain:
   fullstack -> floating code brackets, cyber -> radar sweep,
   ai -> neural network. Purely decorative (aria-hidden),
   crossfades on domain change, pauses on hover / reduced motion.
   ============================================================ */

type SceneProps = { still: boolean; reverse?: boolean };

const float = (still: boolean, dy = 6, duration = 3.2, delay = 0) =>
  still
    ? {}
    : {
        animate: { y: [0, -dy, 0] },
        transition: { duration, delay, repeat: Infinity, ease: "easeInOut" },
      };

/* ---------- Fullstack: drifting code brackets ---------- */
function FullstackVisual({ still }: SceneProps) {
  return (
    <div className="relative flex h-full w-full items-center justify-center font-mono">
      <motion.span
        initial={{ x: -16, opacity: 0 }}
        animate={still ? { x: 0, opacity: 1 } : { x: 0, opacity: 1, y: [0, -7, 0] }}
        transition={{
          x: { duration: 0.45, ease: "easeOut" },
          opacity: { duration: 0.45 },
          y: { duration: 3.4, repeat: Infinity, ease: "easeInOut", delay: 0.45 },
        }}
        className="text-[3.4rem] font-bold text-teal-600 dark:text-teal-300 lg:text-[3.9rem]"
      >
        {"<"}
      </motion.span>
      <motion.span
        initial={{ scale: 0.6, opacity: 0 }}
        animate={still ? { scale: 1, opacity: 1 } : { scale: 1, opacity: 1, rotate: [8, -8, 8] }}
        transition={{
          scale: { duration: 0.45, delay: 0.15, ease: "easeOut" },
          opacity: { duration: 0.45, delay: 0.15 },
          rotate: { duration: 4.2, repeat: Infinity, ease: "easeInOut" },
        }}
        className="mx-1 text-[2.8rem] font-bold text-emerald-600/80 dark:text-emerald-400/80 lg:text-[3.2rem]"
      >
        /
      </motion.span>
      <motion.span
        initial={{ x: 16, opacity: 0 }}
        animate={still ? { x: 0, opacity: 1 } : { x: 0, opacity: 1, y: [0, -7, 0] }}
        transition={{
          x: { duration: 0.45, ease: "easeOut" },
          opacity: { duration: 0.45 },
          y: { duration: 3.4, repeat: Infinity, ease: "easeInOut", delay: 0.95 },
        }}
        className="text-[3.4rem] font-bold text-teal-600 dark:text-teal-300 lg:text-[3.9rem]"
      >
        {">"}
      </motion.span>
      {/* orbiting specks */}
      {[
        { top: "16%", left: "22%", delay: 0 },
        { top: "70%", left: "16%", delay: 0.8 },
        { top: "24%", left: "78%", delay: 1.4 },
        { top: "76%", left: "80%", delay: 0.4 },
      ].map((p, i) => (
        <motion.span
          key={i}
          animate={still ? undefined : { opacity: [0.2, 1, 0.2], scale: [0.8, 1.15, 0.8] }}
          transition={{ duration: 2.6, delay: p.delay, repeat: Infinity, ease: "easeInOut" }}
          style={{ top: p.top, left: p.left }}
          className="absolute size-1.5 rounded-full bg-teal-500/70 dark:bg-teal-300/70"
        />
      ))}
    </div>
  );
}

/* ---------- Cyber: radar sweep with blips ---------- */
function CyberVisual({ still, reverse }: SceneProps) {
  return (
    <div className="relative flex h-full w-full items-center justify-center">
      <div className="relative aspect-square h-full max-h-[132px] lg:max-h-[148px]">
        {/* rings build outward on entrance */}
        {[36, 68, 100].map((size, i) => (
          <motion.div
            key={size}
            style={{ width: `${size}%`, height: `${size}%`, left: "50%", top: "50%" }}
            initial={{ opacity: 0, scale: 0.6, x: "-50%", y: "-50%" }}
            animate={{ opacity: 1, scale: 1, x: "-50%", y: "-50%" }}
            transition={{ duration: 0.4, delay: i * 0.12, ease: "easeOut" }}
            className="absolute rounded-full border border-sky-500/25 dark:border-sky-400/25"
          />
        ))}
        {/* crosshairs */}
        <div className="absolute left-1/2 top-0 h-full w-px -translate-x-1/2 bg-sky-500/15 dark:bg-sky-400/15" />
        <div className="absolute left-0 top-1/2 h-px w-full -translate-y-1/2 bg-sky-500/15 dark:bg-sky-400/15" />
        {/* rotating sweep — fades in after the rings build */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={still ? { opacity: 1 } : { opacity: 1, rotate: reverse ? -360 : 360 }}
          transition={{
            opacity: { duration: 0.4, delay: 0.35 },
            rotate: { duration: 4, repeat: Infinity, ease: "linear", delay: 0.4 },
          }}
          className="absolute inset-0 rounded-full"
          style={{
            background:
              "conic-gradient(from 0deg, rgba(56,189,248,0.35), rgba(56,189,248,0.08) 18%, transparent 30%)",
          }}
        />
        {/* blips */}
        {[
          { top: "26%", left: "62%", delay: 0.6 },
          { top: "58%", left: "30%", delay: 2.1 },
          { top: "68%", left: "66%", delay: 3.3 },
        ].map((b, i) => (
          <motion.span
            key={i}
            animate={still ? undefined : { opacity: [0, 1, 0], scale: [0.6, 1.3, 0.6] }}
            transition={{ duration: 2, delay: b.delay, repeat: Infinity, repeatDelay: 2 }}
            style={{ top: b.top, left: b.left }}
            className="absolute size-2 rounded-full bg-sky-500 shadow-[0_0_10px_2px_rgba(56,189,248,0.6)] dark:bg-sky-300"
          />
        ))}
        {/* center dot */}
        <span className="absolute left-1/2 top-1/2 size-1.5 -translate-x-1/2 -translate-y-1/2 rounded-full bg-sky-600 dark:bg-sky-300" />
      </div>
    </div>
  );
}

/* ---------- AI: pulsing neural network ---------- */
const NODES = [
  // input layer
  { x: 18, y: 30 }, { x: 18, y: 70 },
  // hidden layer
  { x: 50, y: 18 }, { x: 50, y: 50 }, { x: 50, y: 82 },
  // output layer
  { x: 82, y: 35 }, { x: 82, y: 65 },
];
const EDGES: [number, number][] = [
  [0, 2], [0, 3], [0, 4], [1, 2], [1, 3], [1, 4],
  [2, 5], [2, 6], [3, 5], [3, 6], [4, 5], [4, 6],
];

function AiVisual({ still }: SceneProps) {
  return (
    <div className="relative flex h-full w-full items-center justify-center">
      <svg viewBox="0 0 100 100" className="h-full max-h-[132px] w-auto lg:max-h-[148px]">
        {EDGES.map(([a, b], i) => (
          <motion.line
            key={i}
            x1={NODES[a].x}
            y1={NODES[a].y}
            x2={NODES[b].x}
            y2={NODES[b].y}
            stroke="currentColor"
            strokeWidth="0.6"
            className="text-fuchsia-500/30 dark:text-fuchsia-400/30"
            initial={{ pathLength: 0, opacity: 0 }}
            animate={
              still
                ? { pathLength: 1, opacity: 0.4 }
                : { pathLength: 1, opacity: [0.15, 0.7, 0.15] }
            }
            transition={{
              pathLength: { duration: 0.35, delay: i * 0.045, ease: "easeOut" },
              opacity: { duration: 2.4, delay: (i % 6) * 0.3, repeat: Infinity, ease: "easeInOut" },
            }}
          />
        ))}
        {NODES.map((n, i) => (
          <motion.circle
            key={i}
            cx={n.x}
            cy={n.y}
            r={3.4}
            className="fill-violet-600 dark:fill-violet-400"
            style={{ transformBox: "fill-box", transformOrigin: "center" }}
            initial={{ opacity: 0, scale: 0.5 }}
            animate={
              still
                ? { opacity: 1, scale: 1 }
                : { opacity: [0.5, 1, 0.5], scale: [0.85, 1.15, 0.85] }
            }
            transition={{ duration: 2, delay: i * 0.12, repeat: still ? 0 : Infinity, ease: "easeInOut" }}
          />
        ))}
      </svg>
    </div>
  );
}

/* ============================================================
   Variant pools — 3 named illustrations per domain, rotating each
   time a domain returns. Only one is mounted at a time.

   fullstack: "Code Brackets" | "Data Flow"        | "Device Trio"
   cyber:     "Radar Sweep"   | "Shield Check"     | "Fingerprint Scan"
   ai:        "Neural Network"| "Orbit Core"       | "AI Chip"
   ============================================================ */

/* ---------- Fullstack 2: "Data Flow" — client → server → database ---------- */
function DataFlowVisual({ still, reverse }: SceneProps) {
  return (
    <div className="relative flex h-full w-full items-center justify-center">
      <div className="relative flex w-full max-w-[240px] items-center justify-between px-2">
        {/* connecting rail */}
        <div className="absolute left-8 right-8 top-1/2 h-px -translate-y-1/2 bg-gradient-to-r from-teal-500/30 via-emerald-500/40 to-teal-500/30" />
        {/* traveling packet */}
        <motion.span
          initial={{ opacity: 0 }}
          animate={still ? { opacity: 0 } : { left: reverse ? ["82%", "14%"] : ["14%", "82%"], opacity: [0, 1, 1, 0] }}
          transition={{ duration: 2.2, times: [0, 0.15, 0.85, 1], repeat: Infinity, ease: "easeInOut", delay: 0.5 }}
          className="absolute top-1/2 size-2 -translate-y-1/2 rounded-full bg-emerald-500 shadow-[0_0_10px_2px_rgba(16,185,129,0.55)] dark:bg-emerald-300"
        />
        {/* client — browser dot */}
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={still ? { opacity: 1, y: 0 } : { opacity: 1, y: 0, scale: [1, 1.08, 1] }}
          transition={{
            opacity: { duration: 0.4 },
            y: { duration: 0.4, ease: "easeOut" },
            scale: { duration: 2.2, repeat: Infinity, ease: "easeInOut", delay: 0.5 },
          }}
          className="relative flex size-12 items-center justify-center rounded-full border border-teal-500/40 bg-teal-500/10 dark:border-teal-400/40"
        >
          <span className="size-4 rounded-full border-2 border-teal-600 dark:border-teal-300" />
        </motion.div>
        {/* server — rounded slab with LEDs */}
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={still ? { opacity: 1, y: 0 } : { opacity: 1, y: 0, scale: [1, 1.08, 1] }}
          transition={{
            opacity: { duration: 0.4, delay: 0.15 },
            y: { duration: 0.4, delay: 0.15, ease: "easeOut" },
            scale: { duration: 2.2, delay: 1.2, repeat: Infinity, ease: "easeInOut" },
          }}
          className="relative flex size-12 flex-col items-center justify-center gap-1 rounded-xl border border-emerald-500/40 bg-emerald-500/10 dark:border-emerald-400/40"
        >
          {[0, 1].map((i) => (
            <span key={i} className="flex items-center gap-1">
              <motion.span
                animate={still ? undefined : { opacity: [0.3, 1, 0.3] }}
                transition={{ duration: 1.4, delay: i * 0.4, repeat: Infinity }}
                className="size-1 rounded-full bg-emerald-500 dark:bg-emerald-300"
              />
              <span className="h-0.5 w-4 rounded-full bg-emerald-600/50 dark:bg-emerald-300/50" />
            </span>
          ))}
        </motion.div>
        {/* database — stacked discs */}
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={still ? { opacity: 1, y: 0 } : { opacity: 1, y: 0, scale: [1, 1.08, 1] }}
          transition={{
            opacity: { duration: 0.4, delay: 0.3 },
            y: { duration: 0.4, delay: 0.3, ease: "easeOut" },
            scale: { duration: 2.2, delay: 1.9, repeat: Infinity, ease: "easeInOut" },
          }}
          className="relative flex size-12 flex-col items-center justify-center gap-[3px] rounded-xl border border-teal-500/40 bg-teal-500/10 dark:border-teal-400/40"
        >
          {[0, 1, 2].map((i) => (
            <span
              key={i}
              className="h-[5px] w-6 rounded-full border border-teal-600/60 bg-teal-500/20 dark:border-teal-300/60"
            />
          ))}
        </motion.div>
      </div>
    </div>
  );
}

/* ---------- Fullstack 3: "Device Trio" — responsive screens ---------- */
function DeviceTrioVisual({ still }: SceneProps) {
  return (
    <div className="relative flex h-full w-full items-end justify-center gap-4 pb-6">
      {/* desktop */}
      <motion.div
        initial={{ opacity: 0, y: 14 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.45, ease: "easeOut" }}
      >
        <motion.div {...float(still, 4, 3.6)} className="flex flex-col items-center">
        <div className="flex h-16 w-24 flex-col gap-1.5 rounded-lg border border-teal-500/50 bg-teal-500/5 p-2 dark:border-teal-400/50 lg:h-[72px] lg:w-28">
          {[60, 90, 45].map((w, i) => (
            <motion.span
              key={i}
              animate={still ? undefined : { opacity: [0.25, 0.85, 0.25] }}
              transition={{ duration: 2, delay: i * 0.35, repeat: Infinity, ease: "easeInOut" }}
              style={{ width: `${w}%` }}
              className="h-1.5 rounded-full bg-teal-500/60 dark:bg-teal-300/60"
            />
          ))}
        </div>
        <span className="mt-1 h-1 w-8 rounded-full bg-teal-500/40 dark:bg-teal-400/40" />
        </motion.div>
      </motion.div>
      {/* tablet */}
      <motion.div
        initial={{ opacity: 0, y: 14 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.45, delay: 0.15, ease: "easeOut" }}
      >
        <motion.div
          {...float(still, 4, 3.6, 0.6)}
          className="flex h-[74px] w-14 flex-col gap-1.5 rounded-lg border border-emerald-500/50 bg-emerald-500/5 p-2 dark:border-emerald-400/50 lg:h-[84px] lg:w-16"
        >
          {[85, 60, 75].map((w, i) => (
            <motion.span
              key={i}
              animate={still ? undefined : { opacity: [0.25, 0.85, 0.25] }}
              transition={{ duration: 2, delay: 0.4 + i * 0.35, repeat: Infinity, ease: "easeInOut" }}
              style={{ width: `${w}%` }}
              className="h-1.5 rounded-full bg-emerald-500/60 dark:bg-emerald-300/60"
            />
          ))}
        </motion.div>
      </motion.div>
      {/* phone */}
      <motion.div
        initial={{ opacity: 0, y: 14 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.45, delay: 0.3, ease: "easeOut" }}
      >
        <motion.div
          {...float(still, 4, 3.6, 1.2)}
          className="flex h-14 w-8 flex-col gap-1 rounded-md border border-teal-500/50 bg-teal-500/5 p-1.5 dark:border-teal-400/50 lg:h-16 lg:w-9"
        >
          {[90, 65].map((w, i) => (
            <motion.span
              key={i}
              animate={still ? undefined : { opacity: [0.25, 0.85, 0.25] }}
              transition={{ duration: 2, delay: 0.8 + i * 0.35, repeat: Infinity, ease: "easeInOut" }}
              style={{ width: `${w}%` }}
              className="h-1 rounded-full bg-teal-500/60 dark:bg-teal-300/60"
            />
          ))}
        </motion.div>
      </motion.div>
    </div>
  );
}

/* ---------- Cyber 2: "Shield Check" — shield with drawing check ---------- */
function ShieldCheckVisual({ still, reverse }: SceneProps) {
  return (
    <div className="relative flex h-full w-full items-center justify-center">
      {/* single calm ripple */}
      <motion.span
        animate={still ? undefined : { scale: [1, 1.55], opacity: [0.45, 0] }}
        transition={{ duration: 2.8, repeat: Infinity, ease: "easeOut", delay: 0.4 }}
        className="absolute size-[5.75rem] rounded-full border border-sky-400/40 lg:size-[6.5rem]"
      />
      <motion.svg
        viewBox="0 0 24 24"
        initial={{ scale: 0.8, opacity: 0 }}
        animate={still ? { scale: 1, opacity: 1 } : { scale: 1, opacity: 1, y: [0, -4, 0] }}
        transition={{
          scale: { duration: 0.45, ease: "easeOut" },
          opacity: { duration: 0.45 },
          y: { duration: 3.4, repeat: Infinity, ease: "easeInOut", delay: 0.45 },
        }}
        className="relative h-[5.75rem] w-[5.75rem] lg:h-[6.5rem] lg:w-[6.5rem]"
      >
        <path
          d="M12 2.5 20 5.6v5.2c0 4.9-3.4 8.9-8 10.7-4.6-1.8-8-5.8-8-10.7V5.6L12 2.5Z"
          className="fill-sky-500/10 stroke-sky-600 dark:fill-sky-400/10 dark:stroke-sky-300"
          strokeWidth="0.9"
          strokeLinejoin="round"
        />
        <motion.path
          d="m8.4 12.1 2.4 2.5 4.8-5"
          fill="none"
          strokeWidth="1.5"
          strokeLinecap="round"
          strokeLinejoin="round"
          className="stroke-sky-600 dark:stroke-sky-300"
          animate={still ? undefined : reverse ? { pathLength: [1, 0, 0], opacity: [0, 1, 1, 1] } : { pathLength: [0, 1, 1], opacity: [1, 1, 1, 0] }}
          transition={{ duration: 3.2, times: [0, 0.3, 0.85, 1], repeat: Infinity, ease: "easeInOut" }}
        />
      </motion.svg>
    </div>
  );
}

/* ---------- Cyber 3: "Fingerprint Scan" — arcs with scan beam ---------- */
const FP_ARCS = [
  { r: 6, dash: "26 12", rot: 20 },
  { r: 11, dash: "40 18", rot: -15 },
  { r: 16, dash: "52 30", rot: 40 },
  { r: 21, dash: "70 40", rot: -30 },
  { r: 26, dash: "88 55", rot: 10 },
];

function FingerprintVisual({ still }: SceneProps) {
  return (
    <div className="relative flex h-full w-full items-center justify-center">
      <div className="relative">
        <svg viewBox="0 0 64 64" className="h-[6.5rem] w-[6.5rem] lg:h-[7.25rem] lg:w-[7.25rem]">
          {FP_ARCS.map((a, i) => (
            <motion.circle
              key={i}
              cx={32}
              cy={32}
              r={a.r}
              fill="none"
              strokeWidth="1.6"
              strokeLinecap="round"
              strokeDasharray={a.dash}
              transform={`rotate(${a.rot} 32 32)`}
              className="stroke-sky-600/70 dark:stroke-sky-300/70"
              initial={{ opacity: 0 }}
              animate={still ? { opacity: 0.7 } : { opacity: [0.25, 0.9, 0.25] }}
              transition={{ duration: 2.4, delay: i * 0.12, repeat: still ? 0 : Infinity, ease: "easeInOut" }}
            />
          ))}
        </svg>
        {/* scan beam sweeping over the print */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={still ? { opacity: 1 } : { opacity: 1, top: ["8%", "88%", "8%"] }}
          transition={{
            opacity: { duration: 0.4, delay: 0.5 },
            top: { duration: 3.6, repeat: Infinity, ease: "easeInOut", delay: 0.5 },
          }}
          className="absolute left-0 right-0 top-[8%] h-[3px] rounded-full bg-gradient-to-r from-transparent via-sky-400/90 to-transparent shadow-[0_0_12px_2px_rgba(56,189,248,0.45)]"
        />
      </div>
    </div>
  );
}

/* ---------- AI 2: "Orbit Core" — glowing core with electron orbits ---------- */
function OrbitCoreVisual({ still, reverse }: SceneProps) {
  return (
    <div className="relative flex h-full w-full items-center justify-center">
      <motion.svg
        viewBox="0 0 120 120"
        initial={{ scale: 0.85, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        transition={{ duration: 0.45, ease: "easeOut" }}
        className="h-full max-h-[132px] w-auto lg:max-h-[148px]"
      >
        {/* orbits + electrons: each group spins around the core */}
        {[
          { tilt: 0, dur: 6 },
          { tilt: 60, dur: 8 },
          { tilt: 120, dur: 10 },
        ].map(({ tilt, dur }, i) => (
          <g key={i} transform={`rotate(${tilt} 60 60)`}>
            <ellipse
              cx={60}
              cy={60}
              rx={44}
              ry={16}
              fill="none"
              strokeWidth="0.8"
              className="stroke-violet-500/35 dark:stroke-violet-400/35"
            />
            <motion.g
              animate={still ? undefined : { rotate: reverse ? -360 : 360 }}
              transition={{ duration: dur, repeat: Infinity, ease: "linear" }}
              style={{ transformBox: "view-box", transformOrigin: "60px 60px" }}
            >
              {/* electron rides an invisible circular rail, flattened by the ellipse look */}
              <circle cx={104} cy={60} r={2.6} className="fill-fuchsia-500 dark:fill-fuchsia-300" />
            </motion.g>
          </g>
        ))}
        {/* nucleus */}
        <motion.circle
          cx={60}
          cy={60}
          r={7}
          className="fill-fuchsia-500 dark:fill-fuchsia-300"
          style={{ transformBox: "fill-box", transformOrigin: "center" }}
          animate={still ? undefined : { scale: [1, 1.18, 1], opacity: [0.85, 1, 0.85] }}
          transition={{ duration: 2.2, repeat: Infinity, ease: "easeInOut" }}
        />
        <circle cx={60} cy={60} r={11} className="fill-fuchsia-400/20" />
      </motion.svg>
    </div>
  );
}

/* ---------- AI 3: "AI Chip" — processor with pulsing traces ---------- */
const CHIP_TRACES = [
  { x1: 60, y1: 32, x2: 60, y2: 8 },   // up
  { x1: 60, y1: 88, x2: 60, y2: 112 }, // down
  { x1: 32, y1: 60, x2: 8, y2: 60 },   // left
  { x1: 88, y1: 60, x2: 112, y2: 60 }, // right
  { x1: 40, y1: 36, x2: 24, y2: 20 },  // diagonals
  { x1: 80, y1: 36, x2: 96, y2: 20 },
  { x1: 40, y1: 84, x2: 24, y2: 100 },
  { x1: 80, y1: 84, x2: 96, y2: 100 },
];

function AiChipVisual({ still, reverse }: SceneProps) {
  return (
    <div className="relative flex h-full w-full items-center justify-center">
      <motion.svg
        viewBox="0 0 120 120"
        initial={{ scale: 0.85, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        transition={{ duration: 0.45, ease: "easeOut" }}
        className="h-full max-h-[132px] w-auto lg:max-h-[148px]"
      >
        {/* traces radiating from the chip */}
        {CHIP_TRACES.map((t, i) => (
          <g key={i}>
            <line
              x1={t.x1}
              y1={t.y1}
              x2={t.x2}
              y2={t.y2}
              strokeWidth="1"
              className="stroke-violet-500/30 dark:stroke-violet-400/30"
            />
            <motion.circle
              cx={t.x1}
              cy={t.y1}
              r={1.8}
              className="fill-fuchsia-500 dark:fill-fuchsia-300"
              animate={
                still
                  ? undefined
                  : reverse
                  ? { x: [t.x2 - t.x1, 0], y: [t.y2 - t.y1, 0], opacity: [0, 1, 0] }
                  : { x: [0, t.x2 - t.x1], y: [0, t.y2 - t.y1], opacity: [0, 1, 0] }
              }
              transition={{ duration: 1.8, delay: i * 0.35, repeat: Infinity, ease: "easeInOut" }}
            />
          </g>
        ))}
        {/* chip body */}
        <motion.rect
          x={32}
          y={32}
          width={56}
          height={56}
          rx={10}
          className="fill-violet-500/10 stroke-violet-600 dark:fill-violet-400/10 dark:stroke-violet-300"
          strokeWidth="1.4"
          style={{ transformBox: "fill-box", transformOrigin: "center" }}
          animate={still ? undefined : { scale: [1, 1.04, 1] }}
          transition={{ duration: 2.4, repeat: Infinity, ease: "easeInOut" }}
        />
        <rect x={42} y={42} width={36} height={36} rx={6} className="fill-none stroke-violet-500/40 dark:stroke-violet-400/40" strokeWidth="0.8" />
        {/* AI label */}
        <motion.text
          x={60}
          y={65}
          textAnchor="middle"
          className="fill-fuchsia-600 font-mono text-[15px] font-bold dark:fill-fuchsia-300"
          animate={still ? undefined : { opacity: [0.65, 1, 0.65] }}
          transition={{ duration: 2.4, repeat: Infinity, ease: "easeInOut" }}
        >
          AI
        </motion.text>
      </motion.svg>
    </div>
  );
}

const visuals: Record<string, Array<(props: SceneProps) => React.ReactElement>> = {
  fullstack: [FullstackVisual, DataFlowVisual, DeviceTrioVisual],
  cyber: [CyberVisual, ShieldCheckVisual, FingerprintVisual],
  ai: [AiVisual, OrbitCoreVisual, AiChipVisual],
};

/* Shared backdrop glow. Light mode keeps the 3-stop headline gradient.
   Dark mode uses the exact same recipe as the hero headline's ambient
   glow (HomeHero domainStyles): one flat domain color at 7%, blur-3xl,
   oversized past the box — soft breathing light with no visible edge. */
const domainGlow: Record<string, string> = {
  fullstack:
    "bg-gradient-to-r from-emerald-300/[0.135] via-teal-400/[0.135] to-cyan-400/[0.135] dark:bg-none dark:bg-teal-400/[0.07]",
  cyber:
    "bg-gradient-to-r from-sky-300/[0.135] via-blue-400/[0.135] to-indigo-400/[0.135] dark:bg-none dark:bg-blue-400/[0.07]",
  ai: "bg-gradient-to-r from-violet-400/[0.135] via-fuchsia-400/[0.135] to-pink-400/[0.135] dark:bg-none dark:bg-fuchsia-400/[0.07]",
};

export function DomainShowcase({ domain }: { domain: string }) {
  const pool = visuals[domain] ?? visuals.ai;
  const [hovered, setHovered] = useState(false);
  const reduced = useReducedMotion();
  const still = Boolean(reduced);
  // Hovering plays the illustration backward instead of pausing it.
  const reverse = hovered && !still;
  // Rotate variants each time a domain comes back around; only one
  // visual is mounted at a time, so extra variants cost nothing.
  const idxRef = useRef<Record<string, number>>({});
  const prevDomainRef = useRef<string | null>(null);
  if (prevDomainRef.current !== domain) {
    prevDomainRef.current = domain;
    idxRef.current[domain] = ((idxRef.current[domain] ?? -1) + 1) % pool.length;
  }
  const idx = idxRef.current[domain] ?? 0;
  const Visual = pool[idx];
  return (
    <div
      aria-hidden
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      className="group relative h-[150px] w-full max-w-[280px] sm:h-[156px] sm:max-w-[300px] md:max-w-[280px] lg:h-[172px] lg:max-w-[320px]"
    >
      {/* Backdrop glow removed (matches the headline) — the illustration's
         own colored strokes and dots carry the domain identity. */}
      <AnimatePresence mode="wait">
        <motion.div
          key={`${domain}-${idx}`}
          initial={still ? false : { opacity: 0, scale: 0.92 }}
          animate={{ opacity: 1, scale: 1 }}
          exit={still ? { opacity: 1 } : { opacity: 0, scale: 0.94 }}
          transition={still ? { duration: 0 } : { duration: 0.4, ease: "easeInOut" }}
          className="absolute inset-0 transition-[filter] duration-300 group-hover:brightness-110 group-hover:saturate-110 motion-reduce:transition-none"
        >
          <Visual still={still} reverse={reverse} />
        </motion.div>
      </AnimatePresence>
    </div>
  );
}
