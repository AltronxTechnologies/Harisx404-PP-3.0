"use client";

import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import { motion, useInView, useReducedMotion } from "framer-motion";
import { ArrowUpRight } from "lucide-react";
import { siteContent } from "@/app/data/site-content";

const writingFallback = siteContent.statusRow.find((c) => c.label === "Writing");
const clockCell = siteContent.statusRow.find((c) => c.label === "Local time");

/* Ticking clock (with seconds — the "alive" detail). Renders a stable
   placeholder on the server and hydrates into live time. */
function LiveClock({ timeZone }: { timeZone: string }) {
  const [now, setNow] = useState<Date | null>(null);

  useEffect(() => {
    const desktop = window.matchMedia("(min-width: 1024px)");
    let timer: ReturnType<typeof setInterval> | null = null;
    const sync = () => {
      if (timer) clearInterval(timer);
      timer = null;
      if (desktop.matches) {
        setNow(new Date());
        timer = setInterval(() => setNow(new Date()), 1000);
      }
    };
    sync();
    desktop.addEventListener("change", sync);
    return () => {
      desktop.removeEventListener("change", sync);
      if (timer) clearInterval(timer);
    };
  }, []);

  let time = "--:--:--";
  let zone = "";
  if (now) {
    try {
      time = new Intl.DateTimeFormat("en-US", {
        timeZone,
        hour: "2-digit",
        minute: "2-digit",
        second: "2-digit",
        hour12: true,
      }).format(now);
      zone =
        new Intl.DateTimeFormat("en-US", { timeZone, timeZoneName: "short" })
          .formatToParts(now)
          .find((p) => p.type === "timeZoneName")?.value ?? "";
    } catch {
      time = now.toLocaleTimeString();
    }
  }

  return (
    <>
      <span className="tabular-nums">{time}</span>
      {zone && (
        <span className="ml-1.5 font-mono text-[10px] uppercase tracking-widest text-text-secondary">
          {zone}
        </span>
      )}
    </>
  );
}

/* Live stats computed on the server (page.tsx) from the same Supabase
   data the rest of the homepage uses. Every field is optional — the
   strip falls back to the static site-content copy when offline. */
export type StatusRowData = {
  /** Total published projects — drives the count-up. */
  projectCount?: number;
  /** Projects bucketed into the three hero domains. */
  domainCounts?: { web: number; cyber: number; ai: number };
  /** Latest published post title. */
  latestPostTitle?: string;
  /** e.g. "2 min read · Jul 2026" (kept for API compat). */
  latestPostMeta?: string;
  /** Deep link to the latest post. */
  latestPostHref?: string;
};

/* Counts 0 → n the first time the bar scrolls into view. */
function CountUp({ to, pad = 2 }: { to: number; pad?: number }) {
  const ref = useRef<HTMLSpanElement | null>(null);
  const inView = useInView(ref, { once: true, margin: "-40px" });
  const [value, setValue] = useState(0);
  const reduced = useReducedMotion();

  useEffect(() => {
    if (!inView) return;
    if (reduced) {
      setValue(to);
      return;
    }
    let raf: number;
    const start = performance.now();
    const duration = 900;
    const tick = (t: number) => {
      const p = Math.min(1, (t - start) / duration);
      // easeOutCubic — fast start, gentle landing on the final number.
      setValue(Math.round(to * (1 - Math.pow(1 - p, 3))));
      if (p < 1) raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [inView, reduced, to]);

  return (
    <span ref={ref} className="tabular-nums">
      {String(value).padStart(pad, "0")}
    </span>
  );
}

/* Tiny domain chip: colored dot + count-up number + name. Colors mirror
   the hero headline domains (web=emerald, cyber=sky, ai=violet). */
function DomainChip({
  dot,
  count,
  name,
  shortName,
}: {
  dot: string;
  count: number;
  name: string;
  shortName?: string;
}) {
  return (
    <span className="inline-flex items-center gap-1 whitespace-nowrap transition-colors group-hover:text-text-primary sm:gap-1.5">
      <span className={`h-1.5 w-1.5 rounded-full ${dot}`} aria-hidden />
      <CountUp to={count} />{" "}
      {shortName ? (
        <>
          <span className="sm:hidden">{shortName}</span>
          <span className="hidden sm:inline">{name}</span>
        </>
      ) : (
        name
      )}
    </span>
  );
}

/* Stacked domain bar — a slim data-viz strip whose colored segments
   grow proportionally to each domain's share when scrolled into view. */
function DomainBar({
  domains,
}: {
  domains: { web: number; cyber: number; ai: number };
}) {
  const reduced = useReducedMotion();
  const ref = useRef<HTMLDivElement | null>(null);
  const inView = useInView(ref, { once: true, margin: "-40px" });
  const total = Math.max(1, domains.web + domains.cyber + domains.ai);
  const segments = [
    { count: domains.web, color: "bg-emerald-500", delay: 0 },
    { count: domains.cyber, color: "bg-sky-500", delay: 0.12 },
    { count: domains.ai, color: "bg-violet-500", delay: 0.24 },
  ].filter((s) => s.count > 0);

  return (
    <div
      ref={ref}
      aria-hidden
      className="flex h-1 w-full min-w-[48px] items-stretch gap-px self-center overflow-hidden rounded-full bg-border-primary/60"
    >
      {segments.map((s, i) => (
        <motion.span
          key={i}
          initial={reduced ? false : { flexGrow: 0.0001 }}
          animate={inView ? { flexGrow: s.count / total } : {}}
          transition={
            reduced
              ? { duration: 0 }
              : { duration: 0.9, delay: 0.15 + s.delay, ease: [0.22, 1, 0.36, 1] }
          }
          className={`${s.color} min-w-0`}
        />
      ))}
    </div>
  );
}

/* One segment of the stats bar: mono micro-label with a colored pulsing
   dot on top, a strong value beneath, and a corner arrow on hover. */
function Segment({
  href,
  label,
  dot,
  ping,
  hoverGlow,
  className = "",
  labelExtra,
  children,
}: {
  href: string;
  label: string;
  dot: string;
  ping?: string;
  hoverGlow: string;
  className?: string;
  labelExtra?: React.ReactNode;
  children: React.ReactNode;
}) {
  return (
    <Link
      href={href}
      className={`group relative flex min-h-[44px] min-w-0 flex-col justify-center gap-1 overflow-hidden px-4 py-3.5 transition-colors sm:px-6 md:items-center md:py-4 ${hoverGlow} ${className}`}
    >
      <ArrowUpRight
        aria-hidden
        className="absolute right-3 top-3 h-3.5 w-3.5 text-text-tertiary opacity-0 transition-all duration-300 group-hover:translate-x-0 group-hover:opacity-70 md:-translate-x-1"
      />
      <span className="flex items-center gap-2">
        <span className="relative flex h-1.5 w-1.5 shrink-0" aria-hidden>
          {ping && (
            <span
              className={`absolute inline-flex h-full w-full animate-ping rounded-full opacity-60 motion-reduce:animate-none ${ping}`}
            />
          )}
          <span className={`relative inline-flex h-1.5 w-1.5 rounded-full ${dot}`} />
        </span>
        <span className="whitespace-nowrap font-mono text-[10px] uppercase tracking-widest text-text-secondary">
          {label}
        </span>
        {labelExtra}
      </span>
      <span className="flex min-w-0 max-w-full items-baseline gap-x-3 text-[15px] font-medium leading-snug text-text-primary">
        {children}
      </span>
    </Link>
  );
}

/* ── Live stats bar ────────────────────────────────────────────────────
   Desktop (lg+): three equal full-width cells — local time · projects ·
   latest write-up — each with centered content. Tablet (md): two equal
   cells (no clock). Mobile: stacked rows. Explicit borders (not divide-*)
   so the hidden clock never leaves a stray separator. The Shipped cell
   uses an internal grid so the domain bar aligns exactly with the chips
   row beneath it. */
export function StatusRow({ data }: { data?: StatusRowData }) {
  const reduced = useReducedMotion();
  const total = data?.projectCount ?? 3;
  const domains = data?.domainCounts ?? { web: 1, cyber: 1, ai: 1 };

  return (
    <motion.section
      initial={false}
      whileInView={reduced ? undefined : { opacity: 1, y: 0 }}
      viewport={{ once: true, margin: "-60px" }}
      transition={reduced ? { duration: 0 } : { duration: 0.55, ease: "easeOut" }}
      aria-label="Current status"
      className="grid grid-cols-1 border-y border-border-primary md:grid-cols-[auto_1fr] lg:grid-cols-[1fr_auto_1fr]"
    >
      {/* LOCAL TIME — slim lg+-only column, live seconds tick */}
      {clockCell && (
        <Segment
          href={clockCell.href}
          label={clockCell.label}
          dot="bg-pink-500"
          ping="bg-pink-400"
          hoverGlow="hover:bg-pink-500/[0.04]"
          className="hidden lg:flex"
        >
          <LiveClock timeZone={clockCell.title} />
        </Segment>
      )}

      {/* SHIPPED — internal grid keeps the domain bar flush with the
          chips row: bar starts where "Web" starts and ends where "AI"
          ends, on every screen size. */}
      <Link
        href="/projects"
        className="group relative flex min-h-[44px] min-w-0 items-center overflow-hidden px-4 py-3.5 transition-colors hover:bg-orange-500/[0.04] sm:px-6 md:justify-center md:py-4 lg:border-l lg:border-border-primary"
      >
        <ArrowUpRight
          aria-hidden
          className="absolute right-3 top-3 h-3.5 w-3.5 text-text-tertiary opacity-0 transition-all duration-300 group-hover:translate-x-0 group-hover:opacity-70 md:-translate-x-1"
        />
        <span className="grid grid-cols-[auto_auto] items-center gap-x-3 gap-y-2 sm:gap-x-4 sm:gap-y-1">
          {/* row 1 · col 1 — label */}
          <span className="flex items-center gap-2">
            <span className="relative flex h-1.5 w-1.5 shrink-0" aria-hidden>
              <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-orange-400 opacity-60 motion-reduce:animate-none" />
              <span className="relative inline-flex h-1.5 w-1.5 rounded-full bg-orange-500" />
            </span>
            <span className="whitespace-nowrap font-mono text-[10px] uppercase tracking-widest text-text-secondary">
              Shipped
            </span>
          </span>
          {/* row 1 · col 2 — bar spans exactly the chips column below */}
          <DomainBar domains={domains} />
          {/* row 2 · col 1 — count-up total */}
          <span className="whitespace-nowrap text-[15px] font-medium leading-snug text-text-primary">
            <CountUp to={total} /> {total === 1 ? "Project" : "Projects"}
          </span>
          {/* row 2 · col 2 — domain chips; their width defines the bar's */}
          <span className="inline-flex w-fit items-center gap-x-2 whitespace-nowrap text-[11px] font-normal text-text-secondary sm:gap-x-3 sm:text-xs">
            <DomainChip dot="bg-emerald-500" count={domains.web} name="Web" />
            <span aria-hidden className="h-3 w-px shrink-0 bg-border-primary" />
            <DomainChip
              dot="bg-sky-500"
              count={domains.cyber}
              name="Cybersecurity"
              shortName="Cyber"
            />
            <span aria-hidden className="h-3 w-px shrink-0 bg-border-primary" />
            <DomainChip dot="bg-violet-500" count={domains.ai} name="AI" />
          </span>
        </span>
      </Link>

      {/* LATEST WRITE-UP — real post title, truncates, never wraps */}
      <Segment
        href={data?.latestPostHref ?? writingFallback?.href ?? "/blog"}
        label="Latest write-up"
        dot="bg-blue-500"
        hoverGlow="hover:bg-blue-500/[0.04]"
        className="border-t border-border-primary md:border-l md:border-t-0"
      >
        <span className="min-w-0 truncate">
          {data?.latestPostTitle ?? writingFallback?.title ?? "Engineering reads"}
        </span>
      </Segment>
    </motion.section>
  );
}
