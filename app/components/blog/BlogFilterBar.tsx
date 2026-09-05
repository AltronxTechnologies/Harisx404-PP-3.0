"use client";

import Link from "next/link";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import {
  startTransition,
  useCallback,
  useEffect,
  useRef,
  useState,
  type FocusEvent,
} from "react";
import { Rss, Search, X } from "lucide-react";

interface BlogFilterBarProps {
  categories: string[];
  invalidCategory?: boolean;
  initialQuery?: string;
}

export function BlogFilterBar({
  categories,
  invalidCategory = false,
  initialQuery = "",
}: BlogFilterBarProps) {
  const searchParams = useSearchParams();
  const pathname = usePathname();
  const router = useRouter();
  const activeCategory = invalidCategory
    ? ""
    : searchParams.get("category")?.trim().toLowerCase().slice(0, 80) || "";
  const [query, setQuery] = useState(initialQuery);
  const searchTimerRef = useRef<number | null>(null);
  const desiredUrlRef = useRef<string | null>(null);
  const dispatchedUrlRef = useRef<string | null>(null);
  const navigationInFlightRef = useRef(false);
  const navigationTimeoutRef = useRef<number | null>(null);
  const desiredHistoryRef = useRef<"push" | "replace">("replace");
  const searchRef = useRef<HTMLInputElement>(null);
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

  const flushNavigation = useCallback(() => {
    const desiredUrl = desiredUrlRef.current;
    if (!desiredUrl || navigationInFlightRef.current) return;
    const currentUrl = `${window.location.pathname}${window.location.search}`;
    if (desiredUrl === currentUrl) {
      desiredHistoryRef.current = "replace";
      return;
    }

    navigationInFlightRef.current = true;
    dispatchedUrlRef.current = desiredUrl;
    const historyMode = desiredHistoryRef.current;
    desiredHistoryRef.current = "replace";
    if (navigationTimeoutRef.current !== null) {
      window.clearTimeout(navigationTimeoutRef.current);
    }
    navigationTimeoutRef.current = window.setTimeout(() => {
      navigationTimeoutRef.current = null;
      navigationInFlightRef.current = false;
      dispatchedUrlRef.current = null;
      flushNavigation();
    }, 10_000);
    startTransition(() => {
      router[historyMode](desiredUrl, { scroll: false });
    });
  }, [router]);

  const queueNavigation = useCallback(
    (
      update: (params: URLSearchParams) => void,
      historyMode: "push" | "replace" = "replace",
    ) => {
      const source = desiredUrlRef.current
        ? new URL(desiredUrlRef.current, window.location.origin).search
        : window.location.search;
      const params = new URLSearchParams(source);
      update(params);
      const urlQuery = params.toString();
      desiredUrlRef.current = urlQuery ? `${pathname}?${urlQuery}` : pathname;
      if (historyMode === "push") desiredHistoryRef.current = "push";
      flushNavigation();
    },
    [flushNavigation, pathname],
  );

  useEffect(() => {
    const currentUrl = `${window.location.pathname}${window.location.search}`;
    const completedQueuedNavigation = navigationInFlightRef.current;
    const dispatchedUrl = dispatchedUrlRef.current;
    navigationInFlightRef.current = false;
    dispatchedUrlRef.current = null;
    if (navigationTimeoutRef.current !== null) {
      window.clearTimeout(navigationTimeoutRef.current);
      navigationTimeoutRef.current = null;
    }

    if (
      !desiredUrlRef.current ||
      (!completedQueuedNavigation && desiredUrlRef.current !== currentUrl) ||
      (completedQueuedNavigation && dispatchedUrl !== currentUrl)
    ) {
      desiredUrlRef.current = currentUrl;
      desiredHistoryRef.current = "replace";
      setQuery(initialQuery);
      return;
    }
    if (desiredUrlRef.current !== currentUrl) flushNavigation();
  }, [flushNavigation, initialQuery, searchParams]);

  useEffect(() => {
    const handleHistoryNavigation = () => {
      if (searchTimerRef.current !== null) {
        window.clearTimeout(searchTimerRef.current);
        searchTimerRef.current = null;
      }
      navigationInFlightRef.current = false;
      dispatchedUrlRef.current = null;
      if (navigationTimeoutRef.current !== null) {
        window.clearTimeout(navigationTimeoutRef.current);
        navigationTimeoutRef.current = null;
      }
      desiredHistoryRef.current = "replace";
      desiredUrlRef.current = `${window.location.pathname}${window.location.search}`;
      const historyQuery = new URLSearchParams(window.location.search)
        .get("q")
        ?.trim()
        .replace(/\s+/g, " ")
        .slice(0, 100) || "";
      setQuery(historyQuery);
    };

    window.addEventListener("popstate", handleHistoryNavigation);
    return () => {
      window.removeEventListener("popstate", handleHistoryNavigation);
      if (navigationTimeoutRef.current !== null) {
        window.clearTimeout(navigationTimeoutRef.current);
      }
    };
  }, []);

  useEffect(() => {
    const media = window.matchMedia("(max-width: 1023px)");
    const syncViewport = () => {
      queueNavigation((params) => {
        const currentlyCompact = params.get("view") === "compact";
        if (media.matches === currentlyCompact) return;
        const currentPage = Number.parseInt(params.get("page") || "1", 10);
        const currentStart = currentlyCompact
          ? currentPage <= 1 ? 0 : 7 + (currentPage - 2) * 8
          : currentPage <= 1 ? 0 : 10 + (currentPage - 2) * 9;
        const targetPage = media.matches
          ? currentStart < 7 ? 1 : 2 + Math.floor((currentStart - 7) / 8)
          : currentStart < 10 ? 1 : 2 + Math.floor((currentStart - 10) / 9);
        if (media.matches) params.set("view", "compact");
        else params.delete("view");
        if (targetPage > 1) params.set("page", String(targetPage));
        else params.delete("page");
      });
    };

    syncViewport();
    media.addEventListener("change", syncViewport);
    return () => media.removeEventListener("change", syncViewport);
  }, [queueNavigation]);

  useEffect(() => {
    const normalized = query.trim().replace(/\s+/g, " ").slice(0, 100);
    const current = searchParams.get("q") || "";
    if (normalized === current) return;

    searchTimerRef.current = window.setTimeout(() => {
      searchTimerRef.current = null;
      queueNavigation((params) => {
        if (normalized) params.set("q", normalized);
        else params.delete("q");
        params.delete("page");
      });
    }, 300);

    return () => {
      if (searchTimerRef.current !== null) {
        window.clearTimeout(searchTimerRef.current);
        searchTimerRef.current = null;
      }
    };
  }, [query, queueNavigation, searchParams]);

  const handleCategoryClick = (category: string) => {
    if (searchTimerRef.current !== null) {
      window.clearTimeout(searchTimerRef.current);
      searchTimerRef.current = null;
    }
    queueNavigation((params) => {
      const normalizedQuery = query.trim().replace(/\s+/g, " ").slice(0, 100);
      if (normalizedQuery) params.set("q", normalizedQuery);
      else params.delete("q");
      if (category) params.set("category", category.toLowerCase());
      else params.delete("category");
      params.delete("page");
    }, "push");
  };

  const filterClass = (selected: boolean) =>
    `inline-flex h-8 shrink-0 scroll-mx-8 items-center rounded-full border px-3 font-mono text-[11px] uppercase tracking-widest outline-none transition-colors focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-text-primary ${
      selected
        ? "border-text-primary bg-text-primary text-bg-primary"
        : "border-border-primary text-text-secondary hover:border-neutral-400/70 hover:text-text-primary active:border-neutral-400/70 dark:hover:border-white/25 dark:active:border-white/25"
    }`;

  return (
    <div className="flex flex-col gap-3 border-y border-border-primary px-2 py-4 sm:px-4 lg:flex-row lg:items-center lg:gap-2">
      <div className="order-1 flex w-full shrink-0 items-center gap-2 max-[359px]:!w-[calc(100%-24px)] lg:order-2 lg:w-auto">
        <label htmlFor="blog-search" className="sr-only">Search articles</label>
        <div className="relative min-w-0 flex-1 lg:w-64 lg:flex-none">
          <Search
            aria-hidden
            className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-text-secondary"
          />
          <input
            ref={searchRef}
            id="blog-search"
            type="search"
            value={query}
            maxLength={100}
            onChange={(event) => setQuery(event.target.value)}
            placeholder="Search articles…"
            className="h-8 w-full rounded-lg border border-border-primary bg-transparent pl-9 pr-9 font-mono text-[11px] text-text-primary outline-none transition-colors placeholder:text-neutral-400 hover:border-neutral-400/70 active:border-neutral-400/70 focus:border-text-secondary focus-visible:ring-2 focus-visible:ring-neutral-300/60 dark:placeholder:text-white/30 dark:hover:border-white/25 dark:active:border-white/25 dark:focus-visible:ring-white/20 [&::-webkit-search-cancel-button]:hidden"
          />
          {query && (
            <button
              type="button"
              onClick={() => {
                setQuery("");
                searchRef.current?.focus();
              }}
              aria-label="Clear article search"
              className="absolute right-1 top-1/2 flex size-6 -translate-y-1/2 items-center justify-center rounded-full text-text-secondary outline-none transition-colors hover:bg-black/5 hover:text-text-primary focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-1 focus-visible:outline-text-primary dark:hover:bg-white/10"
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

    </div>
  );
}
