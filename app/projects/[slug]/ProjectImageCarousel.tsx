"use client";

import { useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import Image, { type ImageLoaderProps } from "next/image";
import { AnimatePresence, motion, useReducedMotion } from "framer-motion";
import { ChevronLeft, ChevronRight, Pause, Play, X, ZoomIn, ZoomOut } from "lucide-react";

type Slide = { src: string; alt: string; caption: string };

const cloudinaryLoader = ({ src, width }: ImageLoaderProps) =>
  src.replace("/upload/", `/upload/f_webp,q_auto:good,c_limit,w_${Math.min(width, 1920)}/`);

const isCloudinary = (src: string) => /^https:\/\/res\.cloudinary\.com\/[^/]+\/image\/upload\//.test(src);
const isOptimizedHost = (src: string) => /^https:\/\/(?:images\.unsplash\.com|res\.cloudinary\.com|avatars\.githubusercontent\.com|lh3\.googleusercontent\.com|cdn\.hashnode\.com|media\.giphy\.com|dev-to-uploads\.s3\.amazonaws\.com|badges\.pufler\.dev|img\.shields\.io|framerusercontent\.com)\//.test(src);

export function ProjectImageCarousel({ images, title }: { images: Slide[]; title: string }) {
  const [index, setIndex] = useState(0);
  const [paused, setPaused] = useState(false);
  const [hovered, setHovered] = useState(false);
  const [focused, setFocused] = useState(false);
  const [visible, setVisible] = useState(false);
  const [pageActive, setPageActive] = useState(true);
  const [cycle, setCycle] = useState(0);
  const [expanded, setExpanded] = useState(false);
  const [zoom, setZoom] = useState(1);
  const [displayed, setDisplayed] = useState<Slide | null>(images[0] ?? null);
  const [imageError, setImageError] = useState(false);
  const figureRef = useRef<HTMLElement>(null);
  const expandRef = useRef<HTMLButtonElement>(null);
  const dialogRef = useRef<HTMLDivElement>(null);
  const closeRef = useRef<HTMLButtonElement>(null);
  const viewerStageRef = useRef<HTMLDivElement>(null);
  const wantedSrcRef = useRef(images[0]?.src);
  const reducedMotion = useReducedMotion();
  const current = images[index];
  const shown = displayed ?? current;
  const shownIndex = images.findIndex((image) => image.src === shown?.src);
  const zoomed = zoom > 1;
  const loading = Boolean(current && shown && current.src !== shown.src);
  wantedSrcRef.current = current?.src;
  const canPlay = images.length > 1 && visible && pageActive && !paused && !hovered && !focused && !expanded && !loading;

  useEffect(() => {
    if (reducedMotion) setPaused(true);
  }, [reducedMotion]);

  useEffect(() => {
    const figure = figureRef.current;
    if (!figure) return;
    const observer = new IntersectionObserver(([entry]) => setVisible(entry.intersectionRatio >= 0.35), { threshold: 0.35 });
    observer.observe(figure);
    const updateActivity = () => setPageActive(document.visibilityState === "visible");
    updateActivity();
    document.addEventListener("visibilitychange", updateActivity);
    return () => { observer.disconnect(); document.removeEventListener("visibilitychange", updateActivity); };
  }, []);

  useEffect(() => {
    if (!canPlay) return;
    const timer = window.setInterval(() => setIndex((value) => (value + 1) % images.length), 5000);
    return () => window.clearInterval(timer);
  }, [canPlay, cycle, images.length]);

  useEffect(() => {
    if (!expanded || zoom <= 1 || !viewerStageRef.current) return;
    const stage = viewerStageRef.current;
    stage.scrollLeft = (stage.scrollWidth - stage.clientWidth) / 2;
    stage.scrollTop = (stage.scrollHeight - stage.clientHeight) / 2;
  }, [expanded, zoom]);

  useEffect(() => {
    if (!expanded) return;
    const previousOverflow = document.body.style.overflow;
    const opener = expandRef.current;
    document.body.style.overflow = "hidden";
    const background = [...document.body.children].filter((node): node is HTMLElement =>
      node instanceof HTMLElement && !node.hasAttribute("data-project-image-viewer") && !["SCRIPT", "STYLE"].includes(node.tagName));
    const previous = background.map((node) => ({ node, hidden: node.getAttribute("aria-hidden"), inert: node.inert }));
    background.forEach((node) => { node.setAttribute("aria-hidden", "true"); node.inert = true; });
    closeRef.current?.focus();

    const onKey = (event: KeyboardEvent) => {
      if (event.key === "Escape") { event.preventDefault(); setZoom(1); setExpanded(false); }
      if (event.key === "ArrowRight" || event.key === "ArrowLeft") {
        if (event.target instanceof HTMLInputElement && event.target.type === "range") return;
        event.preventDefault();
        setZoom(1);
        setIndex((value) => (value + (event.key === "ArrowRight" ? 1 : -1) + images.length) % images.length);
        setCycle((value) => value + 1);
      }
      if (event.key !== "Tab" || !dialogRef.current) return;
      const controls = [...dialogRef.current.querySelectorAll<HTMLElement>('button:not([disabled]),input[type="range"]')];
      const first = controls[0], last = controls[controls.length - 1];
      if (!first || !last) return;
      if (event.shiftKey && (document.activeElement === first || !dialogRef.current.contains(document.activeElement))) { event.preventDefault(); last.focus(); }
      else if (!event.shiftKey && (document.activeElement === last || !dialogRef.current.contains(document.activeElement))) { event.preventDefault(); first.focus(); }
    };
    document.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("keydown", onKey);
      document.body.style.overflow = previousOverflow;
      previous.forEach(({ node, hidden, inert }) => { if (hidden === null) node.removeAttribute("aria-hidden"); else node.setAttribute("aria-hidden", hidden); node.inert = inert; });
      requestAnimationFrame(() => opener?.focus());
    };
  }, [expanded, images.length]);

  if (!current) return null;

  const goTo = (next: number) => {
    setZoom(1);
    setImageError(false);
    setIndex((next + images.length) % images.length);
    setCycle((value) => value + 1);
  };

  return (
    <section aria-label={`${title} images`} className="min-w-0" onMouseEnter={() => setHovered(true)} onMouseLeave={() => setHovered(false)} onFocusCapture={() => setFocused(true)} onBlurCapture={(event) => { if (!event.currentTarget.contains(event.relatedTarget)) setFocused(false); }}>
      <motion.figure
        ref={figureRef}
        aria-label={`Image ${shownIndex + 1} of ${images.length}`}
        className="isolate overflow-hidden rounded-2xl border border-border-primary bg-white dark:bg-white/[0.02] sm:rounded-3xl"
        drag={images.length > 1 ? "x" : false}
        dragConstraints={{ left: 0, right: 0 }}
        dragElastic={0.08}
        onDragEnd={(_, info) => {
          if (Math.abs(info.offset.x) > 60 || Math.abs(info.velocity.x) > 400) goTo(index + (info.offset.x < 0 ? 1 : -1));
        }}
      >
        <div className="relative aspect-[4/3] overflow-hidden bg-neutral-100 dark:bg-white/[0.04] sm:aspect-video">
          {loading && <Image src={current.src} alt="" aria-hidden fill priority sizes="(max-width: 1280px) 100vw, 1152px" loader={isCloudinary(current.src) ? cloudinaryLoader : undefined} unoptimized={!isOptimizedHost(current.src)} className="pointer-events-none opacity-0" onLoad={() => { if (wantedSrcRef.current === current.src) { setDisplayed(current); setImageError(false); } }} onError={() => setImageError(true)} />}
          <AnimatePresence initial={false}>
            <motion.div key={shown.src} initial={reducedMotion ? false : { opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} transition={{ duration: reducedMotion ? 0 : 0.24 }} className="absolute inset-0">
              <Image src={shown.src} alt={shown.alt || (shownIndex === 0 ? `${title} cover image` : `${title} image ${shownIndex + 1}`)} fill priority sizes="(max-width: 1280px) 100vw, 1152px" loader={isCloudinary(shown.src) ? cloudinaryLoader : undefined} unoptimized={!isOptimizedHost(shown.src)} draggable={false} className="pointer-events-none select-none object-cover" />
            </motion.div>
          </AnimatePresence>
          {loading && <span role="status" className="absolute bottom-3 left-3 z-10 rounded-full bg-neutral-950 px-3 py-2 text-xs text-white">{imageError ? "Image unavailable. Choose another." : "Loading image..."}</span>}
          <button ref={expandRef} type="button" disabled={loading} onClick={() => setExpanded(true)} aria-label={`Open image ${shownIndex + 1} in full screen`} className="absolute inset-0 z-10 cursor-zoom-in focus-visible:outline focus-visible:outline-2 focus-visible:-outline-offset-2 focus-visible:outline-text-primary disabled:cursor-wait" />
        </div>
        <figcaption aria-live="polite" className="flex h-14 items-center border-t border-border-primary bg-neutral-100 px-4 text-sm font-medium text-text-primary dark:bg-neutral-900 sm:px-5">
          <span className="min-w-0 truncate" title={shown.caption || (shownIndex === 0 ? "Project cover" : "Project image")}>{shown.caption || (shownIndex === 0 ? "Project cover" : "Project image")}</span>
        </figcaption>
      </motion.figure>
      {images.length > 1 && <div role="group" aria-label="Carousel controls" className="mx-auto mt-4 grid w-[60vw] max-w-full grid-cols-[44px_minmax(0,1fr)_44px] items-center gap-1 sm:gap-3">
        <button type="button" aria-label="Previous image" onClick={() => goTo(index - 1)} className="flex size-11 shrink-0 items-center justify-center rounded-full border border-border-primary text-text-primary hover:bg-text-primary/5 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-text-primary"><ChevronLeft aria-hidden className="size-5" /></button>
        <div className="mx-auto flex w-full max-w-[300px] min-w-0 items-center justify-center gap-1 sm:gap-3">
          <div className={`grid h-11 min-w-0 flex-1 items-center ${images.length > 12 ? "gap-0" : "gap-0.5 sm:gap-1"}`} style={{ gridTemplateColumns: `repeat(${images.length}, minmax(0, 1fr))` }}>
            {images.map((image, position) => <button key={`${image.src}-${position}`} type="button" aria-label={`Go to image ${position + 1}`} aria-current={position === shownIndex ? "true" : undefined} onClick={() => goTo(position)} className="flex h-11 min-w-0 items-center justify-center focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-text-primary">
              <span className="relative block h-1 w-full overflow-hidden rounded-full bg-border-primary">
                {position === shownIndex && (canPlay ? <motion.span key={`${shownIndex}-${cycle}-${canPlay}`} className="absolute inset-0 origin-left bg-text-primary" initial={{ scaleX: 0 }} animate={{ scaleX: 1 }} transition={{ duration: 5, ease: "linear" }} /> : <span className="absolute inset-0 bg-text-primary" />)}
              </span>
            </button>)}
          </div>
          <button type="button" onClick={() => setPaused((value) => !value)} aria-label={paused ? "Play carousel" : "Pause carousel"} className="flex size-11 shrink-0 items-center justify-center rounded-full border border-border-primary text-text-secondary hover:bg-text-primary/5 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-text-primary">{paused ? <Play aria-hidden className="size-4" /> : <Pause aria-hidden className="size-4" />}</button>
        </div>
        <button type="button" aria-label="Next image" onClick={() => goTo(index + 1)} className="flex size-11 shrink-0 items-center justify-center rounded-full border border-border-primary text-text-primary hover:bg-text-primary/5 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-text-primary"><ChevronRight aria-hidden className="size-5" /></button>
      </div>}
      {expanded && createPortal(
        <div data-project-image-viewer ref={dialogRef} role="dialog" aria-modal="true" aria-label={`${title} image viewer`} className="fixed inset-0 z-[8000] grid grid-rows-[auto_minmax(0,1fr)_auto] gap-3 bg-white/95 p-3 pb-[max(12px,env(safe-area-inset-bottom))] text-neutral-950 backdrop-blur-xl dark:bg-neutral-950/95 dark:text-white sm:gap-5 sm:p-6">
          <div className="flex min-w-0 items-center justify-end gap-2 sm:gap-3">
            <button type="button" disabled={zoom === 1} onClick={() => setZoom((value) => Math.max(1, value - 0.5))} aria-label="Zoom out" className="flex size-11 shrink-0 items-center justify-center rounded-full border border-neutral-300 bg-white text-neutral-950 hover:bg-neutral-100 disabled:opacity-40 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-neutral-950 dark:border-white/25 dark:bg-white/10 dark:text-white dark:hover:bg-white/20 dark:focus-visible:outline-white"><ZoomOut aria-hidden className="size-5" /></button>
            <input type="range" min={1} max={4} step={0.25} value={zoom} onChange={(event) => setZoom(Number(event.target.value))} aria-label="Image zoom" style={{ width: "clamp(64px, 12vw, 128px)" }} className="accent-neutral-900 dark:accent-white" />
            <button type="button" disabled={zoom === 4} onClick={() => setZoom((value) => Math.min(4, value + 0.5))} aria-label="Zoom in" className="flex size-11 shrink-0 items-center justify-center rounded-full border border-neutral-300 bg-white text-neutral-950 hover:bg-neutral-100 disabled:opacity-40 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-neutral-950 dark:border-white/25 dark:bg-white/10 dark:text-white dark:hover:bg-white/20 dark:focus-visible:outline-white"><ZoomIn aria-hidden className="size-5" /></button>
            <span aria-live="polite" className="w-10 shrink-0 text-center font-mono text-[11px] tabular-nums text-neutral-600 dark:text-neutral-300">{Math.round(zoom * 100)}%</span>
            <button ref={closeRef} type="button" onClick={() => { setZoom(1); setExpanded(false); }} aria-label="Close image viewer" className="flex size-11 shrink-0 items-center justify-center rounded-full border border-neutral-300 bg-white text-neutral-950 transition-colors hover:bg-neutral-100 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-neutral-950 dark:border-white/25 dark:bg-white/10 dark:text-white dark:hover:bg-white/20 dark:focus-visible:outline-white"><X aria-hidden className="size-5" /></button>
          </div>
          <motion.div ref={viewerStageRef} className={`relative min-h-0 rounded-xl ${zoomed ? "overflow-auto touch-auto" : "overflow-hidden touch-pan-y"}`} drag={images.length > 1 && !zoomed ? "x" : false} dragConstraints={{ left: 0, right: 0 }} dragElastic={0.06} onDragEnd={(_, info) => { if (Math.abs(info.offset.x) > 60 || Math.abs(info.velocity.x) > 400) goTo(index + (info.offset.x < 0 ? 1 : -1)); }}>
            <div className="relative" style={{ width: `${zoom * 100}%`, height: `${zoom * 100}%` }}>
              <Image src={shown.src} alt={shown.alt || `${title} image ${shownIndex + 1}`} fill priority sizes={zoomed ? "(max-width: 640px) 1080px, 1920px" : "100vw"} loader={isCloudinary(shown.src) ? cloudinaryLoader : undefined} unoptimized={!isOptimizedHost(shown.src)} draggable={false} className="pointer-events-none select-none object-contain" />
            </div>
          </motion.div>
          <div className="flex min-h-11 min-w-0 flex-col items-stretch gap-3 sm:flex-row sm:items-center">
            <p aria-live="polite" className="max-h-24 min-w-0 flex-1 overflow-y-auto break-words text-xs leading-5 text-neutral-600 dark:text-neutral-300 sm:text-sm">{shown.caption || (shownIndex === 0 ? "Project cover" : "Project image")}</p>
            {images.length > 1 && <div className="flex shrink-0 justify-end gap-2">
              <button type="button" aria-label="Previous full-screen image" onClick={() => goTo(index - 1)} className="flex size-11 items-center justify-center rounded-full border border-neutral-300 bg-white transition-colors hover:bg-neutral-100 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-neutral-950 dark:border-white/25 dark:bg-white/10 dark:hover:bg-white/20 dark:focus-visible:outline-white"><ChevronLeft aria-hidden className="size-5" /></button>
              <button type="button" aria-label="Next full-screen image" onClick={() => goTo(index + 1)} className="flex size-11 items-center justify-center rounded-full border border-neutral-300 bg-white transition-colors hover:bg-neutral-100 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-neutral-950 dark:border-white/25 dark:bg-white/10 dark:hover:bg-white/20 dark:focus-visible:outline-white"><ChevronRight aria-hidden className="size-5" /></button>
            </div>}
          </div>
        </div>, document.body)}
    </section>
  );
}
