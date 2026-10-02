"use client";

import { ChevronUp, X } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { useActiveSection } from "@/app/hooks/useActiveSection";
import type { TocHeading } from "@/app/lib/toc-utils";
import styles from "./TableOfContents.module.css";

const RING_CIRCUMFERENCE = 62.83; // 2 * PI * r (r=10)
const depthStyles: Record<TocHeading["level"], string> = {
  2: "pl-3 text-sm font-medium",
  3: "pl-5 text-[13px]",
  4: "pl-[72px] text-xs",
  5: "pl-[86px] text-xs",
  6: "pl-[100px] text-xs",
};
type DragStart = { x: number; y: number; listScrollTop: number; fromList: boolean };

function useReadingProgress() {
  const [progress, setProgress] = useState(0);
  useEffect(() => {
    let raf = 0;
    const update = () => {
      raf = 0;
      const article = document.getElementById("blog-article");
      if (!article) return;
      const rect = article.getBoundingClientRect();
      const total = rect.height - window.innerHeight;
      const scrolled = Math.min(Math.max(-rect.top, 0), Math.max(total, 1));
      setProgress(total > 0 ? scrolled / total : 0);
    };
    const onScroll = () => {
      if (!raf) raf = requestAnimationFrame(update);
    };
    update();
    window.addEventListener("scroll", onScroll, { passive: true });
    window.addEventListener("resize", onScroll);
    return () => {
      window.removeEventListener("scroll", onScroll);
      window.removeEventListener("resize", onScroll);
      if (raf) cancelAnimationFrame(raf);
    };
  }, []);
  return progress;
}

function useRevealAfterHero() {
  const [visible, setVisible] = useState(false);
  useEffect(() => {
    const onScroll = () => setVisible(window.scrollY > 320);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);
  return visible;
}

export function TableOfContents({ headings }: { headings: TocHeading[] }) {
  const [open, setOpen] = useState(false);
  const navRef = useRef<HTMLElement>(null);
  const listRef = useRef<HTMLDivElement>(null);
  const dragStartRef = useRef<DragStart | null>(null);
  const touchStartRef = useRef<DragStart | null>(null);
  const triggerRef = useRef<HTMLButtonElement>(null);
  const closeRef = useRef<HTMLButtonElement>(null);
  const activeId = useActiveSection({ headingIds: headings.map((heading) => heading.slug) });
  const active = headings.find((heading) => heading.slug === activeId) || headings[0];
  const progress = useReadingProgress();
  const visible = useRevealAfterHero();
  const currentId = activeId || headings[0]?.slug;

  const closeToc = () => {
    setOpen(false);
    if (visible) requestAnimationFrame(() => triggerRef.current?.focus());
  };

  useEffect(() => {
    if (open) closeRef.current?.focus();
  }, [open]);

  useEffect(() => {
    if (!open) return;
    listRef.current?.querySelector<HTMLElement>('[aria-current="location"]')?.scrollIntoView({ block: "nearest", behavior: "auto" });
  }, [open, currentId]);

  useEffect(() => {
    if (!open) return;
    const onScroll = () => {
      if (window.scrollY > 320) return;
      if (navRef.current?.contains(document.activeElement)) {
        document.querySelector<HTMLElement>('main .blog-detail header a, main nav a[href^="/admin/blogs/"]')?.focus({ preventScroll: true });
      }
      setOpen(false);
    };
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, [open]);

  useEffect(() => {
    if (!open) return;
    const startAt = (target: EventTarget | null, x: number, y: number): DragStart => {
      const fromList = !!listRef.current?.contains(target as Node);
      return { x, y, fromList, listScrollTop: fromList ? listRef.current?.scrollTop ?? 0 : 0 };
    };
    const pulledDown = (start: DragStart | null, x: number, y: number) => {
      if (!start || (start.fromList && (listRef.current?.scrollTop ?? 0) > 0)) return false;
      const distance = y - start.y;
      return distance > start.listScrollTop + 70 && Math.abs(x - start.x) < distance;
    };
    const onPointerDown = (event: PointerEvent) => {
      if (!navRef.current?.contains(event.target as Node)) {
        setOpen(false);
        return;
      }
      dragStartRef.current = startAt(event.target, event.clientX, event.clientY);
    };
    const onPointerUp = (event: PointerEvent) => {
      const start = dragStartRef.current;
      dragStartRef.current = null;
      if (pulledDown(start, event.clientX, event.clientY)) setOpen(false);
    };
    const onPointerCancel = () => { dragStartRef.current = null; };
    const onTouchStart = (event: TouchEvent) => {
      if (!navRef.current?.contains(event.target as Node) || event.touches.length !== 1) return;
      const touch = event.touches[0];
      touchStartRef.current = startAt(event.target, touch.clientX, touch.clientY);
    };
    const onTouchEnd = (event: TouchEvent) => {
      const start = touchStartRef.current;
      touchStartRef.current = null;
      const touch = event.changedTouches[0];
      if (touch && pulledDown(start, touch.clientX, touch.clientY)) setOpen(false);
    };
    const onTouchCancel = () => { touchStartRef.current = null; };
    document.addEventListener("pointerdown", onPointerDown);
    document.addEventListener("pointerup", onPointerUp);
    document.addEventListener("pointercancel", onPointerCancel);
    document.addEventListener("touchstart", onTouchStart, { passive: true });
    document.addEventListener("touchend", onTouchEnd);
    document.addEventListener("touchcancel", onTouchCancel);
    return () => {
      document.removeEventListener("pointerdown", onPointerDown);
      document.removeEventListener("pointerup", onPointerUp);
      document.removeEventListener("pointercancel", onPointerCancel);
      document.removeEventListener("touchstart", onTouchStart);
      document.removeEventListener("touchend", onTouchEnd);
      document.removeEventListener("touchcancel", onTouchCancel);
    };
  }, [open]);

  useEffect(() => {
    const onKey = (event: KeyboardEvent) => {
      if (event.key === "Escape" && open) {
        event.preventDefault();
        setOpen(false);
        if (visible) requestAnimationFrame(() => triggerRef.current?.focus());
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open, visible]);

  if (!headings.length) return null;

  const selectHeading = (slug: string) => {
    const heading = document.getElementById(slug);
    heading?.scrollIntoView({
      behavior: window.matchMedia("(prefers-reduced-motion: reduce)").matches ? "auto" : "smooth",
      block: "start",
    });
    window.history.pushState(null, "", `#${slug}`);
    setOpen(false);
    heading?.querySelector<HTMLElement>('a[href^="#"]')?.focus({ preventScroll: true });
  };

  return (
    <nav
      ref={navRef}
      aria-label="Table of contents"
      aria-hidden={!visible && !open}
      data-open={open}
      className={`fixed left-1/2 ${styles.dock} z-[99] flex -translate-x-1/2 flex-col items-center transition-[opacity,transform] duration-500 ease-out motion-reduce:transition-none ${
        visible || open
          ? "pointer-events-auto translate-y-0 scale-100 opacity-100"
          : "pointer-events-none translate-y-[50px] scale-90 opacity-0"
      }`}
    >
      <div
        className={`relative overflow-hidden bg-white/95 text-neutral-900 shadow-[0_0_0_0.8px_rgba(0,0,0,0.06),0_4px_12px_-4px_rgba(0,0,0,0.06),inset_0_0.5px_0.5px_0.5px_rgba(255,255,255,0.6)] backdrop-blur-[12px] transition-[width,height,border-radius] duration-300 ease-out motion-reduce:transition-none dark:bg-neutral-800/95 dark:text-white dark:shadow-[inset_0_1px_0_0_rgba(255,255,255,0.1),inset_0_0_0_1px_rgba(255,255,255,0.06)] ${styles.panel} ${
          open
            ? "w-[min(360px,calc(100vw-2rem))] rounded-2xl"
            : "h-[52px] w-[min(280px,calc(100vw-2rem))] rounded-[26px]"
        }`}
        style={{ height: open ? `min(var(--toc-max-height), ${Math.min(560, 80 + headings.length * 48)}px)` : undefined }}
      >
        {!open ? (
          <button
            ref={triggerRef}
            type="button"
            onClick={() => setOpen(true)}
            tabIndex={visible ? 0 : -1}
            aria-label={`Open table of contents: ${active.number ? `${active.number} ` : ""}${active.text}`}
            className="absolute inset-0 flex w-full items-center gap-3 px-5 text-left focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-text-primary/40"
          >
            <span aria-hidden="true" className="relative flex size-1.5 shrink-0">
              <span className="absolute inline-flex size-full animate-ping rounded-full bg-current opacity-40 motion-reduce:animate-none" />
              <span className="relative inline-flex size-1.5 rounded-full bg-current" />
            </span>
            <span className="flex-1 overflow-hidden text-ellipsis whitespace-nowrap text-sm font-medium">
              {active.number && <span aria-hidden="true" style={{ marginRight: "0.65rem", fontFamily: "var(--font-geist-mono), monospace", fontSize: "0.75rem", opacity: 0.68 }}>{active.number}.</span>}
              {active.text}
            </span>
            <span aria-hidden="true" className="relative flex size-[22px] shrink-0 items-center justify-center">
              <svg viewBox="0 0 22 22" className="size-[22px] -rotate-90">
                <circle cx="11" cy="11" r="10" fill="none" strokeWidth="2" className="stroke-current opacity-15" />
                <circle
                  cx="11"
                  cy="11"
                  r="10"
                  fill="none"
                  strokeWidth="2"
                  strokeLinecap="round"
                  className="stroke-current"
                  strokeDasharray={RING_CIRCUMFERENCE}
                  strokeDashoffset={RING_CIRCUMFERENCE * (1 - progress)}
                />
              </svg>
              <ChevronUp className="absolute size-3" />
            </span>
          </button>
        ) : (
          <div className="absolute inset-0 flex flex-col">
            <span aria-hidden="true" className="absolute left-1/2 top-2 h-1 w-8 -translate-x-1/2 touch-none rounded-full bg-neutral-400/70 dark:bg-white/35 sm:hidden" />
            <div className="flex shrink-0 items-center justify-between border-b border-neutral-900/[0.08] px-5 pb-3 pt-4 dark:border-white/[0.08]">
              <span className="font-mono text-[11px] font-semibold uppercase tracking-[0.14em] text-current/80">
                Table of contents
              </span>
              <button
                ref={closeRef}
                type="button"
                onClick={closeToc}
                aria-label="Close table of contents"
                className="flex size-7 items-center justify-center rounded-full text-neutral-600 transition-colors hover:bg-neutral-900/[0.07] hover:text-neutral-950 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-current dark:text-neutral-300 dark:hover:bg-white/[0.10] dark:hover:text-white"
              >
                <X className="size-4" />
              </button>
            </div>
            <div ref={listRef} className={`min-h-0 flex-1 overflow-y-auto overscroll-contain px-2 py-3 ${styles.outlineList}`}>
              <div className="flex flex-col gap-0.5">
                {headings.map((heading) => (
                  <button
                    key={heading.slug}
                    type="button"
                    onClick={() => selectHeading(heading.slug)}
                    aria-current={currentId === heading.slug ? "location" : undefined}
                    className={`group relative flex min-h-11 w-full shrink-0 items-center rounded-lg border-none py-2 pr-3 text-left leading-5 transition-colors duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-current/50 ${
                      currentId === heading.slug
                        ? "bg-neutral-900/[0.11] text-neutral-950 dark:bg-white/[0.12] dark:text-white"
                        : "bg-transparent text-neutral-600 hover:bg-neutral-900/[0.05] hover:text-neutral-700 dark:text-neutral-300 dark:hover:bg-white/[0.06] dark:hover:text-neutral-200"
                    } ${depthStyles[heading.level]}`}
                  >
                    <span
                      aria-hidden="true"
                      className={`absolute left-1 top-1/2 h-4 w-[2px] origin-center -translate-y-1/2 rounded-full bg-current transition-transform duration-300 ease-out motion-reduce:transition-none ${
                        currentId === heading.slug ? "scale-y-100 opacity-100" : "scale-y-0 opacity-0"
                      }`}
                    />
                    {heading.number && <span aria-hidden="true" className="font-mono tabular-nums" style={{ flexShrink: 0, minWidth: heading.level === 2 ? "1.4rem" : "2.6rem", fontSize: "inherit", opacity: 0.8 }}>{heading.number}.</span>}
                    <span className="min-w-0 flex-1 overflow-hidden text-ellipsis whitespace-nowrap">{heading.text}</span>
                  </button>
                ))}
              </div>
            </div>
          </div>
        )}
      </div>
    </nav>
  );
}
