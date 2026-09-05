"use client";

/* Temporarily unlocked for the owner-directed Blog controls/state parity amendment. */

import {
  Fragment,
  Suspense,
  useEffect,
  useMemo,
  useRef,
  useState,
  type FocusEvent,
} from "react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { motion, useReducedMotion } from "framer-motion";
import { Search, X } from "lucide-react";
import type { HomeProject } from "@/app/data/fallback-home";
import { CaseStudyCard, projectTags } from "@/app/components/home/CaseStudies";
import { BlogStatePanel } from "@/app/components/blog/BlogStatePanel";

/*
 * Projects index — production controls for a growing catalog:
 *
 * - Search (title / tagline / description / tech / tags), debounced.
 * - Tag filters built from the SAME labels the cards display in a horizontally
 *   scrollable rail that matches the Blog category filters.
 * - Pagination: 8 projects per page, numbering continues across pages.
 * - URL-synced state (?tag=&q=&page=) — refresh-safe, shareable,
 *   back/forward friendly.
 * - Subtle staggered reveal when results change (reduced-motion safe).
 */

const PER_PAGE = 8;

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
  const searchRef = useRef<HTMLInputElement | null>(null);
  const filtersRef = useRef<HTMLDivElement | null>(null);
  const [filterEdges, setFilterEdges] = useState({ left: false, right: false });
  const skipNextSearchSyncRef = useRef(false);

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

  useEffect(() => {
    const filters = filtersRef.current;
    if (!filters) return;
    let active = true;

    const updateEdges = () => {
      if (!active) return;
      const maxScroll = Math.max(0, filters.scrollWidth - filters.clientWidth);
      const next = {
        left: filters.scrollLeft > 1,
        right: filters.scrollLeft < maxScroll - 1,
      };
      setFilterEdges((current) =>
        current.left === next.left && current.right === next.right ? current : next,
      );
    };

    updateEdges();
    const observer = new ResizeObserver(updateEdges);
    observer.observe(filters);
    document.fonts?.ready.then(updateEdges);
    return () => {
      active = false;
      observer.disconnect();
    };
  }, [projects]);

  const handleFilterFocus = (event: FocusEvent<HTMLButtonElement>) => {
    const target = event.currentTarget;
    window.requestAnimationFrame(() => {
      if (target.matches(":focus-visible")) {
        target.scrollIntoView({ block: "nearest", inline: "center" });
      }
    });
  };

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
    if (skipNextSearchSyncRef.current) {
      skipNextSearchSyncRef.current = false;
      return;
    }
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

  const tags = tagCounts.map(([tag]) => tag);
  const invalidTag = activeTag !== "All" && !tags.includes(activeTag);

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

  // ── Pagination ─────────────────────────────────────────────────────
  const totalPages = Math.max(1, Math.ceil(filtered.length / PER_PAGE));
  const safePage = Math.min(page, totalPages);
  const start = (safePage - 1) * PER_PAGE;
  const pageItems = filtered.slice(start, start + PER_PAGE);

  // Windowed page list: always show first/last, current ±1, and collapse
  // longer runs into an ellipsis so the control stays compact at any count.
  const pageList: (number | "…")[] = (() => {
    if (totalPages <= 5)
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

  const inlineChipClass = (active: boolean) =>
    `inline-flex h-8 shrink-0 scroll-mx-8 items-center rounded-full border px-3 font-mono text-[11px] uppercase tracking-widest outline-none transition-colors focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-text-primary ${
      active
        ? "border-text-primary bg-text-primary text-bg-primary"
        : "border-border-primary text-text-secondary hover:border-neutral-400/70 active:border-neutral-400/70 hover:text-text-primary dark:hover:border-white/25 dark:active:border-white/25"
    }`;

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
      {/* Controls match the locked Blog toolbar and horizontally scrolling filters. */}
      <div className="mt-14 flex flex-col gap-3 border-y border-border-primary px-2 py-4 sm:px-4 lg:flex-row lg:items-center lg:gap-2">
        <label htmlFor="project-search" className="sr-only">
          Search projects
        </label>
        {/* Same responsive search geometry and states as the locked Blog. */}
        <div className="relative order-1 w-full min-w-0 lg:order-2 lg:w-64 lg:flex-none">
          <Search
            aria-hidden
            className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-text-secondary"
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
            maxLength={100}
            className="h-8 w-full rounded-lg border border-black/[0.16] bg-transparent pl-9 pr-9 font-mono text-[11px] text-text-primary outline-none transition-colors placeholder:text-neutral-400 hover:border-neutral-400/[0.72] active:border-neutral-400/[0.72] focus:border-text-secondary focus-visible:ring-2 focus-visible:ring-neutral-300/60 dark:border-white/[0.12] dark:placeholder:text-white/30 dark:hover:border-white/[0.27] dark:active:border-white/[0.27] dark:focus-visible:ring-white/20 [&::-webkit-search-cancel-button]:hidden"
          />
          {query && (
            <button
              type="button"
              aria-label="Clear project search"
              onClick={() => {
                setQuery("");
                searchRef.current?.focus();
              }}
              className="absolute right-1 top-1/2 flex size-6 -translate-y-1/2 items-center justify-center rounded-full text-text-secondary outline-none transition-colors hover:bg-black/5 hover:text-text-primary focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-1 focus-visible:outline-text-primary dark:hover:bg-white/10"
            >
              <X className="size-3" aria-hidden />
            </button>
          )}
        </div>

        <div className="relative order-2 min-w-0 flex-1 lg:order-1">
          <div
            ref={filtersRef}
            onScroll={() => {
              const filters = filtersRef.current;
              if (!filters) return;
              const maxScroll = Math.max(0, filters.scrollWidth - filters.clientWidth);
              setFilterEdges({
                left: filters.scrollLeft > 1,
                right: filters.scrollLeft < maxScroll - 1,
              });
            }}
            className="flex min-w-0 items-center gap-2 overflow-x-auto pr-8 [-ms-overflow-style:none] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden"
            role="group"
            aria-label="Filter projects by tag"
          >
            <button
              type="button"
              aria-pressed={activeTag === "All"}
              onFocus={handleFilterFocus}
              onClick={() => setParams({ tag: "All", page: 1 })}
              className={inlineChipClass(activeTag === "All")}
            >
              All projects
            </button>
            {tags.map((tag) => (
              <button
                key={tag}
                type="button"
                aria-pressed={activeTag === tag}
                onFocus={handleFilterFocus}
                onClick={() => setParams({ tag, page: 1 })}
                className={inlineChipClass(activeTag === tag)}
              >
                {tag}
              </button>
            ))}
          </div>
          <span
            aria-hidden
            className={`pointer-events-none absolute inset-y-0 left-0 w-8 bg-gradient-to-r from-bg-primary to-transparent transition-opacity duration-200 ${
              filterEdges.left ? "opacity-80" : "opacity-0"
            }`}
          />
          <span
            aria-hidden
            className={`pointer-events-none absolute inset-y-0 right-0 w-8 bg-gradient-to-l from-bg-primary to-transparent transition-opacity duration-200 ${
              filterEdges.right ? "opacity-80" : "opacity-0"
            }`}
          />
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
        <div className="mt-10 px-2 sm:px-4">
          <BlogStatePanel
            kicker={
              projects.length === 0
                ? "No projects yet"
                : invalidTag
                  ? "Unknown project tag"
                  : q
                    ? "No matching projects"
                    : "No projects found"
            }
            title={
              <>
                {projects.length === 0
                  ? "The first project is still "
                  : invalidTag
                    ? "Choose another "
                    : q
                      ? "Try something "
                      : "No projects are "}
                <span className="animate-gradient-x text-colorfull px-1 pb-1 italic [text-shadow:none]">
                  {projects.length === 0
                    ? "being prepared."
                    : invalidTag
                      ? "project tag."
                      : q
                        ? "different."
                        : "available here."}
                </span>
              </>
            }
            description={
              projects.length === 0
                ? "Please return soon when the project collection is available."
                : invalidTag
                  ? "Choose another tag or return to the complete project collection."
                  : q
                    ? "Check the spelling, try a broader term, or clear the search to browse every project."
                    : "Return to the complete collection to continue browsing."
            }
          >
          <button
            type="button"
            onClick={() => {
              skipNextSearchSyncRef.current = query !== "";
              setQuery("");
              setParams({ tag: "All", q: "", page: 1 });
            }}
            className="inline-flex min-h-9 items-center rounded-full border border-border-primary px-5 font-mono text-[11px] uppercase tracking-widest text-text-secondary transition-colors hover:border-neutral-400/70 hover:text-text-primary active:border-neutral-400/70 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-text-primary dark:hover:border-white/25 dark:active:border-white/25"
          >
            View all projects
          </button>
          </BlogStatePanel>
        </div>
      )}

      {/* Pagination — windowed page list with results summary. Current page
          uses an inverted pill (ink-on-paper in light, paper-on-ink in dark)
          so it reads unambiguously in both modes. */}
      {totalPages > 1 && (
        <nav
          aria-label="Projects pages"
          className="mt-14 flex flex-col items-center gap-4"
        >
          <div className="grid grid-cols-2 items-center justify-center gap-2 sm:flex sm:flex-wrap">
            <button
              type="button"
              aria-label="Previous page"
              onClick={() => goToPage(safePage - 1)}
              disabled={safePage === 1}
              className="order-2 inline-flex min-h-8 w-[88px] items-center justify-center justify-self-end rounded-full border border-border-primary px-4 font-mono text-[11px] uppercase tracking-widest text-text-secondary transition-colors hover:border-neutral-400/70 active:border-neutral-400/70 hover:text-text-primary focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-text-primary disabled:cursor-not-allowed disabled:opacity-40 dark:hover:border-white/25 dark:active:border-white/25 sm:order-1"
            >
              Previous
            </button>
            <div className="order-1 col-span-2 flex items-center justify-center gap-2 sm:order-2">
              {pageList.map((item, idx) =>
                item === "…" ? (
                  <span key={`gap-${idx}`} aria-hidden className="px-0.5 font-mono text-xs text-text-secondary">…</span>
                ) : (
                  <button
                    key={item}
                    type="button"
                    aria-label={item === safePage ? `Page ${item}, current page` : `Go to page ${item}`}
                    aria-current={item === safePage ? "page" : undefined}
                    onClick={() => goToPage(item)}
                    className={`inline-flex size-8 items-center justify-center rounded-full border font-mono text-xs transition-colors focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-text-primary ${
                      item === safePage
                        ? "border-text-primary bg-text-primary text-bg-primary"
                        : "border-border-primary text-text-secondary hover:border-neutral-400/70 active:border-neutral-400/70 hover:text-text-primary dark:hover:border-white/25 dark:active:border-white/25"
                    }`}
                  >
                    {String(item).padStart(2, "0")}
                  </button>
                )
              )}
            </div>
            <button
              type="button"
              aria-label="Next page"
              onClick={() => goToPage(safePage + 1)}
              disabled={safePage === totalPages}
              className="order-3 inline-flex min-h-8 w-[88px] items-center justify-center justify-self-start rounded-full border border-border-primary px-4 font-mono text-[11px] uppercase tracking-widest text-text-secondary transition-colors hover:border-neutral-400/70 active:border-neutral-400/70 hover:text-text-primary focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-text-primary disabled:cursor-not-allowed disabled:opacity-40 dark:hover:border-white/25 dark:active:border-white/25"
            >
              Next
            </button>
          </div>
          <p
            aria-live="polite"
            className="font-mono text-[11px] uppercase tracking-[0.2em] text-text-secondary"
          >
            Showing {String(start + 1).padStart(2, "0")}–
            {String(Math.min(start + PER_PAGE, filtered.length)).padStart(2, "0")} of{" "}
            {String(filtered.length).padStart(2, "0")}
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
