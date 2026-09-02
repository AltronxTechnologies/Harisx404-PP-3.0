"use client";

import { useState, useMemo, useEffect, useRef } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import {
  Search,
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
import { ThemeToggle } from "../ThemeToggle";
import { BrandGlyph } from "../BrandGlyph";
import {
  circleBtn,
  pillSurface,
  cardShell,
  CONTROL_ICON,
  CONTROL_ICON_STROKE,
} from "./modalSurfaces";

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
  // Paths live in the shared BrandGlyph so the same three marks cannot drift.
  return <BrandGlyph name={name} className="size-6" />;
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


/* Row tile — inner 16px radius tier and the same hover step as the Reach Out
   action cards. Sizes are the Reach Out scale (x1.2 of the old 660px shell). */
const itemTile =
  "flex items-center gap-4 rounded-2xl px-3 py-3 text-xl font-medium transition-colors " +
  "text-neutral-700 hover:bg-neutral-200/80 dark:text-white/80 dark:hover:bg-white/[0.1] dark:hover:text-white";

/* Icon tile — identical recipe to the Reach Out action-card circle (filled, no
   ring), sized for a list row. Reach Out: 68px circle / 28px glyph. */
const iconTile =
  "flex size-12 shrink-0 items-center justify-center rounded-full " +
  "bg-neutral-200/80 text-neutral-700 dark:bg-white/10 dark:text-white/80";

function ResultGroupHeading({ children }: { children: React.ReactNode }) {
  return (
    <h3 className="px-4 pb-2 pt-4 text-lg font-medium text-text-secondary">
      {children}
    </h3>
  );
}

export function SearchModal({
  isOpen,
  onClose,
  onOpenReachOut,
}: SearchModalProps) {
  const pathname = usePathname();

  const dialogRef = useRef<HTMLDivElement>(null);
  const requestIdRef = useRef(0);

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

  // Focus the input only on desktop-style devices — on phones the keyboard
  // must not pop open by itself; it opens when the user taps the search bar.
  const inputRef = useRef<HTMLInputElement>(null);
  useEffect(() => {
    if (!isOpen) return;
    const isDesktop =
      window.matchMedia("(min-width: 640px)").matches &&
      window.matchMedia("(hover: hover) and (pointer: fine)").matches;
    const id = setTimeout(() => {
      if (isDesktop) inputRef.current?.focus();
      else dialogRef.current?.focus();
    }, 50);
    return () => clearTimeout(id);
  }, [isOpen]);

  // Debounced content search via /api/ai/search
  useEffect(() => {
    if (!isOpen) {
      requestIdRef.current += 1;
      setIsSearching(false);
      return;
    }
    const trimmed = query.trim();
    if (trimmed.length < 2) {
      requestIdRef.current += 1;
      setResults([]);
      setIsSearching(false);
      setSearchError(null);
      setHasSearched(false);
      return;
    }

    const requestId = ++requestIdRef.current;
    setIsSearching(true);
    setSearchError(null);
    setHasSearched(false);
    setResults([]);
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
        if (requestId === requestIdRef.current && !controller.signal.aborted) {
          setResults(Array.isArray(data.results) ? data.results : []);
          setHasSearched(true);
        }
      } catch (err: any) {
        if (err?.name === "AbortError") return;
        if (requestId === requestIdRef.current) {
          setSearchError("Search is unavailable right now. Try again in a moment.");
          setResults([]);
          setHasSearched(true);
        }
      } finally {
        if (requestId === requestIdRef.current) setIsSearching(false);
      }
    }, 350);

    return () => {
      controller.abort();
      clearTimeout(timer);
      if (requestId === requestIdRef.current) requestIdRef.current += 1;
    };
  }, [isOpen, query]);

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
    hasSearched &&
    !searchError &&
    q.length >= 2 &&
    filteredPages.length === 0 &&
    filteredConnect.length === 0 &&
    filteredLegal.length === 0 &&
    filteredDiscover.length === 0 &&
    results.length === 0 &&
    !isSearching;
  const visibleResultCount =
    results.length +
    filteredPages.length +
    filteredConnect.length +
    filteredLegal.length +
    filteredDiscover.length;
  const searchStatus = isSearching
    ? "Searching"
    : searchError
      ? searchError
      : q.length > 0
        ? `${visibleResultCount} ${visibleResultCount === 1 ? "result" : "results"} available`
        : "";

  // Escape closes + body scroll lock
  useEffect(() => {
    if (!isOpen) return;
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    // Trap Tab inside the dialog — identical behaviour to ReachOutModal.
    const trap = (e: KeyboardEvent) => {
      if (e.key !== "Tab") return;
      const root = dialogRef.current;
      if (!root) return;
      const focusable = Array.from(
        root.querySelectorAll<HTMLElement>(
          'a[href], button:not([disabled]), textarea, input, select, [tabindex]:not([tabindex="-1"])',
        ),
      ).filter((el) => el.offsetParent !== null);
      if (focusable.length === 0) return;
      const first = focusable[0];
      const last = focusable[focusable.length - 1];
      const active = document.activeElement as HTMLElement | null;
      if (e.shiftKey && (active === first || !root.contains(active))) {
        e.preventDefault();
        last.focus();
      } else if (!e.shiftKey && (active === last || !root.contains(active))) {
        e.preventDefault();
        first.focus();
      }
    };
    const previouslyFocused = document.activeElement as HTMLElement | null;
    window.addEventListener("keydown", handleKeyDown);
    window.addEventListener("keydown", trap);
    document.body.classList.add("modal-open");
    return () => {
      window.removeEventListener("keydown", handleKeyDown);
      window.removeEventListener("keydown", trap);
      document.body.classList.remove("modal-open");
      previouslyFocused?.focus?.();
    };
  }, [isOpen, onClose]);

  useEffect(() => {
    if (!isOpen || !dialogRef.current) return;
    const restored: Array<{
      element: HTMLElement;
      inert: boolean;
      ariaHidden: string | null;
    }> = [];
    let branch: HTMLElement = dialogRef.current;

    while (branch.parentElement) {
      const parent = branch.parentElement;
      for (const sibling of Array.from(parent.children)) {
        if (!(sibling instanceof HTMLElement) || sibling === branch) continue;
        restored.push({
          element: sibling,
          inert: sibling.inert,
          ariaHidden: sibling.getAttribute("aria-hidden"),
        });
        sibling.inert = true;
        sibling.setAttribute("aria-hidden", "true");
      }
      branch = parent;
      if (parent === document.body) break;
    }

    return () => {
      for (const { element, inert, ariaHidden } of restored) {
        element.inert = inert;
        if (ariaHidden === null) element.removeAttribute("aria-hidden");
        else element.setAttribute("aria-hidden", ariaHidden);
      }
    };
  }, [isOpen]);

  // NOTE: no early `return null` here — the tree must stay mounted inside
  // AnimatePresence so the modal can play its exit animation on close
  // (mirrors ReachOutModal's structure).
  return (
    <AnimatePresence>
      {isOpen && (
      <div
        ref={dialogRef}
        tabIndex={-1}
        className="fixed inset-0 z-[7000] flex items-end justify-center px-4 pt-4 pb-[15px] outline-none"
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
          className="relative z-10 mx-3 w-[92vw] max-w-[792px]"
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
          <div className="mb-4 flex items-center gap-[7px]">
            <div
              className={`${pillSurface} focus-within:outline focus-within:outline-2 focus-within:outline-offset-2 focus-within:outline-violet-600 dark:focus-within:outline-violet-400`}
            >
              <Search className="size-7 shrink-0 text-text-secondary" />
              <input
                ref={inputRef}
                type="text"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder={PLACEHOLDERS[placeholderIndex]}
                aria-label="Search"
                className="w-full bg-transparent text-xl text-neutral-900 placeholder-neutral-400 focus:outline-none dark:text-white dark:placeholder-white/30"
              />
              {query && (
                <button
                  onClick={() => setQuery("")}
                  aria-label="Clear search"
                  className="relative text-text-secondary transition-colors before:absolute before:right-0 before:top-1/2 before:size-[68px] before:-translate-y-1/2 before:content-[''] hover:text-neutral-900 dark:hover:text-white"
                >
                  <X className="size-5" />
                </button>
              )}
            </div>

            <div className="flex shrink-0 items-center gap-[7px]">
              <button
                onClick={() => {
                  onClose();
                  onOpenReachOut();
                }}
                aria-label="Reach out"
                className={`${circleBtn} flex`}
              >
                <MessageSquare className={CONTROL_ICON} />
              </button>

              <ThemeToggle
                className={`${circleBtn} flex cursor-pointer`}
                iconClassName={CONTROL_ICON}
                strokeWidth={CONTROL_ICON_STROKE}
              />

              <button onClick={onClose} aria-label="Close" className={circleBtn}>
                <X className={CONTROL_ICON} />
              </button>
            </div>
          </div>

          {/* Results panel — same card shell as ReachOutModal */}
          <div className={`overflow-hidden ${cardShell}`}>
          {/* Single scroll area — sized so the whole modal is the EXACT same height
              as the Reach Out modal (locked reference). 634px is measured, not
              guessed: with the cap at 559 the wrapper was 647px tall vs Reach Out's
              722px, so 559 + (722-647) = 634. Confirmed independently: a cap of 606
              gave 694 (694 + 28 = 722). Card padding p-4 also matches Reach Out's
              shell. Do not change one without re-measuring the other. */}
          <div
            aria-busy={isSearching}
            className={
              "max-h-[634px] overflow-y-auto p-4 " +
              // Thin divider between category groups (Pages / Connect / Legal /
              // Discover, and the Projects / Blog Posts result groups). The
              // `section + section` selector means the line only ever appears
              // BETWEEN groups: the first visible group never gets a leading
              // rule, so filtering by a query cannot leave a stray divider.
              // Fragments render no DOM node, so every <section> is a direct
              // child here. border-border-primary is the project-wide divider
              // token (#D6DADE light / white-10 dark).
              "[&>section+section]:border-t [&>section+section]:border-border-primary"
            }
          >
            <span role="status" aria-live="polite" className="sr-only">
              {searchStatus}
            </span>
            {/* Content search results, grouped professionally */}
            {q.length >= 2 && (
              <>
                {isSearching && (
                  <div className="flex items-center gap-2 px-3 pb-1.5 pt-3">
                    <Loader2 className="size-5 animate-spin text-text-secondary" />
                    <span className="text-[15px] font-medium text-text-secondary">
                      Searching&hellip;
                    </span>
                  </div>
                )}

                {searchError && (
                  <p role="alert" className="px-4 py-3 text-base text-text-secondary">
                    {searchError}
                  </p>
                )}

                {/* Projects */}
                {projectResults.length > 0 && (
                  <section aria-label="Projects">
                    <ResultGroupHeading>
                      Projects{" "}
                      <span className="text-text-secondary">
                        ({projectResults.length})
                      </span>
                    </ResultGroupHeading>
                    <div className="grid grid-cols-1 gap-0.5">
                      {projectResults.map((result) => (
                        <Link
                          key={`project-${result.link}`}
                          href={result.link}
                          onClick={onClose}
                          className={itemTile}
                        >
                          <span className={iconTile}>
                            <Folder className="size-6" />
                          </span>
                          <span className="min-w-0 flex-1 truncate">
                            {result.title}
                          </span>
                          <span className="shrink-0 text-[13px] font-medium uppercase tracking-wider text-text-secondary">
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
                    <ResultGroupHeading>
                      Blog Posts{" "}
                      <span className="text-text-secondary">
                        ({postResults.length})
                      </span>
                    </ResultGroupHeading>
                    <div className="grid grid-cols-1 gap-0.5">
                      {postResults.map((result) => (
                        <Link
                          key={`post-${result.link}`}
                          href={result.link}
                          onClick={onClose}
                          className={itemTile}
                        >
                          <span className={iconTile}>
                            <FileText className="size-6" />
                          </span>
                          <span className="min-w-0 flex-1 truncate">
                            {result.title}
                          </span>
                          <span className="shrink-0 text-[13px] font-medium uppercase tracking-wider text-text-secondary">
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
                <ResultGroupHeading>Pages</ResultGroupHeading>
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
                              ? "bg-neutral-300/60 text-neutral-700 dark:bg-white/[0.12] dark:text-white"
                              : ""
                          }`}
                        >
                          <Icon className="size-6" />
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
                <ResultGroupHeading>Connect</ResultGroupHeading>
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
                      <ArrowUpRight className="size-5 shrink-0 text-text-secondary transition-colors group-hover:text-neutral-700 dark:group-hover:text-white" />
                    </a>
                  ))}
                </div>
              </section>
            )}

            {/* Legal */}
            {filteredLegal.length > 0 && (
              <section aria-label="Legal">
                <ResultGroupHeading>Legal</ResultGroupHeading>
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
                          <Icon className="size-6" />
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
                <ResultGroupHeading>Discover</ResultGroupHeading>
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
                          <Icon className="size-6" />
                        </span>
                        <span className="min-w-0 flex-1 truncate">
                          {item.name}
                        </span>
                        <ArrowUpRight className="size-5 shrink-0 text-text-secondary transition-colors group-hover:text-neutral-700 dark:group-hover:text-white" />
                      </a>
                    );
                  })}
                </div>
              </section>
            )}

            {nothingFound && (
              <div className="flex flex-col items-center gap-4 px-6 py-10 text-center">
                <span className="flex size-[68px] items-center justify-center rounded-full bg-neutral-200/80 text-neutral-700 dark:bg-white/10 dark:text-white/80">
                  <SearchX className="size-7" />
                </span>
                <div className="space-y-1">
                  <p className="text-lg font-semibold text-neutral-900 dark:text-white">
                    No results for &ldquo;{query.trim()}&rdquo;
                  </p>
                  <p className="text-[15px] text-text-secondary">
                    Try a different keyword, or explore these instead
                  </p>
                </div>
                <div className="flex flex-wrap items-center justify-center gap-2">
                  <Link
                    href="/projects"
                    onClick={onClose}
                    className="flex items-center gap-2 rounded-full border border-neutral-200 bg-neutral-100/90 px-4 py-2 text-[15px] font-medium text-neutral-700 transition hover:bg-neutral-200/80 dark:border-white/[0.08] dark:bg-white/[0.07] dark:text-white/80 dark:hover:bg-white/[0.12] dark:hover:text-white"
                  >
                    <Folder className="size-5" /> Browse Projects
                  </Link>
                  <Link
                    href="/blog"
                    onClick={onClose}
                    className="flex items-center gap-2 rounded-full border border-neutral-200 bg-neutral-100/90 px-4 py-2 text-[15px] font-medium text-neutral-700 transition hover:bg-neutral-200/80 dark:border-white/[0.08] dark:bg-white/[0.07] dark:text-white/80 dark:hover:bg-white/[0.12] dark:hover:text-white"
                  >
                    <FileText className="size-5" /> Browse Posts
                  </Link>
                  <Link
                    href="/contact"
                    onClick={onClose}
                    className="flex items-center gap-2 rounded-full border border-neutral-200 bg-neutral-100/90 px-4 py-2 text-[15px] font-medium text-neutral-700 transition hover:bg-neutral-200/80 dark:border-white/[0.08] dark:bg-white/[0.07] dark:text-white/80 dark:hover:bg-white/[0.12] dark:hover:text-white"
                  >
                    <Mail className="size-5" /> Get in Touch
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
