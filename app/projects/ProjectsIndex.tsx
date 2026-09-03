"use client";

/* Audited under audit/06-projects-page.md; awaiting owner lock approval. */

import { Fragment, Suspense, useEffect, useMemo, useRef, useState } from "react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { motion, useReducedMotion } from "framer-motion";
import { Search } from "lucide-react";
import type { HomeProject } from "@/app/data/fallback-home";
import { CaseStudyCard, projectTags } from "@/app/components/home/CaseStudies";

/*
 * Projects index — production controls for a growing catalog:
 *
 * - Search (title / tagline / description / tech / tags), debounced.
 * - Tag filters built from the SAME labels the cards display. Scales to
 *   20+ projects: the row shows the most-used tags (with live counts)
 *   and folds the long tail behind a "+N more" toggle.
 * - Pagination: 8 projects per page, numbering continues across pages.
 * - URL-synced state (?tag=&q=&page=) — refresh-safe, shareable,
 *   back/forward friendly.
 * - Subtle staggered reveal when results change (reduced-motion safe).
 */

const PER_PAGE = 8;
/* The three primary domains always shown inline — everything else lives
   behind the "More" dropdown. */
const PRIMARY_TAGS = ["AI/ML", "Cybersecurity", "Web"];

function ProjectsIndexInner({ projects }: { projects: HomeProject[] }) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const reducedMotion = useReducedMotion();

  /* Accordion: only one card's Details panel open at a time. */
  const [detailsOpenSlug, setDetailsOpenSlug] = useState<string | null>(null);
  const topRef = useRef<HTMLElement | null>(null);

  // ── State lives in the URL ────────────────────────────────────────
  const activeTag = searchParams.get("tag") ?? "All";
  const q = searchParams.get("q") ?? "";
  const page = Math.max(1, parseInt(searchParams.get("page") ?? "1", 10) || 1);

  const [query, setQuery] = useState(q);
  const [showAllTags, setShowAllTags] = useState(false);
  const moreRef = useRef<HTMLDivElement | null>(null);
  const moreButtonRef = useRef<HTMLButtonElement | null>(null);
  const searchRef = useRef<HTMLInputElement | null>(null);

  // "/" focuses the search field (ignored while typing elsewhere).
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key !== "/" || e.metaKey || e.ctrlKey || e.altKey) return;
      const el = document.activeElement as HTMLElement | null;
      if (el && (el.tagName === "INPUT" || el.tagName === "TEXTAREA" || el.isContentEditable))
        return;
      e.preventDefault();
      searchRef.current?.focus();
    };
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, []);

  // Close the "More" dropdown on outside click / Escape.
  useEffect(() => {
    if (!showAllTags) return;
    const onDown = (e: MouseEvent | TouchEvent) => {
      if (moreRef.current && !moreRef.current.contains(e.target as Node)) {
        setShowAllTags(false);
      }
    };
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        setShowAllTags(false);
        requestAnimationFrame(() => moreButtonRef.current?.focus());
      }
      /* Menu keyboard nav: arrows cycle through the tag rows, Home/End
         jump, Enter activates the focused row (native button behavior). */
      if (["ArrowDown", "ArrowUp", "Home", "End"].includes(e.key)) {
        const rows = moreRef.current?.querySelectorAll<HTMLButtonElement>(
          "#projects-more-tags button",
        );
        if (!rows || rows.length === 0) return;
        e.preventDefault();
        const list = [...rows];
        const idx = list.indexOf(document.activeElement as HTMLButtonElement);
        let next = 0;
        if (e.key === "ArrowDown") next = idx < list.length - 1 ? idx + 1 : 0;
        else if (e.key === "ArrowUp") next = idx > 0 ? idx - 1 : list.length - 1;
        else if (e.key === "End") next = list.length - 1;
        list[next].focus();
      }
    };
    document.addEventListener("mousedown", onDown);
    document.addEventListener("touchstart", onDown);
    document.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("mousedown", onDown);
      document.removeEventListener("touchstart", onDown);
      document.removeEventListener("keydown", onKey);
    };
  }, [showAllTags]);

  function setParams(
    next: { tag?: string; q?: string; page?: number },
    history: "push" | "replace" = "push"
  ) {
    const params = new URLSearchParams(searchParams.toString());
    const apply = (key: string, value: string | undefined, def: string) => {
      if (value === undefined) return;
      if (value === def) params.delete(key);
      else params.set(key, value);
    };
    apply("tag", next.tag, "All");
    apply("q", next.q, "");
    apply("page", next.page !== undefined ? String(next.page) : undefined, "1");
    const href = `${pathname}${params.size ? `?${params}` : ""}`;
    if (history === "replace") router.replace(href, { scroll: false });
    else router.push(href, { scroll: false });
  }

  // Browser back/forward can change the URL independently of the input.
  useEffect(() => {
    setQuery(q);
  }, [q]);

  // Debounced search → URL (any new search resets to page 1). Replacing keeps
  // normal typing from adding one browser-history entry per query update.
  useEffect(() => {
    if (query === q) return;
    const t = setTimeout(
      () => setParams({ q: query, page: 1 }, "replace"),
      300
    );
    return () => clearTimeout(t);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [query]);

  // ── Tags with counts, most-used first ─────────────────────────────
  const tagCounts = useMemo(() => {
    const counts = new Map<string, number>();
    projects.forEach((p) =>
      projectTags(p).forEach((t) => counts.set(t, (counts.get(t) ?? 0) + 1)),
    );
    return [...counts.entries()].sort(
      (a, b) => b[1] - a[1] || a[0].localeCompare(b[0]),
    );
  }, [projects]);

  const { headTags, overflowTags } = useMemo(() => {
    const all = tagCounts.map(([t]) => t);
    const head = PRIMARY_TAGS.filter((t) => all.includes(t));
    const overflow = all.filter((t) => !head.includes(t));
    return { headTags: head, overflowTags: overflow };
  }, [tagCounts]);
  const foldedCount = overflowTags.length;
  const overflowActive = overflowTags.includes(activeTag);

  // ── Filter: tag AND search ─────────────────────────────────────────
  const filtered = useMemo(() => {
    const needle = q.trim().toLowerCase();
    return projects.filter((p) => {
      if (activeTag !== "All" && !projectTags(p).includes(activeTag))
        return false;
      if (!needle) return true;
      const hay = [
        p.title,
        p.tagline,
        p.description,
        ...(p.tech ?? []),
        ...projectTags(p),
      ]
        .join(" ")
        .toLowerCase();
      return hay.includes(needle);
    });
  }, [projects, activeTag, q]);

  // ── No-results rescue: when the search matches projects that the
  //    active tag filters out, suggest the tags where matches live. ────
  const rescueTags = useMemo(() => {
    if (filtered.length > 0) return [];
    const needle = q.trim().toLowerCase();
    if (!needle) return [];
    const counts = new Map<string, number>();
    projects.forEach((p) => {
      const hay = [
        p.title,
        p.tagline,
        p.description,
        ...(p.tech ?? []),
        ...projectTags(p),
      ]
        .join(" ")
        .toLowerCase();
      if (!hay.includes(needle)) return;
      projectTags(p).forEach((t) => {
        if (t !== activeTag) counts.set(t, (counts.get(t) ?? 0) + 1);
      });
    });
    return [...counts.entries()]
      .sort((a, b) => b[1] - a[1] || a[0].localeCompare(b[0]))
      .slice(0, 3)
      .map(([t]) => t);
  }, [filtered.length, q, projects, activeTag]);

  // ── Pagination ─────────────────────────────────────────────────────
  const totalPages = Math.max(1, Math.ceil(filtered.length / PER_PAGE));
  const safePage = Math.min(page, totalPages);
  const start = (safePage - 1) * PER_PAGE;
  const pageItems = filtered.slice(start, start + PER_PAGE);

  // Windowed page list: always show first/last, current ±1, and collapse
  // longer runs into an ellipsis so the control stays compact at any count.
  const pageList: (number | "…")[] = (() => {
    if (totalPages <= 7)
      return Array.from({ length: totalPages }, (_, i) => i + 1);
    const wanted = new Set([
      1,
      totalPages,
      safePage - 1,
      safePage,
      safePage + 1,
    ]);
    const out: (number | "…")[] = [];
    for (let n = 1; n <= totalPages; n++) {
      if (wanted.has(n)) out.push(n);
      else if (out[out.length - 1] !== "…") out.push("…");
    }
    return out;
  })();

  function goToPage(n: number) {
    setParams({ page: n });
    topRef.current?.scrollIntoView({
      behavior: reducedMotion ? "auto" : "smooth",
      block: "start",
    });
  }

  /* Inline chips (All + primary tags): inverted ink pill glides between the
     active tags via a shared layout element — same motion language as the
     pagination's page pill. */
  const inlineChipClass = (active: boolean) =>
    `relative inline-flex h-[2rem] items-center rounded-full border px-1.5 font-mono text-[11px] uppercase tracking-normal transition-colors sm:px-4 sm:tracking-widest ${
      active
        ? "border-text-primary text-bg-primary"
        : "border-border-primary text-text-secondary hover:border-text-tertiary hover:text-text-primary"
    }`;

  const chipPill = (active: boolean) =>
    active ? (
      <motion.span
        layoutId="projects-tag-pill"
        aria-hidden
        className="absolute inset-0 rounded-full bg-text-primary"
        transition={
          reducedMotion
            ? { duration: 0 }
            : { type: "spring", stiffness: 500, damping: 38 }
        }
      />
    ) : null;

  return (
    <section ref={topRef} aria-labelledby="project-collection-heading" className="scroll-mt-20">
      <h2 id="project-collection-heading" className="sr-only">
        Project collection
      </h2>
      <p className="sr-only" role="status" aria-live="polite" aria-atomic="true">
        {filtered.length === 0
          ? "No projects found"
          : `${filtered.length} ${filtered.length === 1 ? "project" : "projects"} found`}
      </p>
      {/* Controls — search + domain chips + "More" dropdown, one row. */}
      <div className="mx-auto mt-6 flex flex-wrap items-center justify-center gap-2 max-lg:gap-y-[9px]">
        <label htmlFor="project-search" className="sr-only">
          Search projects
        </label>
        {/* On stacked layouts (below lg the search sits on its own line
            above the pills) the search bar matches the pills-row width
            (297px compact / 439px at sm+) so both lines read as one
            aligned control block. From lg up they share a line and the
            search returns to its original 224px. */}
        <div className="relative w-full max-w-[297px] sm:w-[439px] sm:max-w-[439px] lg:w-56 lg:max-w-[260px]">
          <Search
            aria-hidden
            strokeWidth={1.5}
            className="pointer-events-none absolute left-3.5 top-1/2 size-4 -translate-y-1/2 text-text-secondary"
          />
          <input
            id="project-search"
            ref={searchRef}
            type="search"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search projects…"
            onKeyDown={(e) => {
              if (e.key === "Enter") (e.target as HTMLInputElement).blur();
              if (e.key === "Escape") {
                /* First Esc clears the query, second Esc leaves the field. */
                if (query) setQuery("");
                else (e.target as HTMLInputElement).blur();
              }
            }}
            className="h-[2rem] w-full rounded-full border border-border-primary bg-white pl-10 pr-9 font-mono text-xs text-text-primary outline-none transition-colors placeholder:text-text-secondary hover:border-text-tertiary focus:border-text-tertiary dark:bg-white/[0.03] [&::-webkit-search-cancel-button]:hidden"
          />
          {!query && (
            /* Keyboard hint — press "/" anywhere to jump to search. */
            <kbd
              aria-hidden
              className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 rounded border border-border-primary px-1.5 py-px font-mono text-[10px] leading-4 text-text-secondary"
            >
              /
            </kbd>
          )}
          {query && (
            <button
              type="button"
              aria-label="Clear search"
              onClick={() => setQuery("")}
              className="absolute right-2.5 top-1/2 flex size-5 -translate-y-1/2 items-center justify-center rounded-full text-text-secondary transition-colors hover:bg-black/5 hover:text-text-primary dark:hover:bg-white/10"
            >
              <svg aria-hidden viewBox="0 0 12 12" fill="none" className="size-3">
                <path d="m3 3 6 6M9 3l-6 6" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
              </svg>
            </button>
          )}
        </div>

        <div
          className="flex flex-wrap items-center justify-center gap-1 sm:gap-2"
          role="group"
          aria-label="Filter projects by tag"
        >
          <button
            type="button"
            aria-pressed={activeTag === "All"}
            onClick={() => setParams({ tag: "All", page: 1 })}
            className={inlineChipClass(activeTag === "All")}
          >
            {chipPill(activeTag === "All")}
            <span className="relative">All</span>
          </button>
          {headTags.map((tag) => (
            <button
              key={tag}
              type="button"
              aria-pressed={activeTag === tag}
              onClick={() =>
                setParams({ tag: activeTag === tag ? "All" : tag, page: 1 })
              }
              className={inlineChipClass(activeTag === tag)}
            >
              {chipPill(activeTag === tag)}
              <span className="relative">{tag}</span>
            </button>
          ))}

          {/* "More" dropdown for the long tail of tags */}
          {foldedCount > 0 && (
            <div
              ref={moreRef}
              className="relative"
              onBlur={(event) => {
                if (!event.currentTarget.contains(event.relatedTarget as Node | null)) {
                  setShowAllTags(false);
                }
              }}
            >
              <button
                type="button"
                ref={moreButtonRef}
                aria-expanded={showAllTags}
                aria-haspopup="menu"
                aria-controls="projects-more-tags"
                onClick={() => setShowAllTags((v) => !v)}
                className={`relative flex h-[2rem] items-center gap-1 rounded-full border px-1.5 font-mono text-[11px] uppercase tracking-normal transition-colors sm:px-4 sm:tracking-widest ${
                  overflowActive
                    ? "border-text-primary text-bg-primary"
                    : "border-border-primary text-text-secondary hover:border-text-tertiary hover:text-text-primary"
                }`}
              >
                {chipPill(overflowActive)}
                <span className="relative">{overflowActive ? activeTag : "More"}</span>
                <svg
                  aria-hidden
                  viewBox="0 0 12 12"
                  fill="none"
                  className={`relative size-3 transition-transform ${showAllTags ? "rotate-180" : ""}`}
                >
                  <path d="m3 4.5 3 3 3-3" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
                </svg>
              </button>
              {showAllTags && (
                <motion.div
                  id="projects-more-tags"
                  initial={reducedMotion ? false : { opacity: 0, y: 6, scale: 0.98 }}
                  animate={{ opacity: 1, y: 0, scale: 1 }}
                  transition={{ duration: 0.16, ease: "easeOut" }}
                  className="absolute right-0 top-full z-20 mt-2 w-60 max-w-[calc(100vw-2.5rem)] overflow-hidden rounded-xl border border-border-primary bg-bg-primary shadow-xl"
                  role="menu"
                  aria-label="More tags"
                >
                  {/* Blueprint header — kicker + live count, closed by the
                      same open-dot rule the grid uses. */}
                  <div className="flex items-baseline justify-between px-3.5 pb-2 pt-3">
                    <span className="font-mono text-[10px] uppercase tracking-[0.25em] text-text-secondary">
                      More tags
                    </span>
                    <span className="font-mono text-[10px] text-text-secondary">
                      {String(overflowTags.length).padStart(2, "0")}
                    </span>
                  </div>
                  <div
                    aria-hidden
                    className="mx-3.5 h-px"
                    style={{
                      backgroundImage:
                        "repeating-linear-gradient(90deg, var(--rule-color) 0 1px, transparent 1px 4px)",
                    }}
                  />
                  {/* Command-menu rows: tag left, project count right. The
                      active tag reads as an inked row, mirroring the chips. */}
                  <ul role="none" className="max-h-64 overflow-y-auto p-1.5 [scrollbar-width:thin] [scrollbar-color:var(--border-primary)_transparent] [&::-webkit-scrollbar]:w-1.5 [&::-webkit-scrollbar-thumb]:rounded-full [&::-webkit-scrollbar-thumb]:bg-border-primary [&::-webkit-scrollbar-track]:bg-transparent">
                    {overflowTags.map((tag) => {
                      const active = activeTag === tag;
                      const count =
                        tagCounts.find(([t]) => t === tag)?.[1] ?? 0;
                      return (
                        <li key={tag} role="none">
                          <button
                            type="button"
                            role="menuitemradio"
                            aria-checked={active}
                            onClick={() => {
                              setParams({
                                tag: active ? "All" : tag,
                                page: 1,
                              });
                              setShowAllTags(false);
                            }}
                            className={`group/row flex w-full items-center justify-between gap-3 rounded-lg px-2.5 py-2 font-mono text-[11px] uppercase tracking-widest transition-colors ${
                              active
                                ? "bg-text-primary text-bg-primary"
                                : "text-text-secondary hover:bg-black/[0.04] hover:text-text-primary dark:hover:bg-white/[0.06]"
                            }`}
                          >
                            <span className="flex items-center gap-2">
                              <span
                                aria-hidden
                                className={`h-1 w-1 rounded-full transition-colors ${
                                  active
                                    ? "bg-bg-primary"
                                    : "bg-text-tertiary/60 group-hover/row:bg-text-tertiary"
                                }`}
                              />
                              {tag}
                            </span>
                            <span
                              className={
                                active ? "text-bg-primary/70" : "text-text-secondary"
                              }
                            >
                              {String(count).padStart(2, "0")}
                            </span>
                          </button>
                        </li>
                      );
                    })}
                  </ul>
                </motion.div>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Grid — 8 per page. Below xl: single column. From xl: staggered
          two-column layout — the right column starts lower so the cards
          alternate down the page (editorial case-study rhythm). The whole
          scaffold (columns, spine, closing rule) unmounts when there are no
          results so the empty state stands alone. */}
      {filtered.length > 0 && (
      /* Keyed by the active filter so tag/search changes cross-fade the
         whole grid in — one soft transition instead of an instant swap. */
      <motion.div
        key={`grid-${activeTag}-${q}`}
        initial={reducedMotion ? false : { opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.3, ease: "easeOut" }}
      >
      <div className="mt-14 space-y-20 xl:hidden">
        {pageItems.map((project, i) => (
          <motion.div
            key={`${activeTag}-${q}-${safePage}-${project.slug}`}
            onMouseEnter={() => router.prefetch(`/projects/${project.slug}`)}
            initial={reducedMotion ? false : { opacity: 0, y: 18 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, amount: 0.1 }}
            transition={{ duration: 0.45, delay: (i % 2) * 0.06, ease: "easeOut" }}
          >
            <CaseStudyCard
              project={project}
              index={start + i}
              coverMinHClass="xl:min-h-[384px]"
              metaDividerClass="mx-0"
              liftOnHover={false}
              coverHeading="title"
              coverArrow="line"
              decorativeCoverImage
              imagePriority={i === 0}
              imageSizes="(max-width: 1279px) 100vw, 50vw"
              highlight={q}
              detailsOpen={detailsOpenSlug === project.slug}
              onToggleDetails={() =>
                setDetailsOpenSlug((cur) =>
                  cur === project.slug ? null : project.slug
                )
              }
            />
          </motion.div>
        ))}
      </div>
      <div className="mt-14 hidden xl:flex xl:gap-6">
        {[0, 1].map((col) => (
          <Fragment key={col}>
            {col === 1 && (
              /* Vertical divider between the two staggered columns. Starts
                 exactly at project 01's junction node (46.5px = meta row
                 height above the dotted rule) instead of poking above it. */
              <div
                aria-hidden
                className="mt-[46.5px] -mb-20 w-px shrink-0 self-stretch"
                style={{ backgroundColor: "color-mix(in srgb, var(--rule-color) 90%, transparent)" }}
              />
            )}
            <div
              className={`min-w-0 flex-1 space-y-20 ${
                col === 1 ? "mr-2 mt-[213px]" : "ml-2"
              }`}
            >
            {pageItems
              .map((project, i) => ({ project, i }))
              .filter(({ i }) => i % 2 === col)
              .map(({ project, i }) => (
                <motion.div
                  key={`${activeTag}-${q}-${safePage}-${project.slug}`}
                  onMouseEnter={() =>
                    router.prefetch(`/projects/${project.slug}`)
                  }
                  initial={reducedMotion ? false : { opacity: 0, y: 18 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true, amount: 0.1 }}
                  transition={{
                    duration: 0.45,
                    delay: (i % 2) * 0.06,
                    ease: "easeOut",
                  }}
                >
                  <CaseStudyCard
                    project={project}
                    index={start + i}
                    coverMinHClass="xl:min-h-[384px]"
                    metaDividerClass={
                      col === 0
                        ? "xl:-ml-6 xl:-mr-[25px]"
                        : "xl:-ml-[25px] xl:-mr-6"
                    }
                    metaDividerJoint={col === 0 ? "right" : "left"}
                    liftOnHover={false}
                    coverHeading="title"
                    coverArrow="line"
                    decorativeCoverImage
                    imagePriority={i === 0}
                    imageSizes="(max-width: 1279px) 100vw, 50vw"
                    highlight={q}
                    detailsOpen={detailsOpenSlug === project.slug}
                    onToggleDetails={() =>
                      setDetailsOpenSlug((cur) =>
                        cur === project.slug ? null : project.slug
                      )
                    }
                  />
                </motion.div>
              ))}
            </div>
          </Fragment>
        ))}
      </div>
      {/* Single closing dotted rule spanning both columns — frames the whole
          grid; the spine (extended via -mb-20) terminates on its center at a
          neutral junction node. */}
      <div
        aria-hidden
        className="relative -mx-4 mt-20 hidden border-t border-dotted xl:block"
        style={{ borderTopColor: "color-mix(in srgb, var(--rule-color) 85%, transparent)" }}
      >
        <span className="absolute left-1/2 top-0 flex -translate-x-1/2 -translate-y-1/2 items-center justify-center opacity-[0.9]">
          <span
            className="absolute h-6 w-6 rounded-full blur-[7px]"
            style={{ backgroundColor: "rgba(100,106,124,0.10)" }}
          />
          <span className="relative flex h-[13px] w-[13px] items-center justify-center rounded-full border border-text-tertiary bg-bg-primary shadow-[0_0_0_3px_rgba(100,106,124,0.12)]">
            <span className="h-[4px] w-[4px] rounded-full bg-text-tertiary shadow-[0_0_6px_rgba(100,106,124,0.6)]" />
          </span>
        </span>
      </div>
      </motion.div>
      )}

      {filtered.length === 0 && (
        <div className="mt-10 rounded-2xl border border-dashed border-border-primary px-6 py-16 text-center">
          <p className="font-mono text-xs uppercase tracking-[0.25em] text-text-secondary">
            Nothing here yet
          </p>
          <p className="mt-3 text-sm text-text-secondary">
            No projects match{q ? ` “${q}”` : " this filter"} — try a different
            search or tag.
          </p>
          {rescueTags.length > 0 && (
            /* The search DOES match projects — they're just hidden behind
               another tag. Offer one-click jumps that keep the query. */
            <div className="mt-5 flex flex-wrap items-center justify-center gap-2">
              <span className="font-mono text-[11px] uppercase tracking-widest text-text-secondary">
                Matches found under:
              </span>
              {rescueTags.map((tag) => (
                <button
                  key={tag}
                  type="button"
                  onClick={() => setParams({ tag, page: 1 })}
                  className="rounded-full border border-border-primary px-3 py-1 font-mono text-[11px] uppercase tracking-widest text-text-secondary transition-colors hover:border-text-tertiary hover:text-text-primary"
                >
                  {tag}
                </button>
              ))}
            </div>
          )}
          <button
            type="button"
            onClick={() => {
              setQuery("");
              setParams({ tag: "All", q: "", page: 1 });
            }}
            className="mt-5 rounded-full border border-border-primary px-4 py-1.5 font-mono text-[11px] uppercase tracking-widest text-text-secondary transition-colors hover:border-text-tertiary hover:text-text-primary"
          >
            Clear filters
          </button>
        </div>
      )}

      {/* Pagination — windowed page list with results summary. Current page
          uses an inverted pill (ink-on-paper in light, paper-on-ink in dark)
          so it reads unambiguously in both modes. */}
      {totalPages > 1 && (
        <nav
          aria-label="Projects pages"
          className="mt-20 flex flex-col items-center gap-4"
        >
          <div className="flex flex-wrap items-center justify-center gap-2">
            <button
              type="button"
              aria-label="Previous page"
              onClick={() => goToPage(safePage - 1)}
              disabled={safePage === 1}
              className="inline-flex min-h-[2rem] items-center gap-2 rounded-full border border-border-primary px-4 py-1.5 font-mono text-[11px] uppercase tracking-widest text-text-secondary transition-colors hover:border-text-tertiary hover:text-text-primary focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-text-tertiary disabled:pointer-events-none disabled:opacity-40"
            >
              <span aria-hidden>←</span>
              <span className="hidden sm:inline">Prev</span>
            </button>
            {pageList.map((item, idx) =>
              item === "…" ? (
                <span
                  key={`gap-${idx}`}
                  aria-hidden
                  className="flex size-[2rem] items-center justify-center font-mono text-xs text-text-secondary"
                >
                  …
                </span>
              ) : (
                <button
                  key={item}
                  type="button"
                  aria-label={
                    item === safePage
                      ? `Page ${item}, current page`
                      : `Go to page ${item}`
                  }
                  aria-current={item === safePage ? "page" : undefined}
                  onClick={() => goToPage(item)}
                  className={`relative flex h-[2rem] min-w-[2rem] items-center justify-center rounded-full border px-1 font-mono text-xs transition-colors focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-text-tertiary ${
                    item === safePage
                      ? "border-text-primary text-bg-primary"
                      : "border-border-primary text-text-secondary hover:border-text-tertiary hover:text-text-primary"
                  }`}
                >
                  {item === safePage && (
                    /* Shared-layout ink pill glides between page numbers on
                       change (snaps instantly under reduced motion). */
                    <motion.span
                      layoutId="projects-page-pill"
                      aria-hidden
                      className="absolute inset-0 rounded-full bg-text-primary"
                      transition={
                        reducedMotion
                          ? { duration: 0 }
                          : { type: "spring", stiffness: 500, damping: 38 }
                      }
                    />
                  )}
                  <span className="relative">
                    {String(item).padStart(2, "0")}
                  </span>
                </button>
              )
            )}
            <button
              type="button"
              aria-label="Next page"
              onClick={() => goToPage(safePage + 1)}
              disabled={safePage === totalPages}
              className="inline-flex min-h-[2rem] items-center gap-2 rounded-full border border-border-primary px-4 py-1.5 font-mono text-[11px] uppercase tracking-widest text-text-secondary transition-colors hover:border-text-tertiary hover:text-text-primary focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-text-tertiary disabled:pointer-events-none disabled:opacity-40"
            >
              <span className="hidden sm:inline">Next</span>
              <span aria-hidden>→</span>
            </button>
          </div>
          <p
            aria-live="polite"
            className="flex items-center gap-3 font-mono text-[11px] uppercase tracking-[0.25em] text-text-secondary"
          >
            <span
              aria-hidden
              className="w-8 border-t border-dotted"
              style={{ borderTopColor: "color-mix(in srgb, var(--rule-color) 85%, transparent)" }}
            />
            Showing {String(start + 1).padStart(2, "0")}–
            {String(Math.min(start + PER_PAGE, filtered.length)).padStart(2, "0")} of{" "}
            {String(filtered.length).padStart(2, "0")}
            <span
              aria-hidden
              className="w-8 border-t border-dotted"
              style={{ borderTopColor: "color-mix(in srgb, var(--rule-color) 85%, transparent)" }}
            />
          </p>
        </nav>
      )}
    </section>
  );
}

export function ProjectsIndex({ projects }: { projects: HomeProject[] }) {
  // useSearchParams requires a Suspense boundary during prerender.
  return (
    <Suspense fallback={null}>
      <ProjectsIndexInner projects={projects} />
    </Suspense>
  );
}
