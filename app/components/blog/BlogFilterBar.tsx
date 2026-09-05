"use client";

import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import {
  startTransition,
  useEffect,
  useRef,
  useState,
  type FocusEvent,
} from "react";
import { Rss, Search, X } from "lucide-react";

interface BlogFilterBarProps {
  categories: string[];
  invalidCategory?: boolean;
  compact?: boolean;
  initialQuery?: string;
}

export function BlogFilterBar({
  categories,
  invalidCategory = false,
  compact = false,
  initialQuery = "",
}: BlogFilterBarProps) {
  const searchParams = useSearchParams();
  const router = useRouter();
  const activeCategory = invalidCategory
    ? ""
    : searchParams.get("category")?.trim().toLowerCase().slice(0, 80) || "";
  const [query, setQuery] = useState(initialQuery);
  const previousInitialQuery = useRef(initialQuery);
  const pendingQuery = useRef<string | null>(null);
  const syncingFromUrl = useRef(false);
  const filtersRef = useRef<HTMLDivElement>(null);
  const [filterEdges, setFilterEdges] = useState({ left: false, right: false });

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
  }, [categories]);

  const handleFilterFocus = (event: FocusEvent<HTMLButtonElement>) => {
    const target = event.currentTarget;
    window.requestAnimationFrame(() => {
      if (target.matches(":focus-visible")) {
        target.scrollIntoView({ block: "nearest", inline: "center" });
      }
    });
  };

  useEffect(() => {
    const handleHistoryNavigation = () => {
      const historyQuery = new URLSearchParams(window.location.search)
        .get("q")
        ?.trim()
        .replace(/\s+/g, " ")
        .slice(0, 100) || "";
      pendingQuery.current = null;
      previousInitialQuery.current = historyQuery;
      syncingFromUrl.current = true;
      setQuery(historyQuery);
    };

    window.addEventListener("popstate", handleHistoryNavigation);
    return () => window.removeEventListener("popstate", handleHistoryNavigation);
  }, []);

  useEffect(() => {
    if (previousInitialQuery.current === initialQuery) return;
    previousInitialQuery.current = initialQuery;
    if (pendingQuery.current === initialQuery) {
      pendingQuery.current = null;
      return;
    }
    syncingFromUrl.current = true;
    setQuery(initialQuery);
  }, [initialQuery]);

  useEffect(() => {
    if (syncingFromUrl.current) {
      syncingFromUrl.current = false;
      return;
    }
    const normalized = query.trim().replace(/\s+/g, " ").slice(0, 100);
    const current = searchParams.get("q") || "";
    if (normalized === current) return;

    const timer = window.setTimeout(() => {
      const params = new URLSearchParams(searchParams.toString());
      if (normalized) params.set("q", normalized);
      else params.delete("q");
      params.delete("page");
      pendingQuery.current = normalized;
      startTransition(() => {
        const next = params.toString();
        router.replace(next ? `/blog?${next}` : "/blog", { scroll: false });
      });
    }, 300);

    return () => window.clearTimeout(timer);
  }, [query, router, searchParams]);

  const handleCategoryClick = (category: string) => {
    startTransition(() => {
      const params = new URLSearchParams(searchParams.toString());
      if (category) params.set("category", category.toLowerCase());
      else params.delete("category");
      params.delete("page");
      if (compact) params.set("view", "compact");
      const query = params.toString();
      router.push(query ? `/blog?${query}` : "/blog");
    });
  };

  const filterClass = (selected: boolean) =>
    `inline-flex h-8 shrink-0 scroll-mx-8 items-center rounded-full border px-3 font-mono text-[11px] uppercase tracking-widest outline-none transition-colors ${
      selected
        ? "border-text-primary bg-text-primary text-bg-primary focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-bg-primary"
        : "border-border-primary text-text-secondary hover:border-neutral-400/70 hover:text-text-primary active:border-neutral-400/70 focus-visible:border-neutral-400/70 dark:hover:border-white/25 dark:active:border-white/25 dark:focus-visible:border-white/25"
    }`;

  return (
    <div className="flex flex-col gap-3 border-y border-border-primary px-2 py-4 sm:px-4 lg:flex-row lg:items-center lg:gap-2">
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
          aria-label="Filter articles by category"
        >
          <button
            type="button"
            onClick={() => handleCategoryClick("")}
            onFocus={handleFilterFocus}
            aria-pressed={!activeCategory && !invalidCategory}
            className={filterClass(!activeCategory && !invalidCategory)}
          >
            All articles
          </button>
          {categories.map((category) => {
            const selected = activeCategory === category.toLowerCase();
            return (
              <button
                key={category}
                type="button"
                onClick={() => handleCategoryClick(category)}
                onFocus={handleFilterFocus}
                aria-pressed={selected}
                className={filterClass(selected)}
              >
                {category}
              </button>
            );
          })}
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

      <div className="order-1 flex w-full shrink-0 items-center gap-2 lg:order-2 lg:w-auto">
        <label htmlFor="blog-search" className="sr-only">Search articles</label>
        <div className="relative min-w-0 flex-1 lg:w-64 lg:flex-none">
          <Search
            aria-hidden
            className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-text-secondary"
          />
          <input
            id="blog-search"
            type="search"
            value={query}
            maxLength={100}
            onChange={(event) => setQuery(event.target.value)}
            placeholder="Search articles…"
            className="h-8 w-full rounded-lg border border-border-primary bg-white pl-9 pr-8 font-mono text-[11px] text-text-primary outline-none transition-colors placeholder:text-neutral-400 hover:border-neutral-400/70 active:border-neutral-400/70 focus:border-text-secondary focus-visible:ring-2 focus-visible:ring-neutral-300/60 dark:bg-white/[0.03] dark:placeholder:text-white/30 dark:hover:border-white/25 dark:active:border-white/25 dark:focus-visible:ring-white/20 [&::-webkit-search-cancel-button]:hidden"
          />
          {query && (
            <button
              type="button"
              onClick={() => setQuery("")}
              aria-label="Clear article search"
              className="absolute right-1.5 top-1/2 flex size-5 -translate-y-1/2 items-center justify-center rounded-full text-text-secondary transition-colors hover:bg-black/5 hover:text-text-primary dark:hover:bg-white/10"
            >
              <X className="size-3" aria-hidden />
            </button>
          )}
        </div>

        <Link
          href="/rss.xml"
          target="_blank"
          rel="noopener noreferrer"
          aria-label="RSS Feed (opens in a new tab)"
          className="inline-flex size-8 items-center justify-center rounded-lg border border-border-primary text-text-secondary transition-colors hover:border-neutral-400/70 hover:text-text-primary active:border-neutral-400/70 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-text-primary dark:hover:border-white/25 dark:active:border-white/25"
        >
          <Rss className="size-4" aria-hidden />
        </Link>
      </div>
    </div>
  );
}
