"use client";

import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";

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
          aria-label="Search posts"
          className="inline-flex size-9 cursor-pointer items-center justify-center rounded-lg border border-border-primary text-neutral-400 transition-colors hover:border-neutral-400 hover:text-neutral-600 dark:border-neutral-800 dark:hover:border-neutral-600 dark:hover:text-neutral-300 lg:h-9 lg:w-52 lg:justify-start lg:gap-2 lg:px-3"
        >
          <svg
            xmlns="http://www.w3.org/2000/svg"
            width="1em"
            height="1em"
            fill="currentColor"
            viewBox="0 0 256 256"
            className="size-4 shrink-0"
          >
            <path d="M192,112a80,80,0,1,1-80-80A80,80,0,0,1,192,112Z" opacity="0.2" />
            <path d="M229.66,218.34,179.6,168.28a88.21,88.21,0,1,0-11.32,11.31l50.06,50.07a8,8,0,0,0,11.32-11.32ZM40,112a72,72,0,1,1,72,72A72.08,72.08,0,0,1,40,112Z" />
          </svg>
          <span className="hidden text-neutral-400 text-sm lg:inline">Search posts</span>
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
          className="inline-flex size-9 items-center justify-center rounded-lg border border-border-primary bg-transparent text-neutral-400 transition-colors hover:border-neutral-400 hover:text-neutral-600 dark:border-neutral-800 dark:hover:border-neutral-600 dark:hover:text-neutral-300"
        >
          <svg
            xmlns="http://www.w3.org/2000/svg"
            width="1em"
            height="1em"
            fill="currentColor"
            viewBox="0 0 256 256"
            className="size-4"
          >
            <path d="M216,200H56V40A160,160,0,0,1,216,200Z" opacity="0.2" />
            <path d="M106.91,149.09A71.53,71.53,0,0,1,128,200a8,8,0,0,1-16,0,56,56,0,0,0-56-56,8,8,0,0,1,0-16A71.53,71.53,0,0,1,106.91,149.09ZM56,80a8,8,0,0,0,0,16A104,104,0,0,1,160,200a8,8,0,0,0,16,0A120,120,0,0,0,56,80Zm118.79,1.21A166.89,166.89,0,0,0,56,32a8,8,0,0,0,0,16A151,151,0,0,1,163.48,92.52,151,151,0,0,1,208,200a8,8,0,0,0,16,0A166.9,166.9,0,0,0,174.79,81.21ZM60,184a12,12,0,1,0,12,12A12,12,0,0,0,60,184Z" />
          </svg>
        </Link>
      </div>
    </div>
  );
}
