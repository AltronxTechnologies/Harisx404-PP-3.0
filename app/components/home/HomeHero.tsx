"use client";

import Image from "next/image";
import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
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

  useEffect(() => {
    const timer = setInterval(
      () => setIndex((prev) => (prev + 1) % statusLines.length),
      3000
    );
    return () => clearInterval(timer);
  }, []);

  return (
    <div
      className="flex items-center gap-2.5 font-mono text-[11px] uppercase tracking-[0.22em] text-text-secondary lg:text-[13px] lg:tracking-[0.28em]"
      aria-live="polite"
    >
      {/* Dot lives outside the clipped rotator so its ping ring never cuts */}
      <span aria-hidden className="relative flex size-1.5 shrink-0">
        <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-emerald-400 opacity-75" />
        <span className="relative inline-flex size-1.5 rounded-full bg-emerald-500" />
      </span>
      <div className="relative h-5 w-[250px] overflow-hidden lg:h-6 lg:w-[314px]">
        <AnimatePresence mode="wait">
          <motion.span
            key={statusLines[index]}
            initial={{ opacity: 0, y: 14 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -14 }}
            transition={{ duration: 0.35, ease: "easeOut" }}
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

const DECODE_GLYPHS = "ABCDEFGHIJKLMNOPQRSTUVWXYZ<>/[]{}#$%&*+=";
const FRAME_MS = 28;
const FRAMES_PER_CHAR = 3;
const HOLD_MS = 2600;

const wait = (ms: number) => new Promise((r) => setTimeout(r, ms));
const randGlyph = () =>
  DECODE_GLYPHS[Math.floor(Math.random() * DECODE_GLYPHS.length)];

/* Matrix-style decode (per the reference site): every character cycles
   through random glyphs, then locks into place left-to-right. Phrases
   morph directly into each other - no blank state. First paint is the
   full first phrase (SSR/SEO safe). */
function HeadlineRotator({
  onDomainChange,
}: {
  onDomainChange?: (accent: string) => void;
}) {
  const [index, setIndex] = useState(0);
  const [line1, setLine1] = useState<string>(headlines[0].line1);
  const [line2, setLine2] = useState<string>(headlines[0].line2);
  const [busy, setBusy] = useState(false);
  const firstRun = useRef(true);

  useEffect(() => {
    let cancelled = false;
    const t1 = headlines[index].line1;
    const t2 = headlines[index].line2;
    onDomainChange?.(headlines[index].accent);

    const reduced = window.matchMedia(
      "(prefers-reduced-motion: reduce)"
    ).matches;

    /* Decode both lines simultaneously toward their targets. */
    const decode = async () => {
      const len = Math.max(t1.length, t2.length);
      const totalFrames = len * FRAMES_PER_CHAR + 4;
      for (let f = 0; f <= totalFrames; f++) {
        if (cancelled) return;
        const locked = Math.floor(f / FRAMES_PER_CHAR);
        const scramble = (target: string) =>
          target
            .split("")
            .map((ch, i) => {
              if (ch === " ") return " ";
              if (i < locked) return ch;
              return randGlyph();
            })
            .join("");
        setLine1(scramble(t1));
        setLine2(scramble(t2));
        await wait(FRAME_MS);
      }
      setLine1(t1);
      setLine2(t2);
    };

    (async () => {
      if (reduced) {
        setLine1(t1);
        setLine2(t2);
        await wait(4200);
        if (!cancelled) setIndex((prev) => (prev + 1) % headlines.length);
        return;
      }

      // First cycle: SSR already shows the full phrase - hold, then morph.
      if (!firstRun.current) {
        setBusy(true);
        await decode();
        setBusy(false);
      }
      firstRun.current = false;

      await wait(HOLD_MS);
      if (cancelled) return;
      setIndex((prev) => (prev + 1) % headlines.length);
    })();

    return () => {
      cancelled = true;
    };
  }, [index]);

  const current = headlines[index];
  const domain = domainStyles[current.accent] ?? domainStyles.ai;

  return (
    <div className="relative">
      {/* Ambient glow that breathes in the current domain color */}
      <AnimatePresence mode="wait">
        <motion.div
          key={`glow-${current.accent}`}
          initial={{ opacity: 0, scale: 0.85 }}
          animate={{ opacity: 1, scale: 1 }}
          exit={{ opacity: 0, scale: 1.1 }}
          transition={{ duration: 1.1, ease: "easeInOut" }}
          aria-hidden
          className={`pointer-events-none absolute -inset-x-10 -inset-y-8 -z-10 rounded-full blur-3xl ${domain.glow}`}
        />
      </AnimatePresence>

      <h1
        className="relative font-grotesk text-[2.5rem] font-bold uppercase leading-[1.04] tracking-tight text-text-primary sm:text-6xl md:text-[2.85rem] lg:text-[4.25rem]"
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
          <span className="block whitespace-nowrap leading-[1.04]">{line1}</span>
          <span
            className={`hero-gradient-animate ${domain.gradient} block whitespace-nowrap leading-[1.04]`}
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
            initial="hidden"
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
            initial="hidden"
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
          initial="hidden"
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
            initial="hidden"
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
                  <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-blue-400 opacity-75" />
                  <span className="relative inline-flex size-1.5 rounded-full bg-blue-500" />
                </span>
                <span className="whitespace-nowrap font-mono text-[9px] uppercase tracking-[0.18em] text-blue-600 dark:text-blue-300">
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
                  <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-blue-400 opacity-75" />
                  <span className="relative inline-flex size-1.5 rounded-full bg-blue-500" />
                </span>
                <span className="whitespace-nowrap font-mono text-[10px] uppercase tracking-[0.25em] text-text-secondary lg:text-[11px]">
                  New launch
                </span>
                <span
                  aria-hidden
                  className="mr-5 h-px min-w-[68px] flex-1 bg-border-primary lg:min-w-[80px]"
                />
              </span>
              <span className="mt-2.5 inline-block lg:mt-3">
                <span className="block font-display text-[26px] leading-tight text-text-primary md:text-[32px] lg:text-4xl">
                  {launch.name}
                </span>
                {/* Blue stroke that sweeps in on hover (per reference) */}
                <span
                  aria-hidden
                  className="mt-1 block h-[2px] w-full origin-left scale-x-0 rounded-full bg-gradient-to-r from-blue-500 via-blue-400/70 to-transparent opacity-0 transition-all duration-300 ease-out group-hover:scale-x-100 group-hover:opacity-100"
                />
              </span>
              <span className="mt-1.5 flex w-full items-center justify-between gap-3 lg:mt-2">
                <span className="font-mono text-[11px] uppercase tracking-widest text-text-tertiary lg:text-xs">
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
        initial="hidden"
        animate="show"
        custom={2}
        aria-hidden
        className="-mx-2 mb-5 mt-7 h-px bg-border-primary sm:-mx-4"
      />

      {/* ── Lower row: typewriter (left) + showcase window (right) ── */}
      <div className="grid grid-cols-1 items-center gap-12 md:grid-cols-2 md:gap-6">
        <motion.div
          variants={fadeUp}
          initial="hidden"
          animate="show"
          custom={3}
          className="flex justify-center text-center md:justify-start md:text-left"
        >
          <HeadlineRotator onDomainChange={setDomain} />
        </motion.div>

        <motion.div
          variants={fadeUp}
          initial="hidden"
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
