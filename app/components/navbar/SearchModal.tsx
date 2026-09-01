"use client";

import { useState, useMemo, useEffect, useRef } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import {
  Search,
  Moon,
  Sun,
  X,
  MessageSquare,
  Home,
  User,
  Folder,
  FileText,
  BookOpen,
  Phone,
  Award,
  Link as LinkIcon,
  Loader2,
  ArrowUpRight,
  Shield,
  ScrollText,
  Rss,
  Map,
  SearchX,
  Mail,
} from "lucide-react";
import { useTheme } from "next-themes";

interface SearchModalProps {
  isOpen: boolean;
  onClose: () => void;
  onOpenReachOut: () => void;
}

interface PageItem {
  name: string;
  link: string;
  icon: React.ComponentType<{ className?: string }>;
  isAction?: boolean;
}

const PAGES: PageItem[] = [
  { name: "Home", link: "/", icon: Home },
  { name: "About", link: "/about", icon: User },
  { name: "Projects", link: "/projects", icon: Folder },
  { name: "Blog", link: "/blog", icon: FileText },
  { name: "Community Wall", link: "/community-wall", icon: BookOpen },
  { name: "Contact", link: "/contact", icon: Phone },
  { name: "Credentials", link: "/credentials", icon: Award },
  { name: "Resume", link: "/resume", icon: ScrollText },
  { name: "Links", link: "/links", icon: LinkIcon },
];

function BrandIcon({ name }: { name: string }) {
  const paths: Record<string, string> = {
    GitHub:
      "M12 2C6.477 2 2 6.484 2 12.017c0 4.425 2.865 8.18 6.839 9.504.5.092.682-.217.682-.483 0-.237-.008-.868-.013-1.703-2.782.605-3.369-1.343-3.369-1.343-.454-1.158-1.11-1.466-1.11-1.466-.908-.62.069-.608.069-.608 1.003.07 1.53 1.032 1.53 1.032.892 1.53 2.341 1.088 2.91.832.092-.647.35-1.088.636-1.338-2.22-.253-4.555-1.113-4.555-4.951 0-1.093.39-1.988 1.029-2.688-.103-.253-.446-1.272.098-2.65 0 0 .84-.27 2.75 1.026A9.564 9.564 0 0112 6.844c.85.004 1.705.115 2.504.337 1.909-1.296 2.747-1.027 2.747-1.027.546 1.379.202 2.398.1 2.651.64.7 1.028 1.595 1.028 2.688 0 3.848-2.339 4.695-4.566 4.943.359.309.678.92.678 1.855 0 1.338-.012 2.419-.012 2.747 0 .268.18.58.688.482A10.019 10.019 0 0022 12.017C22 6.484 17.522 2 12 2z",
    LinkedIn:
      "M19 3a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h14m-.5 15.5v-5.3a3.26 3.26 0 0 0-3.26-3.26c-.85 0-1.84.52-2.28 1.3v-1.11h-2.79v8.37h2.79v-4.93c0-.77.62-1.4 1.39-1.4a1.4 1.4 0 0 1 1.4 1.4v4.93h2.75M6.46 8.76a1.67 1.67 0 1 0 0-3.34 1.67 1.67 0 0 0 0 3.34m1.39 9.74v-8.37H5.07v8.37h2.78z",
    "X (Twitter)":
      "M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z",
  };
  return (
    <svg className="size-[22px] fill-current" viewBox="0 0 24 24" aria-hidden="true">
      <path d={paths[name] ?? paths.GitHub} />
    </svg>
  );
}

const CONNECT = [
  { name: "GitHub", link: "https://github.com/harisx404" },
  { name: "LinkedIn", link: "https://www.linkedin.com/in/harisx404/" },
  { name: "X (Twitter)", link: "https://twitter.com/harisx404" },
];

const LEGAL = [
  { name: "Privacy Policy", link: "/legal/privacy", icon: Shield },
  { name: "Terms of Use", link: "/legal/terms", icon: ScrollText },
];

const DISCOVER = [
  { name: "Blog RSS", link: "/rss.xml", icon: Rss, isExternal: true },
  { name: "Sitemap", link: "/sitemap.xml", icon: Map, isExternal: true },
];

interface ContentResult {
  title: string;
  type: "blog" | "project";
  link: string;
  summary?: string;
}

/* Shared surface styles (identical to ReachOutModal top bar) */
const circleBtn =
  "flex size-12 max-sm:size-auto max-sm:h-[60px] max-sm:flex-1 shrink-0 items-center justify-center rounded-2xl bg-white/85 max-sm:bg-white/55 backdrop-blur-xl dark:bg-[#1c1c1c]/85 max-sm:dark:bg-[#1c1c1c]/55 ring-1 ring-neutral-200/60 dark:ring-white/10 max-sm:ring-neutral-300/70 max-sm:dark:ring-white/20 " +
  "text-neutral-600 dark:text-white/80 shadow-lg shadow-black/5 dark:shadow-none " +
  "transition-colors hover:text-neutral-900 dark:hover:text-white active:scale-95";

const itemTile =
  "flex items-center gap-3 rounded-xl px-2.5 py-2.5 max-sm:py-3.5 text-[17px] max-sm:text-[23px] font-medium transition-colors " +
  "text-neutral-700 hover:bg-neutral-100 dark:text-white/80 dark:hover:bg-white/[0.07] dark:hover:text-white";

const iconTile =
  "flex size-10 max-sm:size-[52px] shrink-0 items-center justify-center rounded-full " +
  "ring-1 ring-neutral-200 text-neutral-500 dark:ring-white/15 dark:text-white/60";

function SectionHeading({ children }: { children: React.ReactNode }) {
  return (
    <h3 className="px-3 pb-1.5 pt-3 text-[15px] max-sm:text-[19px] font-medium text-neutral-400 dark:text-white/40">
      {children}
    </h3>
  );
}

export function SearchModal({
  isOpen,
  onClose,
  onOpenReachOut,
}: SearchModalProps) {
  const { resolvedTheme, setTheme } = useTheme();
  const pathname = usePathname();

  const [query, setQuery] = useState("");
  const [results, setResults] = useState<ContentResult[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [searchError, setSearchError] = useState<string | null>(null);
  const [hasSearched, setHasSearched] = useState(false);

  // Rotating placeholder — cycles while the input is empty
  const PLACEHOLDERS = useMemo(
    () => [
      "Search anything…",
      "Try 'nextjs' or 'react'…",
      "Looking for a project?",
      "Find a blog post…",
      "Type 'stats' or 'buildlog'…",
      "Search 'security' or 'AI'…",
      "Jump to any page…",
      "Try 'let's connect'…",
    ],
    []
  );
  const [placeholderIndex, setPlaceholderIndex] = useState(() =>
    Math.floor(Math.random() * 8)
  );
  useEffect(() => {
    if (!isOpen || query.length > 0) return;
    const id = setInterval(
      () => setPlaceholderIndex((i) => (i + 1) % PLACEHOLDERS.length),
      2600
    );
    return () => clearInterval(id);
  }, [isOpen, query, PLACEHOLDERS.length]);

  // resolvedTheme handles theme="system" correctly (raw `theme` would
  // report "system" and make the first toggle click a no-op in dark mode).
  const isDark = resolvedTheme === "dark";

  // Focus the input only on desktop-style devices — on phones the keyboard
  // must not pop open by itself; it opens when the user taps the search bar.
  const inputRef = useRef<HTMLInputElement>(null);
  useEffect(() => {
    if (!isOpen) return;
    const isDesktop =
      window.matchMedia("(min-width: 640px)").matches &&
      window.matchMedia("(hover: hover) and (pointer: fine)").matches;
    if (isDesktop) {
      const id = setTimeout(() => inputRef.current?.focus(), 50);
      return () => clearTimeout(id);
    }
  }, [isOpen]);

  // Debounced content search via /api/ai/search
  useEffect(() => {
    const trimmed = query.trim();
    if (trimmed.length < 2) {
      setResults([]);
      setIsSearching(false);
      setSearchError(null);
      setHasSearched(false);
      return;
    }

    setIsSearching(true);
    setSearchError(null);
    const controller = new AbortController();
    const timer = setTimeout(async () => {
      try {
        const res = await fetch("/api/ai/search", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ query: trimmed }),
          signal: controller.signal,
        });
        const data = await res.json().catch(() => ({}));
        if (!res.ok) {
          throw new Error(data?.error || "Search failed");
        }
        setResults(Array.isArray(data.results) ? data.results : []);
        setHasSearched(true);
      } catch (err: any) {
        if (err?.name === "AbortError") return;
        setSearchError("Search is unavailable right now. Try again in a moment.");
        setResults([]);
        setHasSearched(true);
      } finally {
        setIsSearching(false);
      }
    }, 350);

    return () => {
      controller.abort();
      clearTimeout(timer);
    };
  }, [query]);

  const q = query.trim().toLowerCase();

  const projectResults = useMemo(
    () => results.filter((r) => r.type === "project"),
    [results]
  );
  const postResults = useMemo(
    () => results.filter((r) => r.type !== "project"),
    [results]
  );

  const filteredPages = useMemo(
    () =>
      q
        ? PAGES.filter(
            (p) =>
              p.name.toLowerCase().includes(q) ||
              p.link.toLowerCase().includes(q)
          )
        : PAGES,
    [q]
  );
  const filteredConnect = useMemo(
    () => (q ? CONNECT.filter((c) => c.name.toLowerCase().includes(q)) : CONNECT),
    [q]
  );
  const filteredLegal = useMemo(
    () => (q ? LEGAL.filter((l) => l.name.toLowerCase().includes(q)) : LEGAL),
    [q]
  );
  const filteredDiscover = useMemo(
    () => (q ? DISCOVER.filter((d) => d.name.toLowerCase().includes(q)) : DISCOVER),
    [q]
  );

  const nothingFound =
    q.length > 0 &&
    filteredPages.length === 0 &&
    filteredConnect.length === 0 &&
    filteredLegal.length === 0 &&
    filteredDiscover.length === 0 &&
    results.length === 0 &&
    !isSearching;

  // Escape closes + body scroll lock
  useEffect(() => {
    if (!isOpen) return;
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    window.addEventListener("keydown", handleKeyDown);
    document.body.classList.add("modal-open");
    return () => {
      window.removeEventListener("keydown", handleKeyDown);
      document.body.classList.remove("modal-open");
    };
  }, [isOpen, onClose]);

  // NOTE: no early `return null` here — the tree must stay mounted inside
  // AnimatePresence so the modal can play its exit animation on close
  // (mirrors ReachOutModal's structure).
  return (
    <AnimatePresence>
      {isOpen && (
      <div
        className="fixed inset-0 z-[7000] flex items-end justify-center p-4 pb-[6vh] sm:pb-[8vh]"
        onClick={(e) => {
          if (e.target === e.currentTarget) onClose();
        }}
        role="dialog"
        aria-modal="true"
        aria-label="Search"
      >
        {/* Backdrop */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.2 }}
          onClick={onClose}
          className="fixed inset-0 bg-black/50 backdrop-blur-[3.85px]"
        />

        {/* Modal */}
        <motion.div
          initial={{ opacity: 0, scale: 0.96, y: 24 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.96, y: 24 }}
          transition={{ type: "spring", stiffness: 300, damping: 30 }}
          drag="y"
          dragConstraints={{ top: 0, bottom: 0 }}
          dragElastic={{ top: 0, bottom: 0.6 }}
          onDragEnd={(_, info) => {
            if (info.offset.y > 120 || info.velocity.y > 800) onClose();
          }}
          className="relative z-10 mx-3 w-[92vw] max-w-[660px]"
          onClick={(e) => {
            if (e.target === e.currentTarget) onClose();
          }}
        >
          <div
            className="reachout-scale"
            style={{ transformOrigin: "bottom center" }}
            onClick={(e) => {
              if (e.target === e.currentTarget) onClose();
            }}
          >
          {/* Top bar — detached search pill + action buttons (same row as ReachOutModal) */}
          <div className="mb-3 max-sm:mb-6 flex items-center gap-3 max-sm:gap-4">
            <div className="flex h-14 max-sm:h-[60px] flex-1 max-sm:flex-none max-sm:basis-[65%] items-center gap-2.5 rounded-2xl bg-white/85 max-sm:bg-white/55 backdrop-blur-xl px-4 shadow-lg shadow-black/5 dark:bg-[#1c1c1c]/85 max-sm:dark:bg-[#1c1c1c]/55 dark:shadow-none ring-1 ring-neutral-200/60 dark:ring-white/10 max-sm:ring-neutral-300/70 max-sm:dark:ring-white/20">
              <Search className="size-6 max-sm:size-7 shrink-0 text-neutral-400 dark:text-white/40" />
              <input
                ref={inputRef}
                type="text"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder={PLACEHOLDERS[placeholderIndex]}
                aria-label="Search"
                className="w-full bg-transparent text-lg max-sm:text-[22px] text-neutral-900 placeholder-neutral-400 focus:outline-none dark:text-white dark:placeholder-white/35"
              />
              {query && (
                <button
                  onClick={() => setQuery("")}
                  aria-label="Clear search"
                  className="text-neutral-400 transition-colors hover:text-neutral-700 dark:hover:text-white"
                >
                  <X className="size-4" />
                </button>
              )}
            </div>

            <button
              onClick={() => {
                onClose();
                onOpenReachOut();
              }}
              aria-label="Reach out"
              className={`${circleBtn} flex`}
            >
              <MessageSquare className="size-6 max-sm:size-9" />
            </button>

            <button
              onClick={() => setTheme(isDark ? "light" : "dark")}
              aria-label="Toggle theme"
              className={`${circleBtn} flex`}
            >
              {isDark ? <Moon className="size-6 max-sm:size-9" /> : <Sun className="size-6 max-sm:size-9" />}
            </button>

            <button onClick={onClose} aria-label="Close" className={circleBtn}>
              <X className="size-6 max-sm:size-9" />
            </button>
          </div>

          {/* Results panel — same card shell as ReachOutModal */}
          <div className="overflow-hidden rounded-3xl bg-white/85 max-sm:bg-white/55 backdrop-blur-xl shadow-2xl ring-1 ring-neutral-200/70 max-sm:ring-neutral-300/70 dark:bg-[#1a1a1a]/85 max-sm:dark:bg-[#1a1a1a]/55 dark:ring-white/[0.08] max-sm:dark:ring-white/20">
          {/* Single scroll area — sized so Pages + Connect are fully visible */}
          {/* 559px = exact ReachOutModal card height; Legal/Discover reachable by scrolling */}
          <div className="max-h-[559px] overflow-y-auto p-3">
            {/* Content search results, grouped professionally */}
            {q.length >= 2 && (
              <>
                {isSearching && (
                  <div className="flex items-center gap-2 px-3 pb-1.5 pt-3">
                    <Loader2 className="size-4 animate-spin text-neutral-400 dark:text-white/40" />
                    <span className="text-[15px] font-medium text-neutral-400 dark:text-white/40">
                      Searching&hellip;
                    </span>
                  </div>
                )}

                {searchError && (
                  <p className="px-3 py-3 text-sm text-neutral-400 dark:text-white/40">
                    {searchError}
                  </p>
                )}

                {/* Projects */}
                {projectResults.length > 0 && (
                  <section aria-label="Projects">
                    <SectionHeading>
                      Projects{" "}
                      <span className="text-neutral-300 dark:text-white/25">
                        ({projectResults.length})
                      </span>
                    </SectionHeading>
                    <div className="grid grid-cols-1 gap-0.5">
                      {projectResults.map((result) => (
                        <Link
                          key={`project-${result.link}`}
                          href={result.link}
                          onClick={onClose}
                          className={itemTile}
                        >
                          <span className={iconTile}>
                            <Folder className="size-[22px] max-sm:size-[30px]" />
                          </span>
                          <span className="min-w-0 flex-1 truncate">
                            {result.title}
                          </span>
                          <span className="shrink-0 text-[11px] font-medium uppercase tracking-wider text-neutral-400 dark:text-white/35">
                            Project
                          </span>
                        </Link>
                      ))}
                    </div>
                  </section>
                )}

                {/* Blog posts */}
                {postResults.length > 0 && (
                  <section aria-label="Blog Posts">
                    <SectionHeading>
                      Blog Posts{" "}
                      <span className="text-neutral-300 dark:text-white/25">
                        ({postResults.length})
                      </span>
                    </SectionHeading>
                    <div className="grid grid-cols-1 gap-0.5">
                      {postResults.map((result) => (
                        <Link
                          key={`post-${result.link}`}
                          href={result.link}
                          onClick={onClose}
                          className={itemTile}
                        >
                          <span className={iconTile}>
                            <FileText className="size-[22px] max-sm:size-[30px]" />
                          </span>
                          <span className="min-w-0 flex-1 truncate">
                            {result.title}
                          </span>
                          <span className="shrink-0 text-[11px] font-medium uppercase tracking-wider text-neutral-400 dark:text-white/35">
                            Post
                          </span>
                        </Link>
                      ))}
                    </div>
                  </section>
                )}
              </>
            )}

            {/* Pages */}
            {filteredPages.length > 0 && (
              <section aria-label="Pages">
                <SectionHeading>Pages</SectionHeading>
                <div className="grid grid-cols-2 gap-0.5">
                  {filteredPages.map((page) => {
                    const Icon = page.icon;
                    const isActive = pathname === page.link;
                    return (
                      <Link
                        key={page.name}
                        href={page.link}
                        onClick={onClose}
                        className={`${itemTile} ${
                          isActive
                            ? "bg-neutral-200/70 text-neutral-800 dark:bg-white/[0.09] dark:text-white"
                            : ""
                        }`}
                      >
                        <span
                          className={`${iconTile} ${
                            isActive
                              ? "bg-neutral-300/60 ring-neutral-400/60 text-neutral-700 dark:bg-white/[0.12] dark:ring-white/25 dark:text-white"
                              : ""
                          }`}
                        >
                          <Icon className="size-[22px] max-sm:size-[30px]" />
                        </span>
                        <span className="min-w-0 flex-1 truncate">
                          {page.name}
                        </span>
                        {isActive && (
                          <span className="mr-1 size-2 shrink-0 rounded-full bg-neutral-900 shadow-[0_0_8px_rgba(0,0,0,0.35)] dark:bg-white dark:shadow-[0_0_8px_rgba(255,255,255,0.8)]" />
                        )}
                      </Link>
                    );
                  })}
                </div>
              </section>
            )}

            {/* Connect */}
            {filteredConnect.length > 0 && (
              <section aria-label="Connect">
                <SectionHeading>Connect</SectionHeading>
                <div className="grid grid-cols-3 gap-0.5">
                  {filteredConnect.map((item) => (
                    <a
                      key={item.name}
                      href={item.link}
                      target="_blank"
                      rel="noopener noreferrer"
                      onClick={onClose}
                      className={`${itemTile} group`}
                    >
                      <span className={iconTile}>
                        <BrandIcon name={item.name} />
                      </span>
                      <span className="min-w-0 flex-1 truncate">
                        {item.name}
                      </span>
                      <ArrowUpRight className="size-4 shrink-0 text-neutral-300 transition-colors group-hover:text-neutral-500 dark:text-white/25 dark:group-hover:text-white/60" />
                    </a>
                  ))}
                </div>
              </section>
            )}

            {/* Legal */}
            {filteredLegal.length > 0 && (
              <section aria-label="Legal">
                <SectionHeading>Legal</SectionHeading>
                <div className="grid grid-cols-2 gap-0.5">
                  {filteredLegal.map((item) => {
                    const Icon = item.icon;
                    return (
                      <Link
                        key={item.name}
                        href={item.link}
                        onClick={onClose}
                        className={itemTile}
                      >
                        <span className={iconTile}>
                          <Icon className="size-[22px] max-sm:size-[30px]" />
                        </span>
                        <span className="min-w-0 flex-1 truncate">
                          {item.name}
                        </span>
                      </Link>
                    );
                  })}
                </div>
              </section>
            )}

            {/* Discover */}
            {filteredDiscover.length > 0 && (
              <section aria-label="Discover" className="pb-1">
                <SectionHeading>Discover</SectionHeading>
                <div className="grid grid-cols-2 gap-0.5">
                  {filteredDiscover.map((item) => {
                    const Icon = item.icon;
                    return (
                      <a
                        key={item.name}
                        href={item.link}
                        target="_blank"
                        rel="noopener noreferrer"
                        onClick={onClose}
                        className={`${itemTile} group`}
                      >
                        <span className={iconTile}>
                          <Icon className="size-[22px] max-sm:size-[30px]" />
                        </span>
                        <span className="min-w-0 flex-1 truncate">
                          {item.name}
                        </span>
                        <ArrowUpRight className="size-4 shrink-0 text-neutral-300 transition-colors group-hover:text-neutral-500 dark:text-white/25 dark:group-hover:text-white/60" />
                      </a>
                    );
                  })}
                </div>
              </section>
            )}

            {nothingFound && (
              <div className="flex flex-col items-center gap-4 px-6 py-10 text-center">
                <span className="flex size-14 items-center justify-center rounded-full ring-1 ring-neutral-200 text-neutral-400 dark:ring-white/15 dark:text-white/40">
                  <SearchX className="size-7" />
                </span>
                <div className="space-y-1">
                  <p className="text-lg font-semibold text-neutral-900 dark:text-white">
                    No results for &ldquo;{query.trim()}&rdquo;
                  </p>
                  <p className="text-[15px] text-neutral-400 dark:text-white/40">
                    Try a different keyword, or explore these instead
                  </p>
                </div>
                <div className="flex flex-wrap items-center justify-center gap-2">
                  <Link
                    href="/projects"
                    onClick={onClose}
                    className="flex items-center gap-2 rounded-full border border-neutral-200 bg-neutral-100/90 px-4 py-2 text-[15px] font-medium text-neutral-700 transition hover:bg-neutral-200/80 dark:border-white/[0.08] dark:bg-white/[0.07] dark:text-white/80 dark:hover:bg-white/[0.12] dark:hover:text-white"
                  >
                    <Folder className="size-4" /> Browse Projects
                  </Link>
                  <Link
                    href="/blog"
                    onClick={onClose}
                    className="flex items-center gap-2 rounded-full border border-neutral-200 bg-neutral-100/90 px-4 py-2 text-[15px] font-medium text-neutral-700 transition hover:bg-neutral-200/80 dark:border-white/[0.08] dark:bg-white/[0.07] dark:text-white/80 dark:hover:bg-white/[0.12] dark:hover:text-white"
                  >
                    <FileText className="size-4" /> Browse Posts
                  </Link>
                  <Link
                    href="/contact"
                    onClick={onClose}
                    className="flex items-center gap-2 rounded-full border border-neutral-200 bg-neutral-100/90 px-4 py-2 text-[15px] font-medium text-neutral-700 transition hover:bg-neutral-200/80 dark:border-white/[0.08] dark:bg-white/[0.07] dark:text-white/80 dark:hover:bg-white/[0.12] dark:hover:text-white"
                  >
                    <Mail className="size-4" /> Get in Touch
                  </Link>
                </div>
              </div>
            )}
          </div>
          </div>
          </div>
        </motion.div>
      </div>
      )}
    </AnimatePresence>
  );
}
