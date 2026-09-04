"use client";

import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { Rss, Search } from "lucide-react";

interface BlogFilterBarProps {
  categories: string[];
}

export function BlogFilterBar({ categories }: BlogFilterBarProps) {
  const searchParams = useSearchParams();
  const router = useRouter();
  const activeCategory = searchParams.get("category")?.toLowerCase() || "";

  const handleCategoryClick = (cat: string) => {
    if (cat === "") {
      router.push("/blog");
    } else {
      router.push(`/blog?category=${encodeURIComponent(cat.toLowerCase())}`);
    }
  };

  const handleOpenSearch = () => {
    window.dispatchEvent(new CustomEvent("open-search-modal"));
  };

  return (
    <div className="flex items-center gap-2 px-4 py-4 sm:px-6">
      {/* Category Pills Slider — reference: scrollbar-none mask-[...] flex min-w-0 flex-1 gap-1 overflow-x-auto pr-8 */}
      <div className="min-w-0 flex-1">
        <div className="[mask-image:linear-gradient(to_right,black,black_calc(100%-2rem),transparent)] flex min-w-0 items-center gap-1 overflow-x-auto pr-8 [&::-webkit-scrollbar]:hidden [-ms-overflow-style:none] [scrollbar-width:none]">
          {/* All Posts — reference: active state */}
          <button
            type="button"
            onClick={() => handleCategoryClick("")}
            className={`shrink-0 whitespace-nowrap rounded-full px-3 py-1.5 text-sm transition-colors duration-200 ${
              !activeCategory
                ? "border border-neutral-300 bg-white text-neutral-900 dark:border-neutral-700 dark:bg-neutral-800 dark:text-white"
                : "text-neutral-400 hover:text-neutral-700 dark:text-neutral-500 dark:hover:text-neutral-300"
            }`}
          >
            All Posts
          </button>

          {/* Dynamic Category Pills — reference: capitalize */}
          {categories.map((cat) => {
            const isSelected = activeCategory === cat.toLowerCase();
            return (
              <button
                key={cat}
                type="button"
                onClick={() => handleCategoryClick(cat)}
                className={`shrink-0 whitespace-nowrap rounded-full px-3 py-1.5 text-sm capitalize transition-colors duration-200 ${
                  isSelected
                    ? "border border-neutral-300 bg-white text-neutral-900 dark:border-neutral-700 dark:bg-neutral-800 dark:text-white"
                    : "text-neutral-400 hover:text-neutral-700 dark:text-neutral-500 dark:hover:text-neutral-300"
                }`}
              >
                {cat}
              </button>
            );
          })}
        </div>
      </div>

      {/* Action Buttons: ⌘K Search & RSS Feed — reference: flex shrink-0 items-center gap-1 */}
      <div className="flex shrink-0 items-center gap-1">
        {/* Search Posts — reference: inline-flex size-9 cursor-pointer ... lg:h-9 lg:w-52 lg:justify-start lg:gap-2 lg:px-3 */}
        <button
          type="button"
          onClick={handleOpenSearch}
          aria-label="Search site"
          className="inline-flex size-9 cursor-pointer items-center justify-center rounded-lg border border-border-primary text-neutral-400 transition-colors hover:border-neutral-400/70 active:border-neutral-400/70 hover:text-neutral-600 dark:border-neutral-800 dark:hover:border-white/25 dark:active:border-white/25 dark:hover:text-neutral-300 lg:h-9 lg:w-52 lg:justify-start lg:gap-2 lg:px-3"
        >
          <Search className="size-4 shrink-0" aria-hidden />
          <span className="hidden text-neutral-400 text-sm lg:inline">Search site</span>
          <span className="ms-auto hidden gap-0.5 text-[11px] lg:inline-flex">
            <kbd className="rounded border border-neutral-200 bg-neutral-100 px-1.5 py-0.5 font-mono text-neutral-500 dark:border-neutral-700 dark:bg-neutral-800 dark:text-neutral-400">
              ⌘
            </kbd>
            <kbd className="rounded border border-neutral-200 bg-neutral-100 px-1.5 py-0.5 font-mono text-neutral-500 dark:border-neutral-700 dark:bg-neutral-800 dark:text-neutral-400">
              K
            </kbd>
          </span>
        </button>

        {/* RSS Feed — reference: inline-flex size-9 ... */}
        <Link
          href="/rss.xml"
          target="_blank"
          rel="noopener noreferrer"
          aria-label="RSS Feed"
          className="inline-flex size-9 items-center justify-center rounded-lg border border-border-primary bg-transparent text-neutral-400 transition-colors hover:border-neutral-400/70 active:border-neutral-400/70 hover:text-neutral-600 dark:border-neutral-800 dark:hover:border-white/25 dark:active:border-white/25 dark:hover:text-neutral-300"
        >
          <Rss className="size-4" aria-hidden />
        </Link>
      </div>
    </div>
  );
}
