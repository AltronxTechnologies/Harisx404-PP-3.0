"use client";

import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import { motion, useReducedMotion } from "framer-motion";
import { BadgeCheck } from "lucide-react";
import { SectionHeading } from "./SectionHeading";
import type { CredentialSummary } from "@/app/credentials/summary";

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
  { rot: "rotate-[-4deg]", tint: "bg-amber-500/15", vis: "" },
  { rot: "rotate-[3deg]", tint: "bg-pink-500/15", vis: "" },
  { rot: "rotate-[-2deg]", tint: "bg-blue-500/15", vis: "" },
  { rot: "rotate-[5deg]", tint: "bg-emerald-500/15", vis: "" },
  { rot: "rotate-[-6deg]", tint: "bg-violet-500/15", vis: "" },
  { rot: "rotate-[4deg]", tint: "bg-sky-500/15", vis: "md:hidden lg:inline-block" },
  { rot: "rotate-[-3deg]", tint: "bg-rose-500/15", vis: "hidden lg:inline-block" },
];

/* ── Scroll pulse ────────────────────────────────────────────────────
   When the card row crosses the middle band of the viewport, every
   card's hover visual plays once (~1.8s: stagger in, brief hold),
   then cools back to the resting state. It re-arms only after the row
   leaves the band, so each scroll pass replays it exactly once. */
function useScrollPulse<T extends HTMLElement>(ref: React.RefObject<T | null>) {
  const [pulse, setPulse] = useState(false);
  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    let t: number | undefined;
    const io = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setPulse(true);
          window.clearTimeout(t);
          t = window.setTimeout(() => setPulse(false), 1800);
        }
      },
      { rootMargin: "-30% 0px -30% 0px" }
    );
    io.observe(el);
    return () => {
      io.disconnect();
      window.clearTimeout(t);
    };
  }, [ref]);
  return pulse;
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

function CredentialArchivePreview({ count, pulse }: { count: number; pulse: boolean }) {
  const documentClass = `relative flex h-[82px] min-w-0 flex-col justify-between rounded-xl border bg-neutral-50/70 p-2.5 transition-[border-color,background-color,box-shadow] duration-300 motion-reduce:transition-none md:p-2 lg:p-2.5 dark:bg-white/[0.035] ${
    pulse
      ? "border-neutral-400/60 bg-neutral-100/80 shadow-sm dark:border-white/25 dark:bg-white/[0.055]"
      : "border-border-primary group-hover:border-neutral-400/60 group-hover:bg-neutral-100/80 group-hover:shadow-sm dark:group-hover:border-white/25 dark:group-hover:bg-white/[0.055]"
  }`;

  const document = (index: number) => (
    <div className={documentClass}>
      <div className="flex items-center justify-between">
        <span className="font-mono text-[7px] uppercase tracking-[0.14em] text-text-secondary md:hidden lg:inline">
          {index === 1 ? "Archive" : "Proof"}
        </span>
        <BadgeCheck
          className={`size-3 transition-colors duration-300 motion-reduce:transition-none ${
            pulse
              ? "text-emerald-600 dark:text-emerald-300"
              : "text-neutral-400 group-hover:text-emerald-600 dark:text-white/30 dark:group-hover:text-emerald-300"
          }`}
          strokeWidth={1.8}
        />
      </div>
      {index === 1 ? (
        <div className="text-center">
          <span className="font-display text-[24px] font-semibold leading-none text-text-primary md:text-xl lg:text-[24px]">
            {count > 0 ? String(count).padStart(2, "0") : "—"}
          </span>
          <span className="mt-1 block font-mono text-[6px] uppercase tracking-[0.14em] text-text-secondary">
            Published
          </span>
        </div>
      ) : (
        <div className="space-y-1.5">
          <span className={`block h-1 rounded-full bg-neutral-300/80 transition-[width,background-color] duration-500 dark:bg-white/15 ${index === 0 ? "w-full group-hover:w-4/5" : "w-4/5 group-hover:w-full"}`} />
          <span className={`block h-1 rounded-full bg-neutral-200 transition-[width,background-color] duration-500 dark:bg-white/10 ${index === 0 ? "w-2/3 group-hover:w-1/2" : "w-1/2 group-hover:w-2/3"}`} />
        </div>
      )}
      <span className={`h-px bg-border-primary transition-[width] duration-500 ${index === 1 ? "mx-auto w-2/3 group-hover:w-full" : "w-full group-hover:w-2/3"}`} />
    </div>
  );

  return (
    <div
      data-credential-bento-preview
      data-home-credential-archive
      className="grid h-28 grid-cols-3 content-center gap-2 md:gap-1.5 lg:gap-2"
      aria-hidden="true"
    >
      {document(0)}
      {document(1)}
      {document(2)}
    </div>
  );
}

export function MySiteGrid({ credentialSummary }: { credentialSummary: CredentialSummary }) {
  const prefersReducedMotion = useReducedMotion();
  const rowRef = useRef<HTMLDivElement | null>(null);
  const scrollPulse = useScrollPulse(rowRef);
  // Respect reduced motion: no scroll-triggered animation.
  const pulse = scrollPulse && !prefersReducedMotion;

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
          explore &amp;&amp; say hello.
        </span>
      </SectionHeading>

      <motion.div
        ref={rowRef}
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
                { v: "v2.1", w: "w-[55%]", pw: "w-[80%]", hw: "motion-safe:group-hover:w-[80%] motion-safe:group-active:w-[80%]", d: "delay-0", live: true },
                { v: "v2.0", w: "w-[80%]", pw: "w-[55%]", hw: "motion-safe:group-hover:w-[55%] motion-safe:group-active:w-[55%]", d: "delay-75", live: false },
                { v: "v1.4", w: "w-[40%]", pw: "w-[65%]", hw: "motion-safe:group-hover:w-[65%] motion-safe:group-active:w-[65%]", d: "delay-150", live: false },
              ].map((row) => (
                <div key={row.v} className="flex items-center gap-2.5">
                  <span
                    className={`inline-flex items-center gap-1 rounded-full border border-border-primary px-2 py-0.5 font-mono text-[10px] ${
                      row.live
                        ? "text-text-primary"
                        : "text-text-secondary"
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
                      className={`block h-1.5 rounded-full transition-all duration-500 ease-out ${row.d} ${
                        pulse
                          ? `${row.pw} bg-neutral-400/50 dark:bg-white/25`
                          : `${row.w} ${row.hw} bg-border-primary group-hover:bg-neutral-400/50 group-active:bg-neutral-400/50 dark:group-hover:bg-white/25 dark:group-active:bg-white/25`
                      }`}
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

        {/* Credentials */}
        <motion.div {...cardMotion}>
          <Link href="/credentials" className={`${cardBase} hover:ring-neutral-400/70 active:ring-neutral-400/70 dark:hover:ring-white/25 dark:active:ring-white/25`}>
            <Ambient />
            <CredentialArchivePreview count={credentialSummary.count} pulse={pulse} />
            <div>
              <p className="font-mono text-xs uppercase tracking-widest text-text-secondary">
                CREDENTIALS
              </p>
              <h3 className="mt-2 font-display text-xl font-medium leading-snug text-text-primary md:text-lg lg:text-2xl">
                Learning milestones, backed by proof.
              </h3>
            </div>
          </Link>
        </motion.div>

        {/* Community Wall */}
        <motion.div {...cardMotion}>
          <Link href="/community-wall" className={`${cardBase} hover:ring-neutral-400/70 active:ring-neutral-400/70 dark:hover:ring-white/25 dark:active:ring-white/25`}>
            <Ambient />
            <div className="flex h-28 flex-wrap content-center gap-3" aria-hidden>
              {noteTints.map(({ rot, tint, vis }, i) => (
                <span
                  key={tint}
                  className={`h-12 w-14 rounded-md border border-border-primary transition-transform duration-500 ease-out motion-safe:group-hover:rotate-0 motion-safe:group-hover:scale-105 motion-safe:group-active:rotate-0 motion-safe:group-active:scale-105 md:h-9 md:w-10 lg:h-12 lg:w-14 ${
                    ["delay-0", "delay-75", "delay-100", "delay-150", "delay-200", "delay-200", "delay-300"][i]
                  } ${pulse ? "rotate-0 scale-105" : rot} ${tint} ${vis}`}
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
