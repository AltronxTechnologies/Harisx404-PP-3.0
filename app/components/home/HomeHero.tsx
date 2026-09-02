"use client";

import Image from "next/image";
import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import { AnimatePresence, motion, useReducedMotion } from "framer-motion";
import { DomainShowcase } from "./DomainShowcase";
import { ArrowUpRight, ChevronRight } from "lucide-react";
import { siteContent } from "@/app/data/site-content";

const { hero } = siteContent;

const fadeUp = {
  hidden: { opacity: 0, y: 24 },
  show: (i: number) => ({
    opacity: 1,
    y: 0,
    transition: { duration: 0.6, delay: 0.1 + i * 0.12, ease: "easeOut" },
  }),
};

const statusLines = hero.statusLines;

/* Rotating status pill: mono uppercase lines cycling, shown centered
   under the hero. */
function TaglineRotator() {
  const [index, setIndex] = useState(0);
  const reduced = useReducedMotion();

  useEffect(() => {
    if (reduced) return;
    const timer = setInterval(
      () => setIndex((prev) => (prev + 1) % statusLines.length),
      3000
    );
    return () => clearInterval(timer);
  }, [reduced]);

  return (
    <div
      className="flex items-center gap-2.5 font-mono text-xs font-normal uppercase tracking-widest text-text-secondary"
      aria-live="polite"
    >
      {/* Dot lives outside the clipped rotator so its ping ring never cuts */}
      <span aria-hidden className="relative flex size-1.5 shrink-0">
        <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-emerald-400 opacity-75 motion-reduce:animate-none" />
        <span className="relative inline-flex size-1.5 rounded-full bg-emerald-500" />
      </span>
      <div className="relative h-5 w-[250px] overflow-hidden lg:h-6 lg:w-[314px]">
        <AnimatePresence mode="wait">
          <motion.span
            key={statusLines[index]}
            initial={reduced ? false : { opacity: 0, y: 14 }}
            animate={{ opacity: 1, y: 0 }}
            exit={reduced ? { opacity: 1 } : { opacity: 0, y: -14 }}
            transition={reduced ? { duration: 0 } : { duration: 0.35, ease: "easeOut" }}
            className="absolute inset-x-0 top-1 block whitespace-nowrap text-center md:text-left"
          >
            {statusLines[index]}
          </motion.span>
        </AnimatePresence>
      </div>
    </div>
  );
}

const headlines = hero.headlines;

/* Domain accents — rich, luminous gradients tuned for the dark canvas. */
const domainStyles: Record<
  string,
  { gradient: string; glow: string; caret: string }
> = {
  fullstack: {
    gradient:
      "bg-gradient-to-r from-emerald-300 via-teal-400 to-cyan-400 bg-clip-text text-transparent",
    glow: "bg-teal-400/[0.07]",
    caret: "bg-teal-300",
  },
  cyber: {
    gradient:
      "bg-gradient-to-r from-sky-300 via-blue-400 to-indigo-400 bg-clip-text text-transparent",
    glow: "bg-blue-400/[0.07]",
    caret: "bg-sky-300",
  },
  ai: {
    gradient:
      "bg-gradient-to-r from-violet-400 via-fuchsia-400 to-pink-400 bg-clip-text text-transparent",
    glow: "bg-fuchsia-400/[0.07]",
    caret: "bg-fuchsia-300",
  },
};

/* Terminal glyph set (per the decode reference) — symbols only, so the
   scramble reads as "machine noise" rather than letter soup. */
const DECODE_GLYPHS = "#</>{}[]=+*^:~10";
const DECODE_MS = 850; // line 1 duration; line 2 runs +150ms and starts +130ms later
const HOLD_MS = 2600;

const wait = (ms: number) => new Promise((r) => setTimeout(r, ms));
const randGlyph = () =>
  DECODE_GLYPHS[Math.floor(Math.random() * DECODE_GLYPHS.length)];

/* Duration-based scramble of one string: characters lock left-to-right
   as progress advances; spaces are preserved. Driven by rAF, so it is
   frame-rate independent (60/120/144Hz) and jitter-free. */
function scrambleAt(target: string, progress: number) {
  const settled = Math.floor(progress * target.length);
  let out = target.slice(0, settled);
  for (let i = settled; i < target.length; i++) {
    out += target[i] === " " ? " " : randGlyph();
  }
  return out;
}

/* Matrix-style decode (per the reference site): every character cycles
   through random glyphs, then locks into place left-to-right. Phrases
   morph directly into each other - no blank state. First paint is the
   full first phrase (SSR/SEO safe). */
function HeadlineRotator({
  onDomainChange,
}: {
  onDomainChange?: (accent: string) => void;
}) {
  const prefersReducedMotion = useReducedMotion();
  const [index, setIndex] = useState(0);
  const [line1, setLine1] = useState<string>(headlines[0].line1);
  const [line2, setLine2] = useState<string>(headlines[0].line2);
  const [busy, setBusy] = useState(false);
  const firstRun = useRef(true);
  /* Hover re-scramble (per the decode reference): pointerenter replays a
     snappier 650ms decode of the current phrase, throttled to one replay
     per 2.6s, fine pointers only. */
  const [replay, setReplay] = useState(0);
  const fastRef = useRef(false);
  const lastHoverRef = useRef(0);
  const busyRef = useRef(false);
  busyRef.current = busy;
  /* Pause the rotation while the hero is scrolled off-screen: the cycle
     waits (500ms polls) until the headline is visible again before
     decoding or advancing — no wasted work in background. */
  const rootRef = useRef<HTMLDivElement | null>(null);
  const visibleRef = useRef(true);
  useEffect(() => {
    const el = rootRef.current;
    if (!el || typeof IntersectionObserver === "undefined") return;
    const obs = new IntersectionObserver(
      ([entry]) => {
        visibleRef.current = entry.isIntersecting;
      },
      { threshold: 0 }
    );
    obs.observe(el);
    return () => obs.disconnect();
  }, []);
  const handleHover = () => {
    if (typeof window === "undefined") return;
    if (!window.matchMedia("(pointer: fine)").matches) return;
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    const now = Date.now();
    if (busyRef.current || now - lastHoverRef.current < 2600) return;
    lastHoverRef.current = now;
    fastRef.current = true;
    setReplay((r) => r + 1);
  };

  useEffect(() => {
    let cancelled = false;
    const t1 = headlines[index].line1;
    const t2 = headlines[index].line2;
    /* Illustration swaps 300ms into the decode so the text appears to
       "summon" the visual rather than both flipping at once. */
    const domainTimer = setTimeout(
      () => onDomainChange?.(headlines[index].accent),
      firstRun.current ? 0 : 300
    );

    /* Off-screen pause: resolve only once the headline is visible. */
    const waitVisible = async () => {
      while (!cancelled && !visibleRef.current) await wait(500);
    };

    /* rAF-driven decode: both lines morph toward their targets; line 2
       starts 130ms later and runs 150ms longer (staggered, per the
       decode reference). Resolves when both lines are fully settled. */
    const decode = () =>
      new Promise<void>((resolve) => {
        let t0: number | null = null;
        let raf = 0;
        const d1 = fastRef.current ? 650 : DECODE_MS;
        const d2 = (fastRef.current ? 650 : DECODE_MS) + 150;
        const offset2 = 130;
        const frame = (now: number) => {
          if (cancelled) return resolve();
          if (t0 === null) t0 = now;
          const el = now - t0;
          const p1 = Math.min(el / d1, 1);
          const p2 = Math.min(Math.max(el - offset2, 0) / d2, 1);
          setLine1(p1 < 1 ? scrambleAt(t1, p1) : t1);
          setLine2(p2 < 1 ? scrambleAt(t2, p2) : t2);
          if (p1 < 1 || p2 < 1) raf = requestAnimationFrame(frame);
          else resolve();
        };
        raf = requestAnimationFrame(frame);
        return () => cancelAnimationFrame(raf);
      });

    (async () => {
      if (prefersReducedMotion) {
        setLine1(t1);
        setLine2(t2);
        return;
      }

      // First cycle: SSR already shows the full phrase - hold, then morph.
      // Hover replays also decode (snappier 650ms via fastRef).
      if (!firstRun.current) {
        await waitVisible();
        if (cancelled) return;
        setBusy(true);
        await decode();
        setBusy(false);
        fastRef.current = false;
      }
      firstRun.current = false;

      await wait(HOLD_MS);
      await waitVisible();
      if (cancelled) return;
      setIndex((prev) => (prev + 1) % headlines.length);
    })();

    return () => {
      cancelled = true;
      clearTimeout(domainTimer);
    };
  }, [index, onDomainChange, prefersReducedMotion, replay]);

  const current = headlines[index];
  const domain = domainStyles[current.accent] ?? domainStyles.ai;

  return (
    <div ref={rootRef} className="relative">
      {/* Ambient glow removed — the domain color already reads through
         the gradient text, caret, and illustration; cleaner without it. */}

      <h1
        onPointerEnter={handleHover}
        className="relative [font-family:var(--font-jetbrains-mono),monospace] text-[2.1rem] font-bold uppercase leading-[0.96] tracking-[-0.045em] text-text-primary sm:text-5xl md:text-[2.5rem] lg:text-[3.6rem]"
        aria-live="polite"
        aria-label={`${current.line1} ${current.line2}`}
      >
        {/* Invisible sizer (longest phrase) keeps the heading height stable */}
        <span className="invisible block" aria-hidden>
          CYBERSECURITY
          <br />
          PROFESSIONAL
        </span>
        <span className="absolute inset-0 block" aria-hidden>
          <span className="block whitespace-nowrap leading-[0.96] [will-change:contents]">{line1}</span>
          <span
            className={`hero-gradient-animate ${domain.gradient} block whitespace-nowrap leading-[0.96] [will-change:contents]`}
          >
            {line2}
            <span
              className={`${busy ? "" : "hero-caret"} ml-[0.12em] inline-block h-[0.72em] w-[0.12em] rounded-[1px] align-baseline ${domain.caret}`}
            />
          </span>
        </span>
      </h1>
    </div>
  );
}

export type HeroLaunch = {
  name: string;
  href: string;
};

export function HomeHero({
  latestLaunch,
}: {
  latestLaunch?: HeroLaunch | null;
}) {
  const reduced = useReducedMotion();
  const launch: HeroLaunch = latestLaunch ?? hero.newLaunch;
  // Current headline domain, reported by the typewriter, drives the showcase.
  const [domain, setDomain] = useState<string>(headlines[0].accent);
  // Pause ambient CSS animations (ripple rings, ping dots) while the hero
  // is scrolled out of view — saves battery without any visual change.
  const sectionRef = useRef<HTMLElement | null>(null);
  useEffect(() => {
    const el = sectionRef.current;
    if (!el || typeof IntersectionObserver === "undefined") return;
    const observer = new IntersectionObserver(
      ([entry]) => {
        el.classList.toggle("hero-offscreen", !entry.isIntersecting);
      },
      { threshold: 0 }
    );
    observer.observe(el);
    return () => observer.disconnect();
  }, []);

  return (
    <section ref={sectionRef} className="px-2 pb-5 pt-6 sm:px-4 md:pt-7">
      {/* ── Upper row: signature (left) + portrait (center) + New launch (right) ── */}
      <div className="grid grid-cols-1 items-center gap-10 md:grid-cols-[1fr_auto_1fr] md:gap-6">
        <div className="flex flex-col items-center gap-5 text-center md:items-start md:self-start md:text-left">
          <motion.p
            variants={fadeUp}
            initial={reduced ? false : "hidden"}
            animate="show"
            custom={0}
            className="font-display text-5xl font-medium leading-[0.95] max-[374px]:text-[2.5rem] sm:text-6xl md:text-5xl lg:text-7xl"
          >
            <span className="block bg-gradient-to-t from-text-primary from-30% to-text-secondary bg-clip-text pb-[0.08em] text-transparent">
              {hero.firstName}
            </span>
            {hero.lastName && (
              <span className="block bg-gradient-to-t from-text-primary from-30% to-text-secondary bg-clip-text pb-[0.08em] text-transparent">
                {hero.lastName}
              </span>
            )}
          </motion.p>

          <motion.div
            variants={fadeUp}
            initial={reduced ? false : "hidden"}
            animate="show"
            custom={1}
            className="flex w-fit flex-col gap-4"
          >
            <div aria-hidden className="h-px w-full bg-border-primary" />
            <TaglineRotator />
          </motion.div>
        </div>


        {/* Circular portrait with concentric rings + sonar ripples */}
        <motion.div
          variants={fadeUp}
          initial={reduced ? false : "hidden"}
          animate="show"
          custom={1}
          className="order-first flex justify-center md:order-none"
        >
          <div className="relative">
            {/* Expanding water-wave rings */}
            <span
              aria-hidden
              className="absolute inset-0 rounded-full border border-border-primary motion-safe:animate-[hero-ripple_3.2s_ease-out_infinite]"
            />
            <span
              aria-hidden
              className="absolute inset-0 rounded-full border border-border-primary motion-safe:animate-[hero-ripple_3.2s_ease-out_1.6s_infinite]"
            />
            <div className="relative rounded-full border border-border-primary/70 p-2.5 sm:p-3">
              <div className="rounded-full border border-border-primary p-1.5 sm:p-2">
                <Image
                  src="/harisx404.png"
                  alt="Muhammad Haris"
                  width={144}
                  height={144}
                  priority
                  className="size-24 rounded-full object-cover sm:size-28 lg:size-[140px]"
                />
              </div>
            </div>
          </div>
        </motion.div>

        <div className="flex flex-col items-center text-center md:items-end md:self-start md:text-right">
          <motion.div
            variants={fadeUp}
            initial={reduced ? false : "hidden"}
            animate="show"
            custom={1}
            className="w-fit max-w-full px-2 md:max-w-xs md:px-0 md:-mr-2 lg:mr-0"
          >
            {/* Mobile: compact single-row notification pill */}
            <Link
              href={launch.href}
              className="group flex items-center gap-2.5 rounded-full border border-border-primary bg-bg-secondary/60 py-1.5 pl-2 pr-3 md:hidden"
            >
              <span className="flex shrink-0 items-center gap-1.5 rounded-full bg-blue-500/10 px-2.5 py-1">
                <span className="relative flex size-1.5 shrink-0" aria-hidden>
                  <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-blue-400 opacity-75 motion-reduce:animate-none" />
                  <span className="relative inline-flex size-1.5 rounded-full bg-blue-500" />
                </span>
                <span className="whitespace-nowrap font-mono text-[9px] uppercase tracking-widest text-blue-600 dark:text-blue-300">
                  New launch
                </span>
              </span>
              <span className="min-w-0 flex-1 truncate font-display text-base leading-none text-text-primary">
                {launch.name}
              </span>
              <ChevronRight
                className="size-3.5 shrink-0 text-text-secondary transition-transform group-hover:translate-x-0.5"
                aria-hidden
              />
            </Link>

            {/* md+: original stacked layout */}
            <Link
              href={launch.href}
              className="group hidden text-left md:block"
            >
              <span className="flex w-full items-center gap-3">
                <span className="relative flex size-1.5 shrink-0" aria-hidden>
                  <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-blue-400 opacity-75 motion-reduce:animate-none" />
                  <span className="relative inline-flex size-1.5 rounded-full bg-blue-500" />
                </span>
                <span className="whitespace-nowrap font-mono text-xs uppercase tracking-widest text-text-secondary">
                  New launch
                </span>
                <span
                  aria-hidden
                  className="mr-5 h-px min-w-[68px] flex-1 bg-border-primary lg:min-w-[80px]"
                />
              </span>
              <span className="mt-2.5 inline-block lg:mt-3">
                <span className="block font-display text-[26px] leading-tight text-text-primary md:text-[30px]">
                  {launch.name}
                </span>
                {/* Blue stroke that sweeps in on hover (per reference) */}
                <span
                  aria-hidden
                  className="mt-1 block h-[2px] w-full origin-left scale-x-0 rounded-full bg-gradient-to-r from-blue-500 via-blue-400/70 to-transparent opacity-0 transition-all duration-300 ease-out group-hover:scale-x-100 group-hover:opacity-100 motion-reduce:transition-none"
                />
              </span>
              <span className="mt-1.5 flex w-full items-center justify-between gap-3 lg:mt-2">
                <span className="font-mono text-xs uppercase tracking-widest text-text-secondary">
                  {hero.newLaunch.subline}
                </span>
                <span className="flex size-5 shrink-0 items-center justify-center rounded-full border border-border-primary text-text-secondary transition-colors group-hover:bg-text-primary group-hover:text-bg-primary">
                  <ArrowUpRight className="size-2.5" aria-hidden />
                </span>
              </span>
            </Link>
          </motion.div>
        </div>
      </div>

      {/* ── Full-width divider between the hero's upper and lower rows ── */}
      <motion.div
        variants={fadeUp}
        initial={reduced ? false : "hidden"}
        animate="show"
        custom={2}
        aria-hidden
        className="-mx-2 mb-5 mt-7 h-px bg-border-primary sm:-mx-4"
      />

      {/* ── Lower row: typewriter (left) + showcase window (right) ── */}
      <div className="grid grid-cols-1 items-center gap-12 md:grid-cols-2 md:gap-6">
        <motion.div
          variants={fadeUp}
          initial={reduced ? false : "hidden"}
          animate="show"
          custom={3}
          className="flex justify-center text-center md:justify-start md:text-left"
        >
          <HeadlineRotator onDomainChange={setDomain} />
        </motion.div>

        <motion.div
          variants={fadeUp}
          initial={reduced ? false : "hidden"}
          animate="show"
          custom={4}
          className="flex w-full justify-center md:justify-end"
        >
          <DomainShowcase domain={domain} />
        </motion.div>
      </div>
    </section>
  );
}
