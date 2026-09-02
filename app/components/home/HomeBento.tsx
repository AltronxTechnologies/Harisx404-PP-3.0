"use client";

import React, { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { motion, useInView } from "framer-motion";
import clsx from "clsx";
import createGlobe from "cobe";
import { FileText, FolderGit2, MessagesSquare, Quote } from "lucide-react";
import { BentoCard } from "../BentoCard";
import { SectionHeading } from "./SectionHeading";

/* Shared recessed tile (frame + inset panel) used across cards */
function RecessedTile({
  sizeClass,
  children,
  className = "",
}: {
  sizeClass: string;
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <div
      className={clsx(
        "rounded-[20px] border border-border-primary p-1.5 transition-all duration-300 motion-reduce:transition-none sm:p-2",
        sizeClass,
        className
      )}
    >
      <div
        className="grid h-full place-items-center rounded-xl border-2 border-[#A5AEB81F]/10 bg-[#EDEEF0] dark:bg-white/5"
        style={{ boxShadow: "0px 2px 1.5px 0px #A5AEB852 inset" }}
      >
        {children}
      </div>
    </div>
  );
}

/* ── 1. Around-the-web accounts card ─────────────────────────── */
/* ✏️ EDIT HERE: your profiles — each tile opens the real account.
   Icons render as CSS masks: neutral gray at rest, exact brand color
   on hover (`brand` / `brandDark` for near-black marks in dark mode). */
const accountItems = [
  {
    title: "TryHackMe",
    href: "https://tryhackme.com/p/harisx404",
    src: "https://cdn.jsdelivr.net/npm/simple-icons@v13/icons/tryhackme.svg",
    brand: "#c11c1c",
    brandDark: "#ff4d4d",
  },
  {
    title: "LinkedIn",
    href: "https://www.linkedin.com/in/harisx404/",
    src: "https://cdn.jsdelivr.net/gh/devicons/devicon/icons/linkedin/linkedin-plain.svg",
    brand: "#0A66C2",
    brandDark: "#3b9df8",
  },
  {
    title: "GitHub",
    href: "https://github.com/harisx404",
    src: "https://cdn.jsdelivr.net/npm/simple-icons@v13/icons/github.svg",
    brand: "#181717",
    brandDark: "#ffffff",
  },
  {
    title: "Credly",
    href: "https://www.credly.com/users/harisx404",
    src: "https://cdn.jsdelivr.net/npm/simple-icons@v13/icons/credly.svg",
    brand: "#FF6B00",
    brandDark: "#ff8534",
  },
  {
    title: "X",
    href: "https://x.com/harisx404",
    src: "https://cdn.jsdelivr.net/npm/simple-icons@v13/icons/x.svg",
    brand: "#000000",
    brandDark: "#ffffff",
  },
];

export function AccountsBento() {
  return (
    <BentoCard height="h-auto sm:h-[240px] lg:h-[220px]">
      <div className="z-20 text-center">
        <h3 className="text-base font-medium text-text-primary">
          Learn more about me
        </h3>
        <p className="mt-1 text-sm text-text-secondary md:text-base">
          One handle everywhere —{" "}
          <span className="font-mono text-text-primary">harisx404</span>
        </p>
      </div>
      <div className="z-20 mt-4 flex flex-1 items-start justify-center gap-2 sm:mt-5 sm:gap-3">
        {accountItems.map((item, index) => (
          <a
            key={item.title}
            href={item.href}
            target="_blank"
            rel="noopener noreferrer"
            title={`${item.title} — @harisx404`}
            aria-label={`${item.title} profile`}
            className="group/acct inline-block text-center"
            style={
              {
                "--brand": item.brand,
                "--brand-dark": item.brandDark,
              } as React.CSSProperties
            }
          >
            <RecessedTile
              sizeClass={clsx(
                index === 2
                  ? "h-16 w-16 sm:h-[84px] sm:w-[84px]"
                  : "h-14 w-14 sm:h-[72px] sm:w-[72px]"
              )}
              className="group-hover/acct:-translate-y-2 group-hover/acct:border-neutral-400 motion-reduce:group-hover/acct:translate-y-0 dark:group-hover/acct:border-white/30"
            >
              {/* Brand mark as a mask → gray at rest, true brand color on hover.
                  Decorative: the parent <a> already carries the label. */}
              <span
                aria-hidden
                className="h-6 w-6 bg-neutral-600 transition-colors duration-300 ease-out group-hover/acct:bg-[var(--brand)] motion-reduce:transition-none dark:bg-neutral-300 dark:group-hover/acct:bg-[var(--brand-dark)] sm:h-7 sm:w-7"
                style={{
                  WebkitMaskImage: `url(${item.src})`,
                  maskImage: `url(${item.src})`,
                  WebkitMaskRepeat: "no-repeat",
                  maskRepeat: "no-repeat",
                  WebkitMaskPosition: "center",
                  maskPosition: "center",
                  WebkitMaskSize: "contain",
                  maskSize: "contain",
                }}
              />
            </RecessedTile>
            {/* Handle reveals under the tile on hover */}
            <span className="mt-1.5 block font-mono text-[10px] uppercase tracking-widest text-text-secondary opacity-0 transition-all duration-300 group-hover/acct:opacity-100 motion-reduce:transition-none">
              {item.title}
            </span>
          </a>
        ))}
      </div>
    </BentoCard>
  );
}

/* Shared count-up value — animates 0 → n the first time it scrolls
   into view; honors prefers-reduced-motion. */
function CountUpValue({ to, pad = 2 }: { to: number; pad?: number }) {
  const ref = useRef<HTMLSpanElement | null>(null);
  const inView = useInView(ref, { once: true, margin: "-40px" });
  const [value, setValue] = useState(0);

  useEffect(() => {
    if (!inView) return;
    /* honor reduced motion — jump straight to the final value */
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
      setValue(to);
      return;
    }
    let raf: number;
    const start = performance.now();
    const duration = 1100;
    const tick = (t: number) => {
      const p = Math.min(1, (t - start) / duration);
      setValue(Math.round(to * (1 - Math.pow(1 - p, 3))));
      if (p < 1) raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [inView, to]);

  return (
    <span ref={ref} className="tabular-nums">
      {String(value).padStart(pad, "0")}
    </span>
  );
}

/* ── 2. Globe card — 60fps WebGL globe (cobe) with labelled city
       markers + connection arcs; the whole card links to /contact. ── */

/* ✏️ EDIT HERE: labelled tech/freelance hubs — pill tags track these
   on the globe; every one is connected to home base with an arc. */
const GLOBE_LABELS: { name: string; location: [number, number] }[] = [
  { name: "LAHORE", location: [31.5497, 74.3436] }, // home base
  { name: "SAN FRANCISCO", location: [37.7749, -122.4194] },
  { name: "NEW YORK", location: [40.7128, -74.006] },
  { name: "TORONTO", location: [43.6532, -79.3832] },
  { name: "LONDON", location: [51.5074, -0.1278] },
  { name: "BERLIN", location: [52.52, 13.405] },
  { name: "DUBAI", location: [25.2048, 55.2708] },
  { name: "SINGAPORE", location: [1.3521, 103.8198] },
  { name: "TOKYO", location: [35.6762, 139.6503] },
  { name: "SYDNEY", location: [-33.8688, 151.2093] },
];

const slugify = (s: string) => s.toLowerCase().replace(/[^a-z0-9]+/g, "-");

const GLOBE_MARKERS: {
  location: [number, number];
  size: number;
  id: string;
}[] = GLOBE_LABELS.map((c, i) => ({
  location: c.location,
  size: i === 0 ? 0.05 : 0.028,
  id: slugify(c.name),
}));

/* Indigo arcs from home base out to every labelled city; the color is
   set theme-aware via cobe's global `arcColor` option. */
const GLOBE_ARCS = GLOBE_LABELS.slice(1).map((c) => ({
  from: GLOBE_LABELS[0].location,
  to: c.location,
}));

/* Projects lat/lng onto the rendered sphere so HTML labels stay glued
   to their markers while the globe spins. This mirrors cobe's own
   internal projection exactly (its `U` + `O` functions), so labels are
   pixel-locked to the WebGL marker dots. Returns canvas-relative x/y
   plus depth z (z > 0 → facing the viewer). */
const RAD = Math.PI / 180;
function projectCity(
  lat: number,
  lng: number,
  phi: number,
  theta: number,
  size: number
) {
  // cobe's U(): lat/lng → unit-sphere vec3
  const rl = lat * RAD;
  const a = lng * RAD - Math.PI;
  const t0 = -Math.cos(rl) * Math.cos(a);
  const t1 = Math.sin(rl);
  const t2 = Math.cos(rl) * Math.sin(a);
  // cobe's O(): rotate by phi (Y) and theta (X), project to screen
  const cT = Math.cos(theta);
  const sT = Math.sin(theta);
  const cP = Math.cos(phi);
  const sP = Math.sin(phi);
  const c = cP * t0 + sP * t2;
  const s = sP * sT * t0 + cT * t1 - cP * sT * t2;
  const depth = -sP * cT * t0 + sT * t1 + cP * cT * t2;
  return {
    x: ((c + 1) / 2) * size,
    y: ((-s + 1) / 2) * size,
    z: depth,
  };
}

/** Tracks the site's `dark` class so the globe re-renders with matching
    colors the instant the theme toggle flips. */
function useIsDark() {
  const [isDark, setIsDark] = useState(false);
  useEffect(() => {
    const root = document.documentElement;
    const update = () => setIsDark(root.classList.contains("dark"));
    update();
    const observer = new MutationObserver(update);
    observer.observe(root, { attributes: true, attributeFilter: ["class"] });
    return () => observer.disconnect();
  }, []);
  return isDark;
}

const GLOBE_THETA = 0.28;

function GlobeBento() {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const labelRefs = useRef<(HTMLSpanElement | null)[]>([]);
  const anchorsRef = useRef<Record<string, HTMLDivElement> | null>(null);
  const isDark = useIsDark();
  /* Rotation state lives in refs so pointer drags & the render loop never
     trigger React re-renders — this is what keeps it at a locked 60fps. */
  const phiRef = useRef(0);
  const pointerRef = useRef<{
    down: boolean;
    x: number;
    delta: number;
    dragged: boolean;
  }>({ down: false, x: 0, delta: 0, dragged: false });

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    /* anchors belong to one globe instance — never reuse across re-creates */
    anchorsRef.current = null;

    let width = 0;
    const onResize = () => {
      width = canvas.offsetWidth;
    };
    onResize();
    window.addEventListener("resize", onResize);

    const globe = createGlobe(canvas, {
      devicePixelRatio: 2,
      width: width * 2,
      height: width * 2,
      phi: 0,
      theta: GLOBE_THETA,
      dark: isDark ? 1 : 0,
      diffuse: 1.2,
      mapSamples: 18000,
      /* Dark mode: brighter dot-matrix + lighter base so the continents
         read crisply against the card instead of sinking into it. */
      mapBrightness: isDark ? 6.2 : 7.2,
      baseColor: isDark ? [0.36, 0.38, 0.5] : [0.94, 0.94, 0.98],
      markerColor: isDark ? [0.55, 0.58, 1] : [0.39, 0.4, 0.95], // indigo accent
      glowColor: isDark ? [0.14, 0.15, 0.26] : [0.88, 0.89, 0.98],
      markers: GLOBE_MARKERS,
      arcs: GLOBE_ARCS,
      arcColor: isDark ? [0.55, 0.58, 1] : [0.39, 0.4, 0.95],
      arcWidth: 0.22,
      arcHeight: 0.4,
    });
    /* cobe v2 has no onRender — drive the 60fps spin with our own rAF
       loop; refs keep this loop free of React re-renders. City labels
       are repositioned in the same frame via direct style writes
       (transform + opacity only → compositor work, no layout). */
    let raf = 0;
    /* Pause the whole render loop while the card is off-screen — zero
       CPU/GPU cost during the rest of the page, instant resume on scroll. */
    let visible = true;
    const spin = () => {
      if (!visible) return;
      if (!pointerRef.current.down && !reduce) phiRef.current += 0.0038;
      const phi = phiRef.current + pointerRef.current.delta;
      globe.update({ phi, width: width * 2, height: width * 2 });
      /* cobe writes each marker's exact screen position onto tiny anchor
         divs (one per marker id). Read those back so labels are pinned
         pixel-perfectly to the WebGL dots — no math drift possible. */
      if (!anchorsRef.current) {
        const wrap = canvas.parentElement;
        if (wrap) {
          const found: Record<string, HTMLDivElement> = {};
          wrap.querySelectorAll<HTMLDivElement>("div").forEach((d) => {
            const m = d.style.cssText.match(/anchor-name:\s*--cobe-([a-z0-9-]+)/);
            if (m) found[m[1]] = d;
          });
          if (GLOBE_MARKERS.every((mk) => found[mk.id]))
            anchorsRef.current = found;
        }
      }
      for (let i = 0; i < GLOBE_LABELS.length; i++) {
        const el = labelRefs.current[i];
        if (!el) continue;
        const [lat, lng] = GLOBE_LABELS[i].location;
        /* depth from cobe-exact math → smooth fade at the horizon */
        const p = projectCity(lat, lng, phi, GLOBE_THETA, width);
        const anchor = anchorsRef.current?.[GLOBE_MARKERS[i].id];
        const x = anchor ? (parseFloat(anchor.style.left) / 100) * width : p.x;
        const y = anchor ? (parseFloat(anchor.style.top) / 100) * width : p.y;
        el.style.transform = `translate3d(${x}px, ${y}px, 0) translate(-50%, -100%)`;
        el.style.opacity = String(Math.max(0, Math.min(1, (p.z - 0.12) / 0.25)));
      }
      raf = requestAnimationFrame(spin);
    };
    raf = requestAnimationFrame(spin);
    const io = new IntersectionObserver(
      ([entry]) => {
        const wasVisible = visible;
        visible = entry.isIntersecting;
        if (!wasVisible && visible) raf = requestAnimationFrame(spin);
      },
      { rootMargin: "120px" }
    );
    io.observe(canvas);
    /* Fade in once the first frame is painted — avoids a flash of empty canvas */
    requestAnimationFrame(() => {
      canvas.style.opacity = "1";
    });

    return () => {
      cancelAnimationFrame(raf);
      io.disconnect();
      globe.destroy();
      window.removeEventListener("resize", onResize);
    };
  }, [isDark]);

  return (
    <BentoCard linkTo="/contact" height="h-[300px]">
      <div className="z-20 text-center">
        <h3 className="text-base font-medium text-text-primary">
          Open to work — worldwide
        </h3>
        <p className="mt-1 text-sm text-text-secondary md:text-base">
          Remote from Pakistan, shipping across every timezone.
        </p>
      </div>
      {/* Globe sits half-cropped at the card's bottom edge — the classic
          bento treatment. Pointer-drag spins it; it self-rotates at 60fps. */}
      <div className="absolute inset-x-0 -bottom-[150px] z-10 mx-auto aspect-square w-[320px] sm:-bottom-[190px] sm:w-[400px]">
        <canvas
          ref={canvasRef}
          className="size-full opacity-0 transition-opacity duration-700 [contain:layout_paint_size]"
          onPointerDown={(e) => {
            pointerRef.current.down = true;
            pointerRef.current.dragged = false;
            pointerRef.current.x = e.clientX;
            /* keep receiving moves even if the finger/cursor leaves the canvas */
            e.currentTarget.setPointerCapture(e.pointerId);
            e.preventDefault();
          }}
          onPointerMove={(e) => {
            if (!pointerRef.current.down) return;
            pointerRef.current.delta = (e.clientX - pointerRef.current.x) / 120;
            if (Math.abs(e.clientX - pointerRef.current.x) > 4)
              pointerRef.current.dragged = true;
          }}
          onPointerUp={() => {
            pointerRef.current.down = false;
            phiRef.current += pointerRef.current.delta;
            pointerRef.current.delta = 0;
          }}
          onPointerCancel={() => {
            /* touch gesture taken over by the browser (e.g. page scroll) —
               release the drag so auto-rotation resumes */
            pointerRef.current.down = false;
            phiRef.current += pointerRef.current.delta;
            pointerRef.current.delta = 0;
          }}
          onPointerLeave={() => {
            if (!pointerRef.current.down) return;
            pointerRef.current.down = false;
            phiRef.current += pointerRef.current.delta;
            pointerRef.current.delta = 0;
          }}
          onClick={(e) => {
            /* spinning the globe shouldn't navigate the card's link */
            if (pointerRef.current.dragged) {
              e.preventDefault();
              e.stopPropagation();
              pointerRef.current.dragged = false;
            }
          }}
          style={{ cursor: "grab", touchAction: "pan-y" }}
        />
        {/* City label pills — positions written each frame by the rAF loop.
            The wrapper's bottom-center sits exactly on the marker dot; a
            short stem points from the pill down to the dot. */}
        <div className="pointer-events-none absolute inset-0 overflow-visible">
          {GLOBE_LABELS.map((city, i) => (
            <span
              key={city.name}
              ref={(el) => {
                labelRefs.current[i] = el;
              }}
              className="absolute left-0 top-0 z-20 flex flex-col items-center will-change-transform"
              style={{ opacity: 0 }}
            >
              <span className="whitespace-nowrap rounded-[4px] bg-[#1d2445] px-1.5 py-[2px] font-mono text-[9px] font-medium tracking-widest text-white shadow-md ring-1 ring-white/15">
                {city.name}
              </span>
              <span className="h-[5px] w-px bg-white/40" />
            </span>
          ))}
        </div>
      </div>
      {/* Availability pill floats over the globe's horizon */}
      <div className="pointer-events-none absolute inset-x-0 bottom-5 z-20 flex justify-center">
        <span className="inline-flex items-center gap-1.5 rounded-full border border-border-primary bg-bg-primary/80 px-3 py-1 font-mono text-xs text-text-secondary shadow-sm backdrop-blur">
          <span className="relative flex size-2">
            <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-emerald-400 opacity-75 motion-reduce:animate-none" />
            <span className="relative inline-flex size-2 rounded-full bg-emerald-500" />
          </span>
          available for new projects
        </span>
      </div>
    </BentoCard>
  );
}
/* ── 3. Tech Stack card — three themed marquee rows ──────────── */
type TechItem = {
  title: string;
  /** simple-icons URL; omitted for tech without a known monochrome mark */
  src?: string;
  brand: string;
  brandDark?: string;
};

const simple = (slug: string) =>
  `https://cdn.jsdelivr.net/npm/simple-icons@v13/icons/${slug}.svg`;

/* ✏️ EDIT HERE: the stack — row 1 web, row 2 cybersecurity, row 3 AI/ML.
   Icons are CSS masks: neutral gray at rest, official brand color when
   the chip is hovered (`brandDark` overrides for near-black marks). */
const stackRows: TechItem[][] = [
  [
    { title: "React", src: simple("react"), brand: "#61DAFB" },
    { title: "Next.js", src: simple("nextdotjs"), brand: "#000000", brandDark: "#ffffff" },
    { title: "TypeScript", src: simple("typescript"), brand: "#3178C6" },
    { title: "JavaScript", src: simple("javascript"), brand: "#F7DF1E" },
    { title: "Tailwind CSS", src: simple("tailwindcss"), brand: "#06B6D4" },
    { title: "Node.js", src: simple("nodedotjs"), brand: "#5FA04E" },
    { title: "Express", src: simple("express"), brand: "#000000", brandDark: "#ffffff" },
    { title: "PostgreSQL", src: simple("postgresql"), brand: "#4169E1" },
    { title: "MongoDB", src: simple("mongodb"), brand: "#47A248" },
    { title: "Supabase", src: simple("supabase"), brand: "#3FCF8E" },
  ],
  [
    { title: "Kali Linux", src: simple("kalilinux"), brand: "#557C94", brandDark: "#7ea6c0" },
    { title: "Linux", src: simple("linux"), brand: "#FCC624" },
    { title: "Bash", src: simple("gnubash"), brand: "#4EAA25" },
    { title: "Wireshark", src: simple("wireshark"), brand: "#1679A7", brandDark: "#3aa5d6" },
    { title: "Burp Suite", src: simple("burpsuite"), brand: "#FF6633" },
    { title: "Metasploit", src: simple("metasploit"), brand: "#2596CD" },
    { title: "OWASP", src: simple("owasp"), brand: "#000000", brandDark: "#ffffff" },
    { title: "TryHackMe", src: simple("tryhackme"), brand: "#c11c1c", brandDark: "#ff4d4d" },
    { title: "Docker", src: simple("docker"), brand: "#2496ED" },
    { title: "Git", src: simple("git"), brand: "#F05032" },
  ],
  [
    { title: "Python", src: simple("python"), brand: "#3776AB", brandDark: "#5b9bd5" },
    { title: "TensorFlow", src: simple("tensorflow"), brand: "#FF6F00" },
    { title: "PyTorch", src: simple("pytorch"), brand: "#EE4C2C" },
    { title: "scikit-learn", src: simple("scikitlearn"), brand: "#F7931E" },
    { title: "Pandas", src: simple("pandas"), brand: "#150458", brandDark: "#a3a0e8" },
    { title: "NumPy", src: simple("numpy"), brand: "#013243", brandDark: "#4dabcf" },
    { title: "Jupyter", src: simple("jupyter"), brand: "#F37626" },
    { title: "OpenAI", src: simple("openai"), brand: "#412991", brandDark: "#b9a7f4" },
    { title: "Claude", src: simple("claude"), brand: "#D97757" },
    { title: "Gemini", src: simple("googlegemini"), brand: "#8E75B2", brandDark: "#b39ddb" },
    { title: "Hugging Face", src: simple("huggingface"), brand: "#FFD21E" },
  ],
];

/* ── Dynamic stack merge ─────────────────────────────────────────
   Tech listed on projects flows into the marquee automatically:
   web projects extend row 1, security row 2, AI/ML row 3. Names are
   deduped case-insensitively across ALL rows (adding another Python
   project never duplicates the Python chip). Known tools get their
   official icon + brand color; anything else renders a clean dot chip. */
export type ProjectTech = { web: string[]; security: string[]; ai: string[] };

const normTech = (s: string) => {
  const n = s.toLowerCase().replace(/[^a-z0-9]/g, "");
  /* aliases so common spellings collapse onto the static chips */
  const aliases: Record<string, string> = {
    reactjs: "react",
    nextjs: "nextdotjs",
    next: "nextdotjs",
    nodejs: "nodedotjs",
    node: "nodedotjs",
    expressjs: "express",
    tailwind: "tailwindcss",
    postgres: "postgresql",
    mongo: "mongodb",
    geminiai: "googlegemini",
    gemini: "googlegemini",
    js: "javascript",
    ts: "typescript",
    py: "python",
    sklearn: "scikitlearn",
    huggingface: "huggingface",
  };
  return aliases[n] ?? n;
};

/* Curated icons/colors for tech likely to appear on future projects.
   Only curated slugs get a mask icon — guessing slugs risks invisible
   (404) masks, so unknown tech falls back to a tidy dot chip instead. */
const DYNAMIC_TECH_ICONS: Record<
  string,
  { slug: string; brand: string; brandDark?: string }
> = {
  fastapi: { slug: "fastapi", brand: "#009688" },
  flask: { slug: "flask", brand: "#000000", brandDark: "#ffffff" },
  django: { slug: "django", brand: "#092E20", brandDark: "#44B78B" },
  redis: { slug: "redis", brand: "#FF4438" },
  mysql: { slug: "mysql", brand: "#4479A1" },
  sqlite: { slug: "sqlite", brand: "#003B57", brandDark: "#67b8e3" },
  firebase: { slug: "firebase", brand: "#DD2C00" },
  graphql: { slug: "graphql", brand: "#E10098" },
  prisma: { slug: "prisma", brand: "#2D3748", brandDark: "#a0aec0" },
  vue: { slug: "vuedotjs", brand: "#4FC08D" },
  vuejs: { slug: "vuedotjs", brand: "#4FC08D" },
  angular: { slug: "angular", brand: "#DD0031" },
  svelte: { slug: "svelte", brand: "#FF3E00" },
  rust: { slug: "rust", brand: "#000000", brandDark: "#ffffff" },
  go: { slug: "go", brand: "#00ADD8" },
  golang: { slug: "go", brand: "#00ADD8" },
  php: { slug: "php", brand: "#777BB4" },
  laravel: { slug: "laravel", brand: "#FF2D20" },
  cplusplus: { slug: "cplusplus", brand: "#00599C" },
  kubernetes: { slug: "kubernetes", brand: "#326CE5" },
  nginx: { slug: "nginx", brand: "#009639" },
  keras: { slug: "keras", brand: "#D00000" },
  opencv: { slug: "opencv", brand: "#5C3EE8" },
  streamlit: { slug: "streamlit", brand: "#FF4B4B" },
  langchain: { slug: "langchain", brand: "#1C3C3C", brandDark: "#7ee0c1" },
  ollama: { slug: "ollama", brand: "#000000", brandDark: "#ffffff" },
  nmap: { slug: "nmap", brand: "#4682B4" },
  vercel: { slug: "vercel", brand: "#000000", brandDark: "#ffffff" },
};

/** Static rows + project tech, merged and globally deduped. */
function buildStackRows(projectTech?: ProjectTech | null): TechItem[][] {
  const rows = stackRows.map((r) => [...r]);
  const seen = new Set<string>();
  for (const row of rows) for (const item of row) seen.add(normTech(item.title));

  const buckets: (keyof ProjectTech)[] = ["web", "security", "ai"];
  buckets.forEach((bucket, rowIndex) => {
    for (const raw of projectTech?.[bucket] ?? []) {
      const key = normTech(raw);
      if (!key || seen.has(key)) continue;
      seen.add(key);
      const known = DYNAMIC_TECH_ICONS[key];
      rows[rowIndex].push({
        title: raw,
        src: known ? simple(known.slug) : undefined,
        brand: known?.brand ?? "#6366F1",
        brandDark: known?.brandDark ?? (known ? undefined : "#818CF8"),
      });
    }
  });
  return rows;
}

function TechChip({ item }: { item: TechItem }) {
  return (
    <span
      className="group/chip flex shrink-0 items-center gap-2 rounded-xl border border-border-primary bg-[#EDEEF0] px-3.5 py-2 transition-colors duration-300 hover:border-neutral-400/70 dark:bg-white/5 dark:hover:border-white/25"
      style={
        {
          boxShadow: "0px 2px 1.5px 0px #A5AEB852 inset",
          "--brand": item.brand,
          "--brand-dark": item.brandDark ?? item.brand,
        } as React.CSSProperties
      }
    >
      {/* Brand mark as a mask → gray at rest, true brand color on hover.
          Tech without a known monochrome mark gets a tidy dot instead. */}
      {item.src ? (
        <span
          aria-hidden
          className="size-4 shrink-0 bg-neutral-600 transition-colors duration-300 ease-out group-hover/chip:bg-[var(--brand)] dark:bg-neutral-300 dark:group-hover/chip:bg-[var(--brand-dark)]"
          style={{
            WebkitMaskImage: `url(${item.src})`,
            maskImage: `url(${item.src})`,
            WebkitMaskRepeat: "no-repeat",
            maskRepeat: "no-repeat",
            WebkitMaskPosition: "center",
            maskPosition: "center",
            WebkitMaskSize: "contain",
            maskSize: "contain",
          }}
        />
      ) : (
        <span
          aria-hidden
          className="size-1.5 shrink-0 rounded-full bg-neutral-600 transition-colors duration-300 ease-out group-hover/chip:bg-[var(--brand)] dark:bg-neutral-300 dark:group-hover/chip:bg-[var(--brand-dark)]"
        />
      )}
      <span className="whitespace-nowrap font-mono text-xs text-text-secondary transition-colors duration-300 group-hover/chip:text-text-primary">
        {item.title}
      </span>
    </span>
  );
}

/** One infinite marquee row: two identical groups animate translateX(-100%)
    on the GPU (pure transform → steady 60fps). Hovering a row pauses that
    row only, so chips are easy to read and hover-color individually. */
function MarqueeRow({
  items,
  duration,
  reverse = false,
}: {
  items: TechItem[];
  duration: number;
  reverse?: boolean;
}) {
  const groupClass = clsx(
    "flex shrink-0 items-center gap-2 pr-2 will-change-transform group-hover/row:[animation-play-state:paused] motion-reduce:animate-none",
    reverse ? "animate-marquee-reverse" : "animate-marquee"
  );
  const style = { "--marquee-duration": `${duration}s` } as React.CSSProperties;
  return (
    <div className="group/row flex overflow-hidden [mask-image:linear-gradient(to_right,transparent,black_8%,black_92%,transparent)]">
      <div className={groupClass} style={style}>
        {items.map((item) => (
          <TechChip key={item.title} item={item} />
        ))}
      </div>
      <div className={groupClass} style={style} aria-hidden>
        {items.map((item) => (
          <TechChip key={item.title} item={item} />
        ))}
      </div>
    </div>
  );
}

function TechStackBento({
  linkTo,
  projectTech,
}: {
  linkTo?: string;
  projectTech?: ProjectTech | null;
}) {
  /* Static rows merged with project tech — memoized, recomputed only
     when the (server-provided) project tech actually changes. */
  const rows = React.useMemo(() => buildStackRows(projectTech), [projectTech]);
  return (
    <BentoCard height="h-[300px]" linkTo={linkTo}>
      {/* Header voice matches the sibling bento cards */}
      <div className="z-20 text-center">
        <h3 className="text-base font-medium text-text-primary">Tech stack</h3>
        <p className="mt-1 text-sm text-text-secondary md:text-base">
          The stack behind everything I ship — web, security &amp; AI/ML.
        </p>
      </div>
      <div className="z-20 mt-5 flex flex-1 flex-col justify-center gap-2.5">
        <MarqueeRow items={rows[0]} duration={40} />
        <MarqueeRow items={rows[1]} duration={46} reverse />
        <MarqueeRow items={rows[2]} duration={43} />
      </div>
    </BentoCard>
  );
}

/* ── 4. By-the-numbers card — live totals from this site's database ── */
/* Each tile deep-links to the thing it counts; icons sit gray at rest
   and take their accent color on hover, matching the sibling cards. */

const siteStatMeta = [
  {
    key: "projects",
    label: "Projects",
    href: "/projects",
    icon: FolderGit2,
    hoverClass: "group-hover/tile:text-indigo-500",
  },
  {
    key: "posts",
    label: "Write-ups",
    href: "/blog",
    icon: FileText,
    hoverClass: "group-hover/tile:text-sky-500",
  },
  {
    key: "notes",
    label: "Wall notes",
    href: "/community-wall",
    icon: MessagesSquare,
    hoverClass: "group-hover/tile:text-amber-500",
  },
  {
    key: "testimonials",
    label: "Testimonials",
    href: "/#testimonials",
    icon: Quote,
    hoverClass: "group-hover/tile:text-emerald-500",
  },
] as const;

export type SiteStats = {
  projects: number | null;
  posts: number | null;
  notes: number | null;
  testimonials: number | null;
  views: number | null;
};

export function SiteStatsBento({
  site,
  height = "h-auto sm:h-[240px] lg:h-[220px]",
}: {
  site: SiteStats | null;
  height?: string;
}) {
  return (
    <BentoCard height={height}>
      {/* Header — same centered voice as the other bento cards */}
      <div className="z-20 text-center">
        <div className="flex items-center justify-center gap-2">
          <h3 className="text-base font-medium text-text-primary">
            Shipped, counted, public
          </h3>
          <span className="inline-flex items-center gap-1.5 rounded-full border border-emerald-500/30 bg-emerald-500/10 px-2 py-0.5 font-mono text-[10px] font-medium text-emerald-600 dark:text-emerald-400">
            <span className="relative flex size-1.5">
              <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-emerald-400 opacity-75 motion-reduce:animate-none" />
              <span className="relative inline-flex size-1.5 rounded-full bg-emerald-500" />
            </span>
            LIVE
          </span>
        </div>
        <p className="mt-1 text-sm text-text-secondary md:text-base">
          No hand-typed numbers — the database does the talking.
        </p>
      </div>

      {/* Stat tiles — each one links to what it counts */}
      <div className="z-20 mt-4 grid flex-1 grid-cols-2 gap-2 sm:grid-cols-4">
        {siteStatMeta.map((stat) => {
          const Icon = stat.icon;
          const value = site?.[stat.key] ?? null;
          return (
            <Link
              key={stat.key}
              href={stat.href}
              title={`${stat.label} →`}
              className="group/tile block rounded-[14px] border border-border-primary p-1 transition-all duration-300 hover:-translate-y-1 hover:border-neutral-400 motion-reduce:hover:translate-y-0 motion-reduce:transition-none dark:hover:border-white/30"
            >
              <div
                className="flex h-full flex-col items-center justify-center gap-1 rounded-[10px] border-2 border-[#A5AEB81F]/10 bg-[#EDEEF0] px-2 py-2.5 dark:bg-white/5"
                style={{ boxShadow: "0px 2px 1.5px 0px #A5AEB852 inset" }}
              >
                <Icon
                  className={clsx(
                    "size-4 text-neutral-600 transition-all duration-300 ease-out group-hover/tile:scale-110 motion-reduce:group-hover/tile:scale-100 motion-reduce:transition-none dark:text-neutral-300",
                    stat.hoverClass
                  )}
                  aria-hidden
                />
                <span className="text-[15px] font-medium leading-none text-text-primary">
                  {value !== null ? (
                    <CountUpValue to={value} pad={2} />
                  ) : (
                    <span className="text-text-secondary">—</span>
                  )}
                </span>
                <span className="text-center font-mono text-[10px] uppercase tracking-widest text-text-secondary transition-colors duration-300 group-hover/tile:text-text-primary motion-reduce:transition-none">
                  {stat.label}
                </span>
              </div>
            </Link>
          );
        })}
      </div>

      {/* Footer — live view total + link to the full breakdown */}
      <Link
        href="/stats"
        className="z-20 mt-2 block py-1.5 -my-1.5 text-center font-mono text-[11px] text-text-secondary transition-colors duration-300 hover:text-text-primary motion-reduce:transition-none"
      >
        {site?.views != null && (
          <>{site.views.toLocaleString("en-US")} article views · </>
        )}
        full breakdown · /stats →
      </Link>
    </BentoCard>
  );
}


/* ── Main HomeBento Component ───────────────────────────────── */
const bentoCardVariants = {
  hidden: { opacity: 0, y: 24 },
  show: { opacity: 1, y: 0, transition: { duration: 0.55, ease: "easeOut" } },
} as const;

export function HomeBento({
  site,
  projectTech,
}: {
  site?: SiteStats | null;
  projectTech?: ProjectTech | null;
}) {
  return (
    <section className="relative space-y-14 px-2 sm:px-4">
      {/* Section header — identical system to every other homepage section */}
      <SectionHeading kicker="Let's connect" animateWords>
        Find me across the{" "}
        <span className="animate-gradient-x text-colorfull px-1 pb-1 italic [text-shadow:none]">
          web
        </span>
      </SectionHeading>

      {/* Asymmetric 12-col bento: left stack (5) = Accounts + Globe,
          right stack (7) = Tech-stack marquee + live site stats.
          Both stacks sum to the same height (220+300 vs 300+220) so the
          section closes on a clean baseline. */}
      <motion.div
        initial="show"
        whileInView="show"
        viewport={{ once: true, margin: "-60px" }}
        variants={{ hidden: {}, show: { transition: { staggerChildren: 0.08 } } }}
        className="grid grid-cols-1 gap-2 lg:grid-cols-12"
      >
        <div className="flex flex-col gap-2 lg:col-span-5">
          <motion.div variants={bentoCardVariants}>
            <AccountsBento />
          </motion.div>
          <motion.div variants={bentoCardVariants} className="flex-1">
            <GlobeBento />
          </motion.div>
        </div>
        <div className="flex flex-col gap-2 lg:col-span-7">
          <motion.div variants={bentoCardVariants}>
            <TechStackBento linkTo="/about" projectTech={projectTech} />
          </motion.div>
          <motion.div variants={bentoCardVariants} className="flex-1">
            <SiteStatsBento site={site ?? null} />
          </motion.div>
        </div>
      </motion.div>
    </section>
  );
}
