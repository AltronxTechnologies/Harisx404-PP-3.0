"use client";

import React, { useState, useEffect, useRef } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { motion, AnimatePresence, MotionConfig, useReducedMotion } from "framer-motion";
import Image from "next/image";
import { ReachOutModal } from "./navbar/ReachOutModal";
import { SearchModal } from "./navbar/SearchModal";
import { ThemeToggle, navCircleSurface } from "./ThemeToggle";

const NAV_LINKS = [
  { name: "Home", href: "/" },
  { name: "About", href: "/about" },
  { name: "Projects", href: "/projects" },
  { name: "Blog", href: "/blog" },
];

export default function Navbar() {
  const pathname = usePathname();
  const [hoveredTab, setHoveredTab] = useState<string | null>(null);
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const [isCommandPaletteOpen, setIsCommandPaletteOpen] = useState(false);
  const [isReachOutOpen, setIsReachOutOpen] = useState(false);
  const prefersReducedMotion = useReducedMotion();

  // Touch-safe "More" dropdown: remember when hover opened it so the tap's
  // synthetic click (fired right after mouseenter on touch) doesn't re-toggle.
  const dropdownOpenedAt = useRef(0);
  const navRowRef = useRef<HTMLDivElement>(null);
  const pillRef = useRef<HTMLDivElement>(null);
  const moreTriggerRef = useRef<HTMLButtonElement>(null);
  const firstDropdownLinkRef = useRef<HTMLAnchorElement>(null);

  // Morph geometry: the dropdown panel starts clipped to the pill's EXACT
  // rect (measured at open time) so the expansion reads as the navbar
  // itself enlarging — never a second box appearing behind it.
  const [pillClip, setPillClip] = useState(
    "inset(0px 32% calc(100% - 52px) 32% round 22px)"
  );
  const measurePillClip = () => {
    const pill = pillRef.current;
    if (!pill) return;
    const r = pill.getBoundingClientRect();
    const panelW = Math.min(740, window.innerWidth * 0.92);
    const hx = Math.max((panelW - r.width) / 2, 0);
    setPillClip(
      `inset(0px ${hx.toFixed(1)}px calc(100% - ${r.height.toFixed(1)}px) ${hx.toFixed(1)}px round 22px)`
    );
  };
  const openDropdown = (focusFirst = false) => {
    measurePillClip();
    if (!isDropdownOpen) dropdownOpenedAt.current = Date.now();
    setIsDropdownOpen(true);
    if (focusFirst) requestAnimationFrame(() => firstDropdownLinkRef.current?.focus());
  };

  // Greeting State
  const [greeting, setGreeting] = useState("Good Evening");
  const [greetingIcon, setGreetingIcon] = useState("🌙");
  const [showGreeting, setShowGreeting] = useState(true);
  const [sideControlsReady, setSideControlsReady] = useState(false);

  // Mobile pill content cycle: 0 = Harisx404, 1 = logo, 2 = Explore now
  const [mobileCycle, setMobileCycle] = useState(0);

  useEffect(() => {
    if (showGreeting || prefersReducedMotion) return;
    // The cycling pill only exists below md — don't tick on larger screens.
    const mq = window.matchMedia("(max-width: 767px)");
    let interval: ReturnType<typeof setInterval> | undefined;
    const sync = () => {
      clearInterval(interval);
      if (mq.matches) {
        interval = setInterval(() => {
          setMobileCycle((prev) => (prev + 1) % 3);
        }, 3200);
      }
    };
    sync();
    mq.addEventListener("change", sync);
    return () => {
      clearInterval(interval);
      mq.removeEventListener("change", sync);
    };
  }, [prefersReducedMotion, showGreeting]);

  useEffect(() => {
    if (prefersReducedMotion) {
      setShowGreeting(false);
      setSideControlsReady(true);
      return;
    }
    const hour = new Date().getHours();
    if (hour >= 5 && hour < 12) {
      setGreeting("Good Morning");
      setGreetingIcon("🌅");
    } else if (hour >= 12 && hour < 17) {
      setGreeting("Good Afternoon");
      setGreetingIcon("☀️");
    } else {
      setGreeting("Good Evening");
      setGreetingIcon("🌙");
    }

    const timer = setTimeout(() => {
      setShowGreeting(false);
    }, 2200);
    const controlsTimer = setTimeout(() => setSideControlsReady(true), 2600);
    return () => {
      clearTimeout(timer);
      clearTimeout(controlsTimer);
    };
  }, [prefersReducedMotion]);

  // Keyboard shortcut: Cmd+K / Ctrl+K for search
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === "k") {
        e.preventDefault();
        // Only one overlay at a time — ⌘K over the Reach Out modal swaps to search.
        setIsReachOutOpen(false);
        setIsCommandPaletteOpen((prev) => !prev);
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, []);

  // The blog filter bar's search button dispatches "open-search-modal". Nothing
  // listened for it, so that button silently did nothing. The search modal
  // state lives here, so this is where the listener belongs.
  useEffect(() => {
    const openSearch = () => {
      setIsReachOutOpen(false);
      setIsCommandPaletteOpen(true);
    };
    window.addEventListener("open-search-modal", openSearch);
    return () => window.removeEventListener("open-search-modal", openSearch);
  }, []);

  // Close the More dropdown on outside tap/click (touch has no mouse-leave)
  // and on Escape.
  useEffect(() => {
    if (!isDropdownOpen) return;
    const handlePointerDown = (e: PointerEvent) => {
      if (navRowRef.current && !navRowRef.current.contains(e.target as Node)) {
        setIsDropdownOpen(false);
      }
    };
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        setIsDropdownOpen(false);
        requestAnimationFrame(() => moreTriggerRef.current?.focus());
      }
    };
    document.addEventListener("pointerdown", handlePointerDown);
    window.addEventListener("keydown", handleKeyDown);
    return () => {
      document.removeEventListener("pointerdown", handlePointerDown);
      window.removeEventListener("keydown", handleKeyDown);
    };
  }, [isDropdownOpen]);

  useEffect(() => {
    if (!isDropdownOpen) return;
    const syncGeometry = () => {
      if (window.innerWidth < 768) {
        setIsDropdownOpen(false);
        return;
      }
      const pill = pillRef.current;
      if (!pill) return;
      const r = pill.getBoundingClientRect();
      const panelW = Math.min(740, window.innerWidth * 0.92);
      const hx = Math.max((panelW - r.width) / 2, 0);
      setPillClip(
        `inset(0px ${hx.toFixed(1)}px calc(100% - ${r.height.toFixed(1)}px) ${hx.toFixed(1)}px round 22px)`
      );
    };
    const observer = new ResizeObserver(syncGeometry);
    if (pillRef.current) observer.observe(pillRef.current);
    window.addEventListener("resize", syncGeometry);
    return () => {
      observer.disconnect();
      window.removeEventListener("resize", syncGeometry);
    };
  }, [isDropdownOpen]);

  let activeTab: string | null = pathname === "/" ? "Home" : null;
  if (pathname === "/about" || pathname.startsWith("/about")) activeTab = "About";
  else if (pathname === "/projects" || pathname.startsWith("/projects")) activeTab = "Projects";
  else if (pathname === "/blog" || pathname.startsWith("/blog")) activeTab = "Blog";
  const isRouteActive = (route: string) =>
    pathname === route || pathname.startsWith(`${route}/`);
  const isMoreActive = ["/community-wall", "/stats", "/credentials", "/contact", "/links"]
    .some(isRouteActive);

  return (
    <MotionConfig reducedMotion="user">
      {/* inset-x-0 anchors the fixed header to the viewport — without it,
          a fixed element keeps its static x-position inside the centered
          max-w-7xl body, drifting right by (vw-1280)/2 on wide screens. */}
      <header className="fixed inset-x-0 top-2.5 z-[5000] w-full md:top-4 pointer-events-none flex justify-center">
        <nav className="container flex flex-col items-center py-1.5 pointer-events-none">
          {/* Centering model: the pill wrapper is the centered element;
              the search/theme buttons hang off its right edge via an
              absolutely-positioned rail so they never shift the pill off
              true center (the old flex-sibling layout pushed the pill
              ~54px left of center on desktop and needed translate hacks). */}
          <div className="relative flex items-start justify-center pointer-events-auto">
            
            {/* The main navbar container — top layer so the More menu covers the side buttons */}
            <div 
              ref={navRowRef}
              className="relative z-20 flex justify-center"
              onMouseLeave={() => {
                setIsDropdownOpen(false);
                setHoveredTab(null);
              }}
            >
              {/* The main morphing pill container. While the dropdown is
                  open, the pill's own surface (bg/shadow) fades out so the
                  expanding panel is the ONLY visible box — the nav links
                  simply live inside its top edge. That makes the whole
                  thing read as the navbar itself enlarging. */}
              <motion.div
                layout
                ref={pillRef}
                className={`relative z-10 flex flex-col items-center justify-start p-1.5 transition-[background-color,box-shadow] duration-[400ms] ${
                  isDropdownOpen
                    ? "md:!bg-transparent md:!shadow-none"
                    : "bg-white/90 max-md:bg-white/40 shadow-[0_10px_30px_-14px_rgba(0,0,0,0.22),0_3px_8px_-4px_rgba(0,0,0,0.08)] shadow-border dark:bg-[#1c1c1c]/90 max-md:dark:bg-[#1c1c1c]/40 dark:shadow-none"
                } overflow-hidden backdrop-blur-md max-md:backdrop-blur-xl max-md:!rounded-full max-md:p-1 max-md:ring-1 max-md:ring-neutral-300/60 max-md:dark:ring-white/15`}
                initial={{ borderRadius: "22px" }}
                animate={{ borderRadius: isDropdownOpen ? "24px" : "22px" }}
                transition={{ type: "spring", stiffness: 400, damping: 30 }}
                style={{
                  minHeight: "40px",
                }}
              >
                  
                {/* Top Row: Nav Links */}
                <AnimatePresence mode="wait">
                  {showGreeting ? (
                    <motion.div
                      key="greeting"
                      initial={{ opacity: 0, scale: 0.95 }}
                      animate={{ opacity: 1, scale: 1 }}
                      exit={{ opacity: 0, scale: 0.95, filter: "blur(4px)" }}
                      transition={{ duration: 0.4, ease: "easeInOut" }}
                      className="flex items-center justify-center gap-2 px-6 py-1"
                    >
                      <span className="text-[15px]">{greetingIcon}</span>
                      <span className="text-[15px] font-medium text-neutral-800 dark:text-white/90 tracking-wide">
                        {greeting}
                      </span>
                    </motion.div>
                  ) : (
                    <motion.div
                      key="nav-links"
                      initial={{ opacity: 0, scale: 0.95, filter: "blur(4px)" }}
                      animate={{ opacity: 1, scale: 1, filter: "blur(0px)" }}
                      transition={{ duration: 0.4, ease: "easeInOut" }}
                      className="relative flex items-center justify-center w-full"
                    >
                      {/* Mobile compact pill — brand on the left, chevron on the right, opens the Search modal */}
                      <button
                        type="button"
                        onClick={() => setIsCommandPaletteOpen(true)}
                        aria-label="Open menu & search"
                        className="flex md:hidden items-center justify-between gap-4 min-w-[182px] pl-5 pr-4 py-0.5 cursor-pointer select-none outline-none focus-visible:ring-2 focus-visible:ring-blue-500/40 dark:focus-visible:ring-white/25 rounded-full"
                      >
                        <span className="relative flex h-7 items-center overflow-hidden">
                          <AnimatePresence mode="wait">
                            {mobileCycle === 0 && (
                              <motion.span
                                key="brand-text"
                                initial={{ opacity: 0, y: 10, filter: "blur(4px)" }}
                                animate={{ opacity: 1, y: 0, filter: "blur(0px)" }}
                                exit={{ opacity: 0, y: -10, filter: "blur(4px)" }}
                                transition={{ duration: 0.35, ease: [0.22, 1, 0.36, 1] }}
                                className="text-[15px] font-bold tracking-wider text-neutral-600 dark:text-white/75 whitespace-nowrap"
                              >
                                Harisx404
                              </motion.span>
                            )}
                            {mobileCycle === 1 && (
                              <motion.span
                                key="brand-logo"
                                initial={{ opacity: 0, scale: 0.6, rotate: -90 }}
                                animate={{ opacity: 1, scale: 1, rotate: 0 }}
                                exit={{ opacity: 0, scale: 0.6, rotate: 90 }}
                                transition={{ duration: 0.35, ease: [0.22, 1, 0.36, 1] }}
                                className="inline-flex h-6 items-center"
                              >
                                <Image
                                  src="/brand/harisx404 black transparent.png"
                                  alt="harisx404 logo"
                                  width={64}
                                  height={45}
                                  className="h-5 w-auto object-contain dark:hidden"
                                />
                                <Image
                                  src="/brand/harisx404 white transparent.png"
                                  alt="harisx404 logo"
                                  width={64}
                                  height={48}
                                  className="hidden h-5 w-auto object-contain dark:block"
                                />
                              </motion.span>
                            )}
                            {mobileCycle === 2 && (
                              <motion.span
                                key="brand-cta"
                                initial={{ opacity: 0, y: 10, filter: "blur(4px)" }}
                                animate={{ opacity: 1, y: 0, filter: "blur(0px)" }}
                                exit={{ opacity: 0, y: -10, filter: "blur(4px)" }}
                                transition={{ duration: 0.35, ease: [0.22, 1, 0.36, 1] }}
                                className="inline-flex items-center gap-1.5 text-[15px] font-medium text-neutral-800 dark:text-white/90 tracking-wide whitespace-nowrap"
                              >
                                <span className="inline-block size-1.5 rounded-full bg-emerald-500 animate-pulse motion-reduce:animate-none" />
                                Explore now
                              </motion.span>
                            )}
                          </AnimatePresence>
                        </span>
                        <motion.svg
                          className="size-3.5 shrink-0 text-neutral-600 dark:text-white/60"
                          fill="none"
                          viewBox="0 0 24 24"
                          animate={{ rotate: isCommandPaletteOpen ? 180 : 0 }}
                          transition={{ type: "spring", stiffness: 400, damping: 30 }}
                        >
                          <path
                            d="M19 9l-7 7-7-7"
                            stroke="currentColor"
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth="2"
                          />
                        </motion.svg>
                      </button>

                      {/* Links */}
                      <div className="relative hidden md:flex items-center z-10" onMouseLeave={() => setHoveredTab(null)}>
                        {NAV_LINKS.map((link) => (
                          <div
                            key={link.name}
                            className="relative list-none"
                            onMouseEnter={() => {
                              setHoveredTab(link.name);
                              setIsDropdownOpen(false);
                            }}
                          >
                            <Link
                              href={link.href}
                              prefetch={true}
                              aria-current={activeTab === link.name ? "page" : undefined}
                              className={`relative z-10 block px-4 py-1.5 font-normal text-sm transition-colors duration-150 rounded-full outline-none focus-visible:ring-2 focus-visible:ring-blue-500/40 dark:focus-visible:ring-white/25 ${
                                activeTab === link.name
                                  ? "text-neutral-950 dark:text-white font-medium"
                                  : "text-neutral-700 hover:text-neutral-950 dark:text-white/70 dark:hover:text-white"
                              }`}
                            >
                              {link.name}
                            </Link>
                            
                            {/* Hover background bubble */}
                            {hoveredTab === link.name && (
                              <motion.div
                                layoutId="hover-bg"
                                className="absolute inset-0 z-0 rounded-full bg-neutral-900/10 dark:bg-white/10"
                                initial={{ opacity: 0 }}
                                animate={{ opacity: 1 }}
                                exit={{ opacity: 0 }}
                                transition={{ type: "spring", stiffness: 500, damping: 35 }}
                              />
                            )}
                            
                            {/* Active state background bubble */}
                            {activeTab === link.name && !hoveredTab && (
                              <motion.div
                                layoutId="active-bg"
                                className="absolute inset-0 z-0 rounded-full bg-neutral-900/5 dark:bg-[#2D2D2D]"
                                initial={{ opacity: 0 }}
                                animate={{ opacity: 1 }}
                                exit={{ opacity: 0 }}
                                transition={{ duration: 0.2 }}
                              />
                            )}
                            
                            {/* The moving white active indicator line */}
                            {((activeTab === link.name && !hoveredTab) || (hoveredTab === link.name)) && (
                              <motion.div
                                layoutId="active-indicator-line"
                                className="absolute -top-1.5 left-1/2 -ml-4 z-0 h-1 w-8 rounded-t-full bg-neutral-900 dark:bg-white pointer-events-none"
                                initial={{ opacity: 0 }}
                                animate={{ opacity: 1 }}
                                exit={{ opacity: 0 }}
                                transition={{ type: "spring", stiffness: 500, damping: 35 }}
                              >
                                <div className="absolute -top-3 -left-2 h-7 w-12 rounded-full bg-[radial-gradient(farthest-side_at_50%_50%,rgba(23,23,23,0.6),transparent)] blur-md dark:bg-[radial-gradient(farthest-side_at_50%_50%,rgba(255,255,255,0.7),transparent)]" />
                              </motion.div>
                            )}
                          </div>
                        ))}

                        {/* More Dropdown Trigger Text - ONLY triggers dropdown on hover */}
                        <div 
                          className="relative list-none"
                          onMouseEnter={() => {
                            setHoveredTab(null);
                            openDropdown();
                          }}
                        >
                          <button
                            ref={moreTriggerRef}
                            type="button"
                            aria-expanded={isDropdownOpen}
                            aria-controls="navbar-more-panel"
                            onClick={(event) => {
                              // On touch, mouseenter just opened it — don't close again.
                              // (Timestamp-based: state updates may still be batched here.)
                              if (Date.now() - dropdownOpenedAt.current < 450) return;
                              if (isDropdownOpen) {
                                setIsDropdownOpen(false);
                              } else {
                                openDropdown(event.detail === 0);
                              }
                            }}
                            className={`relative z-10 flex cursor-pointer select-none items-center gap-1 px-4 py-1.5 font-normal text-sm transition-colors duration-150 rounded-full outline-none focus-visible:ring-2 focus-visible:ring-blue-500/40 dark:focus-visible:ring-white/25 ${
                              isDropdownOpen || isMoreActive
                                ? "text-neutral-950 dark:text-white font-medium"
                                : "text-neutral-700 hover:text-neutral-950 dark:text-white/70 dark:hover:text-white"
                            }`}
                          >
                            More
                            <motion.svg
                              className="size-3"
                              fill="none"
                              viewBox="0 0 24 24"
                              animate={{ rotate: isDropdownOpen ? 180 : 0 }}
                              transition={{ type: "spring", stiffness: 400, damping: 30 }}
                            >
                              <path
                                d="M19 9l-7 7-7-7"
                                stroke="currentColor"
                                strokeLinecap="round"
                                strokeLinejoin="round"
                                strokeWidth="2"
                              />
                            </motion.svg>
                          </button>
                        </div>

                        {/* Book a Call Button */}
                        <div className="ml-1 list-none flex items-center relative z-10">
                          <button
                            type="button"
                            onClick={() => setIsReachOutOpen(true)}
                            className="relative flex items-center justify-center rounded-full bg-neutral-200 dark:bg-white/10 px-4 py-1.5 text-sm font-medium text-neutral-800 dark:text-white/80 transition-colors hover:bg-neutral-300 dark:hover:bg-white/15 dark:hover:text-white overflow-hidden shadow-[0_0_15px_rgba(255,255,255,0.05)] cursor-pointer"
                          >
                            <span>Let&apos;s Connect</span>
                            <div className="absolute bottom-0 h-1/3 w-full -translate-x-4 rounded-full bg-neutral-400/40 blur-sm dark:bg-white/35"></div>
                          </button>
                        </div>
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>

                {/* Dropdown moved to an absolute overlay panel below (see after the pill) */}
              </motion.div>

              {/* Dropdown Menu — absolute overlay panel: never affects layout, covers side buttons */}
              <AnimatePresence>
                {isDropdownOpen && (
                  /* Outer wrapper carries the drop-shadow: a parent's filter
                     wraps the CLIPPED silhouette of its children, so the
                     shadow stretches and shrinks with the morphing box
                     (filter on the clipped element itself gets clipped away,
                     because clip-path applies after filter). */
                   <motion.div
                     id="navbar-more-panel"
                     initial={{ x: "-50%" }}
                    animate={{ x: "-50%" }}
                    exit={{ x: "-50%" }}
                    className="absolute top-0 left-1/2 z-0 w-[740px] max-w-[92vw] [filter:drop-shadow(0_10px_15px_rgba(0,0,0,0.13))_drop-shadow(0_3px_4px_rgba(0,0,0,0.05))] dark:[filter:none]"
                  >
                  <motion.div
                    /* Pure geometry morph: the panel starts clipped to the
                       pill's exact measured rect (no fade, same bg/radius),
                       so the sides and bottom grow out of the navbar and
                       fold back into it on close — one continuous surface. */
                    initial={{
                      clipPath: prefersReducedMotion
                        ? "inset(0px 0px 0px 0px round 24px)"
                        : pillClip,
                    }}
                    animate={{
                      clipPath: "inset(0px 0px 0px 0px round 24px)",
                    }}
                    exit={{
                      clipPath: prefersReducedMotion
                        ? "inset(0px 0px 0px 0px round 24px)"
                        : pillClip,
                      transition: {
                        clipPath: {
                          duration: prefersReducedMotion ? 0 : 0.65,
                          ease: [0.4, 0, 0.2, 1],
                        },
                      },
                    }}
                    transition={{
                      clipPath: {
                        duration: prefersReducedMotion ? 0 : 0.9,
                        ease: [0.19, 1, 0.22, 1],
                      },
                    }}
                    style={{ transformOrigin: "top center", willChange: "clip-path" }}
                    /* Solid surface: backdrop-blur can't apply here (the
                       drop-shadow filter on the wrapper resets the backdrop
                       root), so translucency would just let the page bleed
                       through. Opaque bg keeps the panel crisp and readable. */
                    className="w-full rounded-3xl bg-white dark:bg-[#1c1c1c] pt-[52px] max-h-[calc(100dvh-40px)] overflow-y-auto overflow-x-hidden"
                  >
                      <motion.div 
                        /* Content is completely STATIC — it never moves or
                           staggers. The expanding clip simply reveals it, so
                           the whole thing reads as the navbar itself
                           enlarging (matching the reference). Only a fast
                           fade on close so images are never sliced while the
                           clip folds shut. */
                        exit={{ opacity: 0, transition: { duration: 0.16, ease: "easeOut" } }}
                        className="flex flex-col md:flex-row gap-2.5 p-2 pt-4 min-h-[240px]"
                      >
                        
                        {/* Community Wall Card */}
                        <motion.div
                          className="flex-1 min-h-[160px] max-md:flex-none max-md:h-40"
                        >
                          <Link 
                            ref={firstDropdownLinkRef}
                            href="/community-wall" 
                            aria-current={isRouteActive("/community-wall") ? "page" : undefined}
                            onClick={() => setIsDropdownOpen(false)}
                            className="group relative flex h-full w-full flex-col justify-end overflow-hidden rounded-2xl bg-neutral-900 p-4 ring-1 ring-black/5 dark:ring-white/10 hover:ring-black/15 dark:hover:ring-white/25 transition-all duration-300 shadow-sm hover:shadow-md"
                          >
                            <Image 
                              src="/images/nav-community-wall.jpg"
                              alt="Community Wall"
                              fill
                              sizes="(max-width: 768px) 92vw, 250px"
                              className="object-cover transition-transform duration-700 ease-out group-hover:scale-[1.08] opacity-60 group-hover:opacity-80 motion-reduce:transition-none motion-reduce:group-hover:scale-100"
                            />
                            <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/40 to-transparent" />
                            <div className="relative z-10 flex flex-col items-start">
                              <span className="font-sans font-bold text-lg text-white mb-0.5 tracking-tight group-hover:translate-x-0.5 transition-transform motion-reduce:transition-none motion-reduce:group-hover:translate-x-0">Community Wall</span>
                              <p className="text-[13px] text-white/75 font-normal">Leave your mark — say hi!</p>
                            </div>
                          </Link>
                        </motion.div>

                        {/* Stats Card */}
                        <motion.div
                          className="flex-1 min-h-[160px] max-md:flex-none max-md:h-40"
                        >
                          <Link 
                            href="/stats" 
                            aria-current={isRouteActive("/stats") ? "page" : undefined}
                            onClick={() => setIsDropdownOpen(false)}
                            className="group relative flex h-full w-full flex-col justify-end overflow-hidden rounded-2xl bg-neutral-900 p-4 ring-1 ring-black/5 dark:ring-white/10 hover:ring-black/15 dark:hover:ring-white/25 transition-all duration-300 shadow-sm hover:shadow-md"
                          >
                            <Image 
                              src="/images/nav-stats.jpg"
                              alt="Stats"
                              fill
                              sizes="(max-width: 768px) 92vw, 250px"
                              className="object-cover transition-transform duration-700 ease-out group-hover:scale-[1.08] opacity-60 group-hover:opacity-80 motion-reduce:transition-none motion-reduce:group-hover:scale-100"
                            />
                            <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/40 to-transparent" />
                            <div className="relative z-10 flex flex-col items-start">
                              <span className="font-sans font-bold text-lg text-white mb-0.5 tracking-tight group-hover:translate-x-0.5 transition-transform motion-reduce:transition-none motion-reduce:group-hover:translate-x-0">Stats</span>
                              <p className="text-[13px] text-white/75 font-normal">The numbers behind this site</p>
                            </div>
                          </Link>
                        </motion.div>

                        {/* Links Column */}
                        <motion.div 
                          className="flex flex-col gap-2 w-full md:w-[220px]"
                        >
                          <Link 
                            href="/credentials" 
                            aria-current={isRouteActive("/credentials") ? "page" : undefined}
                            onClick={() => setIsDropdownOpen(false)}
                            className="flex-1 flex items-center gap-3 rounded-2xl bg-neutral-100/90 dark:bg-[#1a1a1a] p-3 hover:bg-neutral-200/90 dark:hover:bg-[#252525] transition-all duration-200 group border border-neutral-200/70 dark:border-white/5 shadow-xs"
                          >
                            <div className="p-2.5 rounded-xl bg-white dark:bg-white/5 border border-black/5 dark:border-white/10 group-hover:scale-105 group-hover:bg-neutral-50 dark:group-hover:bg-white/10 transition-all shadow-xs motion-reduce:transition-none motion-reduce:group-hover:scale-100">
                              <svg className="size-4 text-neutral-800 dark:text-white/80" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 12.75L11.25 15 15 9.75M21 12c0 1.268-.63 2.39-1.593 3.068a3.745 3.745 0 01-1.043 3.296 3.745 3.745 0 01-3.296 1.043A3.745 3.745 0 0112 21c-1.268 0-2.39-.63-3.068-1.593a3.746 3.746 0 01-3.296-1.043 3.745 3.745 0 01-1.043-3.296A3.745 3.745 0 013 12c0-1.268.63-2.39 1.593-3.068a3.745 3.745 0 011.043-3.296 3.746 3.746 0 013.296-1.043A3.746 3.746 0 0112 3c1.268 0 2.39.63 3.068 1.593a3.746 3.746 0 013.296 1.043 3.746 3.746 0 011.043 3.296A3.745 3.745 0 0121 12z" />
                              </svg>
                            </div>
                            <div>
                              <span className="block text-[14px] font-semibold text-neutral-900 dark:text-white/90">Credentials</span>
                              <p className="text-[12px] text-text-secondary">Certifications & badges</p>
                            </div>
                          </Link>

                          <Link 
                            href="/contact" 
                            aria-current={isRouteActive("/contact") ? "page" : undefined}
                            onClick={() => setIsDropdownOpen(false)}
                            className="flex-1 flex items-center gap-3 rounded-2xl bg-neutral-100/90 dark:bg-[#1a1a1a] p-3 hover:bg-neutral-200/90 dark:hover:bg-[#252525] transition-all duration-200 group border border-neutral-200/70 dark:border-white/5 shadow-xs"
                          >
                            <div className="p-2.5 rounded-xl bg-white dark:bg-white/5 border border-black/5 dark:border-white/10 group-hover:scale-105 group-hover:bg-neutral-50 dark:group-hover:bg-white/10 transition-all shadow-xs motion-reduce:transition-none motion-reduce:group-hover:scale-100">
                              <svg className="size-4 text-neutral-800 dark:text-white/80" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M21.75 6.75v10.5a2.25 2.25 0 01-2.25 2.25h-15a2.25 2.25 0 01-2.25-2.25V6.75m19.5 0A2.25 2.25 0 0019.5 4.5h-15a2.25 2.25 0 00-2.25 2.25m19.5 0v.243a2.25 2.25 0 01-1.07 1.916l-7.5 4.615a2.25 2.25 0 01-2.36 0L3.32 8.91a2.25 2.25 0 01-1.07-1.916V6.75" />
                              </svg>
                            </div>
                            <div>
                              <span className="block text-[14px] font-semibold text-neutral-900 dark:text-white/90">Contact</span>
                              <p className="text-[12px] text-text-secondary">Let&apos;s work together</p>
                            </div>
                          </Link>

                          <Link 
                            href="/links" 
                            aria-current={isRouteActive("/links") ? "page" : undefined}
                            onClick={() => setIsDropdownOpen(false)}
                            className="flex-1 flex items-center gap-3 rounded-2xl bg-neutral-100/90 dark:bg-[#1a1a1a] p-3 hover:bg-neutral-200/90 dark:hover:bg-[#252525] transition-all duration-200 group border border-neutral-200/70 dark:border-white/5 shadow-xs"
                          >
                            <div className="p-2.5 rounded-xl bg-white dark:bg-white/5 border border-black/5 dark:border-white/10 group-hover:scale-105 group-hover:bg-neutral-50 dark:group-hover:bg-white/10 transition-all shadow-xs motion-reduce:transition-none motion-reduce:group-hover:scale-100">
                              <svg className="size-4 text-neutral-800 dark:text-white/80" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M13.828 10.172a4 4 0 00-5.656 0l-4 4a4 4 0 105.656 5.656l1.102-1.101m-.758-4.899a4 4 0 005.656 0l4-4a4 4 0 00-5.656-5.656l-1.1 1.1" />
                              </svg>
                            </div>
                            <div>
                              <span className="block text-[14px] font-semibold text-neutral-900 dark:text-white/90">Links</span>
                              <p className="text-[12px] text-text-secondary">All my links are here</p>
                            </div>
                          </Link>
                        </motion.div>

                      </motion.div>
                  </motion.div>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>

            {/* Side buttons rail — absolutely positioned off the pill's right
                edge so the pill stays perfectly centered at every width.
                Lower layer: the expanding More menu covers it. */}
            <div
              aria-hidden={!sideControlsReady || undefined}
              inert={!sideControlsReady ? true : undefined}
              className={`absolute left-full top-0 ml-3.5 hidden md:flex items-start gap-3.5 z-0 ${
                isDropdownOpen ? "pointer-events-none" : ""
              }`}
            >
              <motion.button
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ delay: 2.2, duration: 0.4 }}
                onClick={() => setIsCommandPaletteOpen(true)}
                aria-label="Open search (⌘K)"
                className={`${navCircleSurface} mt-0.5`}
                type="button"
              >
                <svg className="size-[18px]" fill="currentColor" viewBox="0 0 256 256">
                  <path d="M192,112a80,80,0,1,1-80-80A80,80,0,0,1,192,112Z" opacity="0.2" />
                  <path d="M229.66,218.34,179.6,168.28a88.21,88.21,0,1,0-11.32,11.31l50.06,50.07a8,8,0,0,0,11.32-11.32ZM40,112a72,72,0,1,1,72,72A72.08,72.08,0,0,1,40,112Z" />
                </svg>
              </motion.button>

              <motion.div
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ delay: 2.2, duration: 0.4 }}
                className="inline-flex mt-0.5"
              >
                <ThemeToggle />
              </motion.div>
            </div>
            
          </div>
        </nav>
      </header>
      
      {/* Command Palette Modal */}
      <SearchModal 
        isOpen={isCommandPaletteOpen} 
        onClose={() => setIsCommandPaletteOpen(false)}
        onOpenReachOut={() => setIsReachOutOpen(true)} 
      />

      {/* Reach Out Modal */}
      <ReachOutModal
        isOpen={isReachOutOpen}
        onClose={() => setIsReachOutOpen(false)}
        onOpenSearch={() => setIsCommandPaletteOpen(true)}
      />
    </MotionConfig>
  );
}
