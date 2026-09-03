"use client";

/* LOCKED — shared card system for the home projects section and the
   projects page (both audited & production-approved). Do not change
   without explicit owner approval. */

import Link from "next/link";
import Image from "next/image";
import { useEffect, useRef, useState } from "react";
import { motion, useInView } from "framer-motion";
import clsx from "clsx";
import { optimizeImageUrl } from "@/app/lib/image-utils";
import type { HomeProject } from "@/app/data/fallback-home";
import { SectionHeading } from "./SectionHeading";
import { DoubleArrow } from "./DoubleArrow";

/* Tech chips — simple-icons masks rendered in each tool's official brand
   color at rest (slight scale-up on hover); tech without a known mark
   gets a tidy brand-colored dot instead. */
const simpleIcon = (slug: string) =>
  `https://cdn.jsdelivr.net/npm/simple-icons@v13/icons/${slug}.svg`;

const normalizeTech = (s: string) => {
  const n = s.toLowerCase().replace(/[^a-z0-9]/g, "");
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
  };
  return aliases[n] ?? n;
};

const techIconMap: Record<
  string,
  { slug: string; brand: string; brandDark?: string }
> = {
  react: { slug: "react", brand: "#61DAFB" },
  nextdotjs: { slug: "nextdotjs", brand: "#000000", brandDark: "#ffffff" },
  typescript: { slug: "typescript", brand: "#3178C6" },
  javascript: { slug: "javascript", brand: "#F7DF1E" },
  python: { slug: "python", brand: "#3776AB", brandDark: "#5b9bd5" },
  fastapi: { slug: "fastapi", brand: "#009688" },
  flask: { slug: "flask", brand: "#000000", brandDark: "#ffffff" },
  django: { slug: "django", brand: "#092E20", brandDark: "#44b78b" },
  postgresql: { slug: "postgresql", brand: "#4169E1" },
  mongodb: { slug: "mongodb", brand: "#47A248" },
  mysql: { slug: "mysql", brand: "#4479A1" },
  redis: { slug: "redis", brand: "#FF4438" },
  express: { slug: "express", brand: "#000000", brandDark: "#ffffff" },
  nodedotjs: { slug: "nodedotjs", brand: "#5FA04E" },
  tailwindcss: { slug: "tailwindcss", brand: "#06B6D4" },
  docker: { slug: "docker", brand: "#2496ED" },
  supabase: { slug: "supabase", brand: "#3FCF8E" },
  firebase: { slug: "firebase", brand: "#DD2C00" },
  googlegemini: { slug: "googlegemini", brand: "#8E75B2", brandDark: "#b39ddb" },
  openai: { slug: "openai", brand: "#412991", brandDark: "#b9a7f4" },
  tensorflow: { slug: "tensorflow", brand: "#FF6F00" },
  pytorch: { slug: "pytorch", brand: "#EE4C2C" },
  wireshark: { slug: "wireshark", brand: "#1679A7", brandDark: "#3aa5d6" },
  graphql: { slug: "graphql", brand: "#E10098" },
};

function TechChip({ name, pill = false }: { name: string; pill?: boolean }) {
  const icon = techIconMap[normalizeTech(name)];
  const base = pill
    ? "group/chip flex items-center gap-1.5 rounded-full border border-border-primary px-3 py-1 font-mono text-xs text-text-secondary transition-colors duration-300 hover:border-neutral-400/70 hover:text-text-primary dark:hover:border-white/25"
    : "group/chip flex items-center gap-1.5 rounded-md bg-black/[0.05] px-2.5 py-[5px] font-mono text-[10px] uppercase tracking-widest text-text-secondary ring-1 ring-black/[0.06] transition-colors duration-300 hover:text-text-primary dark:bg-white/5 dark:ring-white/[0.06]";
  return (
    <span
      className={base}
      style={
        {
          "--brand": icon?.brand ?? "#6366F1",
          "--brand-dark": icon?.brandDark ?? icon?.brand ?? "#818CF8",
        } as React.CSSProperties
      }
    >
      {icon ? (
        <span
          aria-hidden
          className="size-3.5 shrink-0 bg-[var(--brand)] transition-transform duration-300 ease-out group-hover/chip:scale-110 dark:bg-[var(--brand-dark)]"
          style={{
            WebkitMaskImage: `url(${simpleIcon(icon.slug)})`,
            maskImage: `url(${simpleIcon(icon.slug)})`,
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
          className="size-1.5 shrink-0 rounded-full bg-[var(--brand)] dark:bg-[var(--brand-dark)]"
        />
      )}
      <span className="leading-none">{name}</span>
    </span>
  );
}

/* Honest domain label — same classifier the StatusRow uses; used as the
   fallback chip when a project has no curated tags yet. */
function domainLabel(project: HomeProject): string {
  const hay = `${project.category} ${project.title}`.toLowerCase();
  if (/cyber|security|nids|intrusion|packet|sniff|pentest|forensic/.test(hay))
    return "Cybersecurity";
  if (/\bai\b|machine.?learning|\bml\b|gpt|llm|neural/.test(hay))
    return "AI/ML";
  return project.category;
}

/* Chips shown next to the project number: curated tags (1–3, projects can
   span domains) with the classifier label as fallback. Exported so the
   /projects index can filter by the exact same labels the cards display. */
export function projectTags(project: HomeProject): string[] {
  /* Production hygiene: CMS data can contain blanks or duplicates —
     trim, drop empties, dedupe (duplicate tags would also collide as
     React keys), then cap at 3. Falls back to the domain label so the
     meta row always has at least one tag. */
  const clean = Array.from(
    new Set((project.tags ?? []).map((t) => t.trim()).filter(Boolean))
  );
  return clean.length > 0 ? clean.slice(0, 3) : [domainLabel(project)];
}


const placeholderHues = [
  "from-violet-500/40 to-indigo-900/50",
  "from-blue-500/40 to-sky-900/50",
  "from-emerald-500/40 to-teal-900/50",
  "from-pink-500/40 to-rose-900/50",
  "from-amber-500/40 to-orange-900/50",
];

// Per-project 145deg 4-stop single-hue gradients (guide spec §4.4)
const panelGradients = [
  "linear-gradient(145deg, #172554, #1e40af, #2563eb, #60a5fa)", // blue
  "linear-gradient(145deg, #022c22, #065f46, #059669, #34d399)", // emerald
  "linear-gradient(145deg, #500724, #9d174d, #db2777, #f472b6)", // pink
  "linear-gradient(145deg, #0f172a, #334155, #64748b, #cbd5e1)", // slate gray
  "linear-gradient(145deg, #451a03, #92400e, #d97706, #fbbf24)", // amber
  "linear-gradient(145deg, #1e1b4b, #4c1d95, #6d28d9, #a78bfa)", // violet
];

// Solid accent colors matching the 6 gradient hues above, same order
// (dash + sparkle bullets always match the project's image-box gradient)
const hueText = [
  "text-blue-500",
  "text-emerald-500",
  "text-pink-500",
  "text-slate-500",
  "text-amber-500",
  "text-violet-500",
];

const hueBg = [
  "bg-blue-500",
  "bg-emerald-500",
  "bg-pink-500",
  "bg-slate-500",
  "bg-amber-500",
  "bg-violet-500",
];

// Hex accents in the same order — used for the junction-node core on the
// projects page so each node matches its card's cover gradient.
const hueHex = [
  "#3b82f6", // blue
  "#10b981", // emerald
  "#ec4899", // pink
  "#64748b", // slate
  "#f59e0b", // amber
  "#8b5cf6", // violet
];


// Mirrors genericFeatures on the project detail page — used when a project
// has no owner-provided features yet (original placeholder copy).
function genericBullets(title: string): string[] {
  return [
    `Thoughtful, accessible UI with full dark and light theme support across ${title}.`,
    "Type-safe end-to-end architecture with defensive data handling and graceful fallbacks.",
    "Performance-first build: optimized images, minimal client JavaScript, fast transitions.",
    "Shipped with CI checks, error monitoring, and a zero-downtime deploy pipeline.",
  ];
}

/* Wraps search-term matches in a quiet <mark> (dotted underline, no fill) so
   filtered cards show why they matched without shouting. */
function highlightMatches(text: string, term?: string) {
  const t = term?.trim();
  if (!t) return text;
  const escaped = t.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
  const parts = text.split(new RegExp(`(${escaped})`, "ig"));
  if (parts.length === 1) return text;
  return parts.map((part, k) =>
    part.toLowerCase() === t.toLowerCase() ? (
      <mark
        key={k}
        className="bg-transparent font-medium text-text-primary underline decoration-text-tertiary decoration-dotted underline-offset-2"
      >
        {part}
      </mark>
    ) : (
      part
    )
  );
}

export function CaseStudyCard({
  project,
  index,
  coverMinHClass = "xl:min-h-[460px]",
  metaDividerClass,
  metaDividerJoint,
  liftOnHover = true,
  coverHeading = "tagline",
  bodyHiddenOnXl = false,
  detailsOpen: detailsOpenProp,
  onToggleDetails,
  highlight,
}: {
  project: HomeProject;
  index: number;
  /** Home: hide the below-panel body at xl — the sticky side panel shows the
      same details there. Below xl (no side panel) the body stays visible. */
  bodyHiddenOnXl?: boolean;
  /** Tailwind min-height class for the cover panel. The projects page passes
      a smaller value so the cover keeps the same width-to-height proportion
      as on the home page, where columns are wider. */
  coverMinHClass?: string;
  /** When set, renders a dotted horizontal rule between the meta row and the
      cover. The projects page uses negative margins here so the rule extends
      into the column gap and joins the central vertical divider. */
  metaDividerClass?: string;
  /** Which end of the meta divider meets the central vertical line. Renders
      a blueprint-style junction node (diamond + center dot) centered exactly
      on the intersection so the three lines visibly connect. */
  metaDividerJoint?: "left" | "right";
  /** When false, the whole-card hover lift is disabled so structural lines
      (meta divider, junction node) stay perfectly static. The cover's own
      hover choreography (image tilt/lift) is unaffected. Defaults to true,
      preserving the home page behaviour. */
  liftOnHover?: boolean;
  /** What the big heading inside the cover shows. Home keeps the default
      tagline; the projects page passes "title" to show the project name. */
  coverHeading?: "tagline" | "title";
  /** Controlled disclosure (projects page): when provided, the open state
      lives in the parent so only one card's details are open at a time. */
  detailsOpen?: boolean;
  onToggleDetails?: () => void;
  /** Projects page search term — matches inside the description get a quiet
      dotted-underline emphasis so users see WHY a card matched. */
  highlight?: string;
}) {
  const i = index;

  /* Touch devices have no hover, so replay the hover choreography when the
     card crosses the middle band of the viewport. Detection: coarse pointer /
     no-hover media queries, plus a first-touch listener as a fallback so any
     device switches over the moment it is actually touched. Mouse/trackpad
     behaviour stays untouched. */
  const panelRef = useRef<HTMLDivElement>(null);
  const inCenter = useInView(panelRef, { margin: "-18% 0px -18% 0px" });
  const [isTouch, setIsTouch] = useState(false);
  useEffect(() => {
    if (window.matchMedia("(hover: none), (pointer: coarse)").matches) {
      setIsTouch(true);
      return;
    }
    const onFirstTouch = () => setIsTouch(true);
    window.addEventListener("touchstart", onFirstTouch, {
      once: true,
      passive: true,
    });
    return () => window.removeEventListener("touchstart", onFirstTouch);
  }, []);
  const active = isTouch && inCenter;

  /* Projects-page disclosure for highlights + tech stack (collapsed by
     default so the grid stays compact). Controlled by the parent when
     onToggleDetails is provided (accordion: one open at a time). */
  const [detailsOpenLocal, setDetailsOpenLocal] = useState(false);
  const detailsOpen = onToggleDetails ? !!detailsOpenProp : detailsOpenLocal;
  const toggleDetails = onToggleDetails ?? (() => setDetailsOpenLocal((v) => !v));

  /* Production hardening for the disclosure:
     1. `inert` on the collapsed panel — keyboard users can't tab into
        invisible bullets/chips, and screen readers skip them (React 18
        has no boolean `inert` prop, so it's applied via the DOM).
     2. When a panel opens below the fold, gently bring it into view once
        the 300ms height transition has finished. */
  const detailsPanelRef = useRef<HTMLDivElement>(null);
  useEffect(() => {
    const el = detailsPanelRef.current;
    if (!el || coverHeading !== "title") return;
    el.inert = !detailsOpen;
    if (!detailsOpen) return;
    const t = setTimeout(() => {
      const rect = el.getBoundingClientRect();
      if (rect.bottom > window.innerHeight) {
        el.scrollIntoView({
          behavior: window.matchMedia("(prefers-reduced-motion: reduce)")
            .matches
            ? "auto"
            : "smooth",
          block: "nearest",
        });
      }
    }, 320);
    return () => clearTimeout(t);
  }, [detailsOpen, coverHeading]);

  return (
    <motion.article
      key={project.slug}
      initial={false}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: "-10%" }}
      transition={{ duration: 0.6, ease: "easeOut" }}
      whileHover={
        liftOnHover
          ? {
              y: -4,
              transition: {
                type: "spring",
                stiffness: 400,
                damping: 30,
                mass: 0.8,
              },
            }
          : undefined
      }
    >
      {/* Header: `01 ─── tags-in-pills` left, year pill right. */}
      <div className="mb-5 flex items-center justify-between gap-3">
        <div className="flex min-w-0 items-center gap-3">
          <span className="shrink-0 font-mono text-xs text-text-secondary">
            {String(i + 1).padStart(2, "0")}
          </span>
          <span aria-hidden className="h-px w-4 shrink-0 bg-border-primary sm:w-7" />
          {/* Both pages: tags may wrap, but the container is locked to one
              pill row (26.5px) — any tag that doesn't fit drops to the
              hidden second row and disappears whole. No pill is ever
              clipped mid-way; max 3 shown, min 1 guaranteed (a very long
              first tag truncates inside its pill). */}
          <div className="flex h-[26.5px] min-w-0 flex-wrap content-start items-center gap-2 overflow-hidden">
            {projectTags(project).map((tag) => (
              <span
                key={tag}
                /* Truncated long tags reveal their full name on hover. */
                title={tag}
                /* Same height as the quarter pill (26.5px = 11px/1.5 line
                   + py-1 + border) on every screen. */
                className="inline-block h-[26.5px] max-w-[8.5rem] shrink-0 truncate whitespace-nowrap rounded-full border border-border-primary px-2 font-mono text-[8px] uppercase leading-[24.5px] tracking-widest text-text-secondary sm:max-w-[12rem] sm:px-3 sm:text-[10px]"
              >
                {tag}
              </span>
            ))}
          </div>
        </div>
        {project.year && (
          <span className="inline-flex h-[26.5px] shrink-0 items-center rounded-lg border border-border-primary bg-bg-secondary/60 px-3 font-mono text-xs text-text-secondary">
            {project.year}
          </span>
        )}
      </div>

      {metaDividerClass && (
        <div
          aria-hidden
          className={clsx(
            "relative mb-5 border-t border-dotted",
            metaDividerClass
          )}
          style={{ borderTopColor: "color-mix(in srgb, var(--rule-color) 85%, transparent)" }}
        >
          {metaDividerJoint && (
            <span
              className={clsx(
                "absolute top-0 hidden -translate-y-1/2 opacity-[0.9] xl:flex xl:items-center xl:justify-center",
                metaDividerJoint === "right"
                  ? "right-0 translate-x-1/2"
                  : "left-0 -translate-x-1/2"
              )}
            >
              {/* Junction node where the dotted rule meets the vertical
                  spine — drawn as a survey/reticle datum point: a soft halo,
                  a solid-filled ring that masks the lines passing beneath so
                  they terminate cleanly at its edge, and a center dot in the
                  same hue as this card's cover gradient. */}
              <span
                className="absolute h-6 w-6 rounded-full blur-[7px]"
                style={{
                  backgroundColor: `${hueHex[i % hueHex.length]}1a`,
                }}
              />
              <span className="relative flex h-[13px] w-[13px] items-center justify-center rounded-full border border-text-tertiary bg-bg-primary shadow-[0_0_0_3px_rgba(100,106,124,0.12)]">
                <span
                  className="h-[4px] w-[4px] rounded-full"
                  style={{
                    backgroundColor: hueHex[i % hueHex.length],
                    boxShadow: `0 0 6px ${hueHex[i % hueHex.length]}99`,
                  }}
                />
              </span>
            </span>
          )}
        </div>
      )}

      <Link
        href={`/projects/${project.slug}`}
        className={clsx(
          "frame-light-edge group relative block",
          /* Projects page: the cover panel itself rises 6px on hover, so the
             frame hairline must ride along or it visibly detaches. */
          !liftOnHover && "frame-light-edge-lift"
        )}
      >
        <div
          ref={panelRef}
          className={clsx(
            "relative flex flex-col overflow-hidden rounded-[22px] border-8 border-white shadow-[0_0_0_0.8px_rgba(0,0,0,0.2),0_9.5px_28.5px_-11.4px_rgba(0,0,0,0.4)] dark:border-zinc-800 dark:shadow-[0_0_0_1px_#4d4d4d,0_9.5px_28.5px_-11.4px_rgba(0,0,0,0.4)]",
            coverMinHClass,
            /* Projects page: the whole-card lift is disabled there, so the
               hover response lives on the cover panel alone — structural
               lines around it stay perfectly static. */
            !liftOnHover &&
              "transition-transform duration-300 ease-[cubic-bezier(0.22,1,0.36,1)] [@media(hover:hover)]:group-hover:-translate-y-1.5 motion-reduce:transition-none motion-reduce:group-hover:translate-y-0"
          )}
          style={{ backgroundImage: panelGradients[i % panelGradients.length] }}
        >
          {/* hover tint — lightens the gradient by ~2% */}
          <span
            aria-hidden
            className={clsx(
              "pointer-events-none absolute inset-0 bg-white opacity-0 transition-opacity duration-700 group-hover:opacity-[0.02]",
              active && "opacity-[0.02]"
            )}
          />
          <div
            className={clsx(
              "flex flex-1 flex-col p-6 pb-0 md:p-8 md:pb-0",
              liftOnHover
                ? "gap-6"
                : clsx(
                    /* Projects: the title→image clearance must cover the hover
                       rise (scale 1.045 + translate + 2° tilt), which grows
                       with the single-column frame width below xl. Each tier's
                       gap = measured worst-case hover rise + ~8px safety:
                       28px base → 35px sm → 44px md → 56px lg. */
                    "gap-7 sm:gap-[35px] md:gap-[44px] lg:gap-[56px]",
                    /* xl: projects restores gap-6 (its min-h slack + smaller
                       two-col frames give clearance). Home's 2-line tagline
                       eats that slack, so it carries a wider 32px xl gap to
                       stay hover-safe. */
                    bodyHiddenOnXl ? "xl:gap-8" : "xl:gap-6"
                  )
            )}
          >
            <div className="flex items-start justify-between gap-4">
              <h3
                className={clsx(
                  "line-clamp-2 max-w-xl",
                  coverHeading === "title"
                    ? bodyHiddenOnXl
                      ? /* Home: cover tagline in the body sans (same family
                           as the card description) — softer, 18/20px. */
                        "text-base font-medium leading-snug text-white/85 md:text-xl"
                      : /* Identical type to the home projects-section title
                         (font-display text-3xl font-medium leading-tight) —
                         white for contrast on the gradient panel, lifted by a
                         two-layer text shadow (tight contact + soft ambient)
                         so it stays crisp on any cover hue. */
                      "font-display text-[22px] font-medium leading-tight text-white [text-shadow:0_1px_2px_rgba(0,0,0,0.35),0_4px_14px_rgba(0,0,0,0.22)] max-[380px]:text-[19px] sm:text-[26px] md:text-3xl"
                    : /* Home: body-sans tagline, softer — white/70,
                         no shadow — sized for two clamped lines. */
                      "text-base font-medium leading-snug text-white/85 md:text-xl"
                )}
              >
                {coverHeading === "title"
                  ? bodyHiddenOnXl
                    ? /* Home: the cover shows the description/tagline (soft
                         serif style), while the below-panel body keeps the
                         projects structure for mobile/tablet. */
                      project.tagline
                    : project.title
                  : project.tagline}
              </h3>
              <span
                aria-hidden
                className={clsx(
                  "shrink-0 leading-none transition-transform duration-300 group-hover:translate-x-1",
                  /* Home: thin line-arrow (long shaft + chevron) drawn as an
                     SVG in the tagline's white/85 — matches the reference
                     shape. Projects keeps the shadowed glyph arrow that
                     pairs with its serif title. */
                  bodyHiddenOnXl || coverHeading !== "title"
                    ? "mt-1 text-white/85"
                    : "text-[22px] text-white [text-shadow:0_1px_2px_rgba(0,0,0,0.35),0_4px_14px_rgba(0,0,0,0.22)]",
                  active && "translate-x-1"
                )}
              >
                {bodyHiddenOnXl || coverHeading !== "title" ? (
                  <svg
                    viewBox="0 0 24 16"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth={2.2}
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    className="h-4 w-6"
                  >
                    <path d="M2 8h19" />
                    <path d="m15 2 6 6-6 6" />
                  </svg>
                ) : (
                  "→"
                )}
              </span>
            </div>

            {/* Screenshot area — one image per card, centered, 3px white/70
                frame, rounded top corners, bleeding past the panel's bottom
                edge. On hover the shot lifts and tilts — odd cards (01/03/05)
                tilt right, even cards (02/04/06) tilt left. */}
            <div
              className={clsx(
                "relative mx-auto mt-auto",
                liftOnHover
                  ? /* Home: original responsive widths and bleed. */
                    "-mb-8 w-[96%] md:-mb-10 md:w-[92%]"
                  : /* Projects page: a progressive composition below xl.
                       Mobile is slightly wider (94%) with a touch more bleed;
                       tablet steps toward the laptop look (93% → 92%, deeper
                       bleed + lift, growing title clearance via the panel's
                       responsive gap); xl keeps the locked laptop recipe
                       (92%, 49px bleed, 25px lift, min-h slack). */
                    clsx(
                      "w-[94%] -mb-[30px] -translate-y-[8px] md:w-[93%] md:-mb-[37px] md:-translate-y-[13px] lg:w-[92%] lg:-mb-[36px] lg:-translate-y-[12px]",
                      /* Home (body hidden at xl): the shot sits a touch
                         lower inside the panel; projects keeps the locked
                         49px/25px laptop recipe. */
                      bodyHiddenOnXl
                        ? "xl:-mb-[24px] xl:translate-y-0"
                        : "xl:-mb-[49px] xl:-translate-y-[25px]"
                    )
              )}
            >
              {(() => {
                const primary = project.images?.[0] || project.image_url;
                /* Touch devices get a snappier 450ms move so the effect
                   finishes while the user is still scrolling (no delayed
                   "self-adjusting" drift after the scroll stops — this was
                   most visible on tablets). Mouse hover keeps the slow
                   700ms silk feel. */
                const silk = clsx(
                  "transition-all ease-[cubic-bezier(0.22,1,0.36,1)] will-change-transform motion-reduce:transition-none",
                  isTouch ? "duration-[450ms]" : "duration-700"
                );
                return (
                  <div
                    className={clsx(
                      "relative transform-gpu overflow-hidden rounded-t-[11px] border-[3px] border-b-0 border-white/70 shadow-[0_30px_60px_-12px_rgba(0,0,0,0.612)]",
                      silk,
                      /* Projects page (liftOnHover=false) renders the shot
                         2% larger at rest and 1.5% larger on hover than the
                         home defaults. Home keeps its original scales. */
                      active
                        ? clsx(
                            liftOnHover ? "scale-[1.03]" : "scale-[1.045]",
                            "-translate-y-[5px] md:-translate-y-[5.5px] xl:-translate-y-[6px]"
                          )
                        : clsx(
                            liftOnHover
                              ? "scale-[0.98] group-hover:scale-[1.03]"
                              : /* Projects: gentler hover below xl (4% grow,
                                   4/5px rise); laptop keeps 4.5% / 6px. */
                                "scale-100 group-hover:scale-[1.04] xl:group-hover:scale-[1.045]",
                            liftOnHover
                              ? "group-hover:-translate-y-[5px] md:group-hover:-translate-y-[5.5px] xl:group-hover:-translate-y-[6px]"
                              : "group-hover:-translate-y-[4px] md:group-hover:-translate-y-[5px] xl:group-hover:-translate-y-[6px]"
                          ),
                      i % 2 === 0
                        ? clsx(
                            liftOnHover
                              ? "origin-bottom-left group-hover:rotate-2 group-hover:translate-x-[7px] md:group-hover:translate-x-[7.5px] xl:group-hover:translate-x-[8px]"
                              : /* Projects: softer tilt/shift below xl
                                   (±1.5°, 6/7px); laptop keeps ±2° / 8px. */
                                "origin-bottom-left group-hover:rotate-[1.5deg] xl:group-hover:rotate-2 group-hover:translate-x-[6px] md:group-hover:translate-x-[7px] xl:group-hover:translate-x-[8px]",
                            active &&
                              "rotate-2 translate-x-[7px] md:translate-x-[7.5px] xl:translate-x-[8px]"
                          )
                        : clsx(
                            liftOnHover
                              ? "origin-bottom-right group-hover:-rotate-2 group-hover:-translate-x-[7px] md:group-hover:-translate-x-[7.5px] xl:group-hover:-translate-x-[8px]"
                              : "origin-bottom-right group-hover:-rotate-[1.5deg] xl:group-hover:-rotate-2 group-hover:-translate-x-[6px] md:group-hover:-translate-x-[7px] xl:group-hover:-translate-x-[8px]",
                            active &&
                              "-rotate-2 -translate-x-[7px] md:-translate-x-[7.5px] xl:-translate-x-[8px]"
                          )
                    )}
                  >
                    <div
                      className={clsx(
                        "relative",
                        liftOnHover
                          ? "aspect-[16/10.95] md:aspect-[16/10.835]"
                          : /* Projects page: the laptop frame ratio at every
                               size — mobile/tablet mirror the locked design. */
                            "aspect-[16/10.835]"
                      )}
                    >
                      {primary ? (
                        <Image
                          src={optimizeImageUrl(primary, 1200)}
                          alt={project.title}
                          fill
                          sizes="(max-width: 768px) 100vw, 50vw"
                          className="object-cover object-top"
                        />
                      ) : (
                        <div
                          className={`absolute inset-0 flex items-end justify-center bg-gradient-to-br ${placeholderHues[i % placeholderHues.length]}`}
                        >
                          <span className="pb-4 text-center font-mono text-[10px] uppercase tracking-widest text-white/60">
                            Add project image in admin
                          </span>
                        </div>
                      )}
                    </div>
                  </div>
                );
              })()}
            </div>
          </div>
        </div>
      </Link>

      {/* Compact description + project story — visible below xl; hidden at xl
          where the cover link and sticky panel provide the same content.
          On the projects page (coverHeading="title") it stays fully visible
          at every breakpoint — there is no sticky panel there. */}
      <div
        className={clsx(
          "mt-5",
          coverHeading === "title" ? "mt-6" : "xl:hidden",
          bodyHiddenOnXl && "xl:hidden"
        )}
      >
        {coverHeading !== "title" && (
          <Link
            href={`/projects/${project.slug}`}
            className="font-display text-2xl font-medium text-text-primary transition-colors hover:text-text-secondary"
          >
            {project.title}
          </Link>
        )}
        {coverHeading === "title" ? (
          <>
            {bodyHiddenOnXl && (
              /* Home mobile/tablet: the cover shows the tagline, so the
                 project title leads the body here (hidden at xl where the
                 sticky panel already names the project). */
              <Link
                href={`/projects/${project.slug}`}
                className="mb-2 block font-display text-2xl font-medium leading-tight text-text-primary transition-colors hover:text-text-secondary"
              >
                {project.title}
              </Link>
            )}
            {/* Projects page: the description itself links to the case study —
                the whole reading path (cover, description, CTA) navigates.
                On the xl staggered grid it reserves two lines so paired
                cards stay exactly the same height; below xl (single column)
                a short description sits naturally with no reserved gap. */}
            <Link
              href={`/projects/${project.slug}`}
              className="line-clamp-3 block max-w-xl text-[15px] leading-relaxed text-text-secondary xl:min-h-[49px]"
            >
              {highlightMatches(project.description, highlight)}
            </Link>
          </>
        ) : (
          <p className="mt-2 line-clamp-3 text-[15px] leading-relaxed text-text-secondary">
            {project.description}
          </p>
        )}

        {coverHeading === "title" && (
          /* Projects page: one action row — secondary disclosure toggle on
             the left, primary case-study CTA beside it (stronger color =
             clear hierarchy). Divider dot separates them quietly. */
          <div className="mt-4 flex flex-wrap items-center gap-x-4 gap-y-2">
            <button
              type="button"
              aria-expanded={detailsOpen}
              aria-controls={`project-details-${project.slug}`}
              onClick={toggleDetails}
              className="group/toggle inline-flex items-center gap-2 py-1.5 -my-1.5 font-mono text-xs uppercase tracking-widest text-text-secondary transition-colors hover:text-text-primary"
            >
              <span
                aria-hidden
                className={clsx(
                  "relative inline-flex h-3.5 w-3.5 items-center justify-center transition-transform duration-300 motion-reduce:transition-none",
                  detailsOpen && "rotate-45"
                )}
              >
                <span className="absolute h-px w-3 bg-current" />
                <span className="absolute h-3 w-px bg-current" />
              </span>
              {detailsOpen ? "Hide details" : "Details"}
            </button>
            <span aria-hidden className="text-text-secondary">
              ·
            </span>
            <Link
              href={`/projects/${project.slug}`}
              className="group/cta inline-flex items-center gap-2 py-1.5 -my-1.5 font-mono text-xs uppercase tracking-widest text-text-secondary transition-colors hover:text-text-primary"
            >
              View case study
              <span
                aria-hidden
                className="inline-block leading-none transition-transform duration-300 group-hover/cta:translate-x-1"
              >
                →
              </span>
            </Link>
          </div>
        )}

        <div
          ref={detailsPanelRef}
          id={coverHeading === "title" ? `project-details-${project.slug}` : undefined}
          className={clsx(
            coverHeading === "title" &&
              "grid transition-[grid-template-rows] duration-300 ease-out motion-reduce:transition-none",
            coverHeading === "title" &&
              (detailsOpen ? "grid-rows-[1fr]" : "grid-rows-[0fr]")
          )}
        >
          <div className={clsx(coverHeading === "title" && "min-h-0 overflow-hidden")}>
            <ul className="mt-4 space-y-2.5">
              {(project.features && project.features.length > 0
                ? project.features
                : genericBullets(project.title)
              )
                .slice(0, 3)
                .map((b, bi) => (
                  <li
                    key={bi}
                    className="flex text-[15px] leading-6 text-text-secondary"
                  >
                    <span
                      aria-hidden="true"
                      className={`mr-2 flex h-6 shrink-0 items-center font-mono ${hueText[i % hueText.length]}`}
                    >
                      ✦
                    </span>
                    <span>{b}</span>
                  </li>
                ))}
            </ul>
            {project.tech.length > 0 && (
              <div className="mt-4 flex max-h-[124px] flex-wrap gap-2 overflow-hidden">
                {(coverHeading === "title"
                  ? project.tech.slice(0, 5)
                  : project.tech
                ).map((t) => (
                  <TechChip key={t} name={t} />
                ))}
                {coverHeading === "title" && project.tech.length > 5 && (
                  /* Cap at five chips — the full stack lives on the case
                     study page. Keeps the panel tidy and even per project. */
                  <span className="inline-flex items-center rounded-full border border-dashed border-border-primary px-3 py-1 font-mono text-xs text-text-secondary">
                    +{project.tech.length - 5}
                  </span>
                )}
              </div>
            )}
          </div>
        </div>
        {coverHeading !== "title" && (
          <Link
            href={`/projects/${project.slug}`}
            className="group/cta mt-5 inline-flex items-center gap-2 py-1.5 -my-1.5 font-mono text-xs uppercase tracking-widest text-text-secondary transition-colors hover:text-text-primary"
          >
            View case study
            <span
              aria-hidden
              className="inline-block leading-none transition-transform duration-300 group-hover/cta:translate-x-1"
            >
              →
            </span>
          </Link>
        )}
      </div>
    </motion.article>
  );
}

function StickyProjectPanel({
  project,
  index,
}: {
  project: HomeProject;
  index: number;
}) {
  const bullets = (
    project.features && project.features.length > 0
      ? project.features
      : genericBullets(project.title)
  ).slice(0, 3);

  return (
    <div key={project.slug}>
      <div className="flex items-center gap-3">
        <span
          aria-hidden
          className={`h-[3px] w-8 shrink-0 rounded-full ${hueBg[index % hueBg.length]}`}
        />
        <h3 className="font-display text-3xl font-medium leading-tight text-text-primary">
          {project.title}
        </h3>
      </div>
      {/* The description and tech rows stay compact, while feature bullets
          wrap fully so important project details are never truncated. */}
      <p className="mt-4 line-clamp-3 text-[15px] leading-relaxed text-text-secondary">
        {project.description}
      </p>
      <ul className="mt-[22px] space-y-[7px]">
        {bullets.map((b, i) => (
          <li key={i} className="flex text-[15px] leading-6 text-text-secondary">
            <span
              aria-hidden="true"
              className={`mr-2 flex h-6 shrink-0 items-center font-mono ${hueText[index % hueText.length]}`}
            >
              ✦
            </span>
            <span>{b}</span>
          </li>
        ))}
      </ul>
      {project.tech.length > 0 && (
        <div className="mt-[22px] flex max-h-[124px] flex-wrap gap-2 overflow-hidden">
          {project.tech.map((t) => (
            <TechChip key={t} name={t} />
          ))}
        </div>
      )}
      {/* CTA — mouse-clickable; tabIndex -1 keeps it out of the tab order
          since the panel is aria-hidden (the card link is the a11y path). */}
      <Link
        href={`/projects/${project.slug}`}
        tabIndex={-1}
        className="group/cta mt-6 inline-flex items-center gap-2 py-1.5 -my-1.5 font-mono text-xs uppercase tracking-widest text-text-secondary transition-colors hover:text-text-primary"
      >
        View case study
        <span
          aria-hidden
          className="inline-block leading-none transition-transform duration-300 group-hover/cta:translate-x-1"
        >
          →
        </span>
      </Link>
    </div>
  );
}

export function CaseStudies({ projects }: { projects: HomeProject[] }) {
  const [activeIndex, setActiveIndex] = useState(0);
  /* Accordion: only one card's Details panel open at a time (same
     behavior as the projects page). */
  const [detailsOpenSlug, setDetailsOpenSlug] = useState<string | null>(null);
  const cardRefs = useRef<(HTMLDivElement | null)[]>([]);

  useEffect(() => {
    if (typeof IntersectionObserver === "undefined") return;
    const observer = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) {
          // Only react to cards entering the band; when a card leaves and
          // nothing new enters (gaps between cards), keep the last active
          // card — no flicker.
          if (!entry.isIntersecting) continue;
          const idx = Number((entry.target as HTMLElement).dataset.index);
          if (!Number.isNaN(idx)) setActiveIndex(idx);
        }
      },
      // Fire when a card's center crosses the exclusive middle band.
      { rootMargin: "-45% 0px -45% 0px", threshold: 0 },
    );
    cardRefs.current.forEach((el) => el && observer.observe(el));
    return () => observer.disconnect();
  }, [projects.length]);

  const activeProject = projects[activeIndex] ?? projects[0];

  return (
    <section className="px-2 sm:px-4">
      <motion.div
        initial={false}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true, margin: "-80px" }}
        transition={{ duration: 0.6 }}
      >
        <SectionHeading kicker="Case Studies">
          Selected{" "}
          <span className="animate-gradient-x text-colorfull px-1 pb-1 italic [text-shadow:none]">
            builds
          </span>
        </SectionHeading>
      </motion.div>

      <div className="mt-14 grid grid-cols-1 xl:grid-cols-12 xl:gap-10">
        <div className="min-w-0 space-y-20 xl:col-span-7">
          {projects.map((project, i) => (
            <div
              key={project.slug}
              data-index={i}
              ref={(el) => {
                cardRefs.current[i] = el;
              }}
            >
              {/* Home cards now render with the exact projects-page card
                  recipe (geometry, hover, structure, chips, min-height) so
                  both pages share one identical card system. */}
              <CaseStudyCard
                project={project}
                index={i}
                coverMinHClass="xl:min-h-[392px]"
                liftOnHover={false}
                coverHeading="title"
                bodyHiddenOnXl
                detailsOpen={detailsOpenSlug === project.slug}
                onToggleDetails={() =>
                  setDetailsOpenSlug((cur) =>
                    cur === project.slug ? null : project.slug
                  )
                }
              />
            </div>
          ))}
        </div>

        {/* Sticky synced panel — xl and up only */}
        <aside className="hidden min-w-0 xl:col-span-5 xl:block" aria-hidden="true">
          {/* No card/box — the text floats on the page background and swaps
              instantly (hard cut, zero animation) to the next project the
              moment its card crosses mid-viewport. */}
          {/* Pinned area spans the viewport below the navbar; the text block
              is vertically centered inside it so the whole panel — title
              through the "View case study" CTA — is always fully visible,
              even on shorter laptop screens. */}
          <div className="sticky top-28 flex min-h-[420px] py-4 xl:h-[calc(100vh-9rem)] xl:items-center">
            <div className="w-full">
              {activeProject && (
                <StickyProjectPanel
                  key={activeProject.slug}
                  project={activeProject}
                  index={activeIndex}
                />
              )}
            </div>
          </div>
        </aside>
      </div>

      <div className="mt-16 flex justify-center">
        <Link
          href="/projects"
          className="group inline-flex items-center gap-3 font-mono text-xs font-normal uppercase tracking-widest text-text-secondary transition-colors hover:text-text-primary"
        >
          See more projects
          <span className="inline-flex size-8 items-center justify-center rounded-full border border-border-primary">
            <DoubleArrow />
          </span>
        </Link>
      </div>
    </section>
  );
}
