"use client";

import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { startTransition } from "react";
import { Rss, Search } from "lucide-react";

interface BlogFilterBarProps {
  categories: string[];
  invalidCategory?: boolean;
}

export function BlogFilterBar({
  categories,
  invalidCategory = false,
}: BlogFilterBarProps) {
  const searchParams = useSearchParams();
  const router = useRouter();
  const activeCategory = invalidCategory
    ? ""
    : searchParams.get("category")?.trim().toLowerCase().slice(0, 80) || "";

  const handleCategoryClick = (category: string) => {
    startTransition(() => {
      router.push(
        category
          ? `/blog?category=${encodeURIComponent(category.toLowerCase())}`
          : "/blog",
      );
    });
  };

  const handleOpenSearch = () => {
    window.dispatchEvent(new CustomEvent("open-search-modal"));
  };

  const filterClass = (selected: boolean) =>
    `inline-flex h-8 shrink-0 items-center rounded-full border px-3 font-mono text-[11px] uppercase tracking-widest transition-colors focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-text-primary ${
      selected
        ? "border-text-primary bg-text-primary text-bg-primary"
        : "border-border-primary text-text-secondary hover:border-neutral-400/70 hover:text-text-primary active:border-neutral-400/70 dark:hover:border-white/25 dark:active:border-white/25"
    }`;

  return (
    <div className="flex items-center gap-2 border-y border-border-primary px-2 py-4 sm:px-4">
      <div className="min-w-0 flex-1">
        <div
          className="flex min-w-0 items-center gap-2 overflow-x-auto pr-8 [mask-image:linear-gradient(to_right,black,black_calc(100%-2rem),transparent)] [-ms-overflow-style:none] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden"
          role="group"
          aria-label="Filter articles by category"
        >
          <button
            type="button"
            onClick={() => handleCategoryClick("")}
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
                aria-pressed={selected}
                className={filterClass(selected)}
              >
                {category}
              </button>
            );
          })}
        </div>
      </div>

      <div className="flex shrink-0 items-center gap-2">
        <button
          type="button"
          onClick={handleOpenSearch}
          aria-label="Search site"
          className="inline-flex size-8 cursor-pointer items-center justify-center rounded-lg border border-border-primary text-text-secondary transition-colors hover:border-neutral-400/70 hover:text-text-primary active:border-neutral-400/70 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-text-primary dark:hover:border-white/25 dark:active:border-white/25 lg:w-52 lg:justify-start lg:gap-2 lg:px-3"
        >
          <Search className="size-4 shrink-0" aria-hidden />
          <span className="hidden font-mono text-[11px] uppercase tracking-widest lg:inline">
            Search site
          </span>
          <span className="ms-auto hidden gap-0.5 text-[10px] lg:inline-flex">
            <kbd className="rounded-md border border-border-primary bg-white px-1.5 py-0.5 font-mono text-text-secondary dark:bg-white/5">
              ⌘
            </kbd>
            <kbd className="rounded-md border border-border-primary bg-white px-1.5 py-0.5 font-mono text-text-secondary dark:bg-white/5">
              K
            </kbd>
          </span>
        </button>

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
