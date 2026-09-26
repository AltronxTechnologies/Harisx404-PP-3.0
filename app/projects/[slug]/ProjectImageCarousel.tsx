"use client";

import { useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import Image, { type ImageLoaderProps } from "next/image";
import { AnimatePresence, motion, useReducedMotion } from "framer-motion";
import { ChevronLeft, ChevronRight, Expand, Pause, Play, X, ZoomIn, ZoomOut } from "lucide-react";

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
  const [zoomed, setZoomed] = useState(false);
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
    if (!expanded || !zoomed || !viewerStageRef.current) return;
    const stage = viewerStageRef.current;
    stage.scrollLeft = (stage.scrollWidth - stage.clientWidth) / 2;
    stage.scrollTop = (stage.scrollHeight - stage.clientHeight) / 2;
  }, [expanded, zoomed]);

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
      if (event.key === "Escape") { event.preventDefault(); setExpanded(false); }
      if (event.key === "ArrowRight" || event.key === "ArrowLeft") {
        event.preventDefault();
        setZoomed(false);
        setIndex((value) => (value + (event.key === "ArrowRight" ? 1 : -1) + images.length) % images.length);
        setCycle((value) => value + 1);
      }
      if (event.key !== "Tab" || !dialogRef.current) return;
      const controls = [...dialogRef.current.querySelectorAll<HTMLButtonElement>("button:not([disabled])")];
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
    setZoomed(false);
    setImageError(false);
    setIndex((next + images.length) % images.length);
    setCycle((value) => value + 1);
  };

  return (
    <section aria-label={`${title} images`} className="min-w-0" onMouseEnter={() => setHovered(true)} onMouseLeave={() => setHovered(false)} onFocusCapture={() => setFocused(true)} onBlurCapture={(event) => { if (!event.currentTarget.contains(event.relatedTarget)) setFocused(false); }}>
      <motion.figure
        ref={figureRef}
        aria-label={`Image ${index + 1} of ${images.length}`}
        className="relative isolate aspect-[4/3] overflow-hidden rounded-2xl border border-border-primary bg-neutral-100 dark:bg-white/[0.04] sm:aspect-video sm:rounded-3xl"
        drag={images.length > 1 ? "x" : false}
        dragConstraints={{ left: 0, right: 0 }}
        dragElastic={0.08}
        onDragEnd={(_, info) => {
          if (Math.abs(info.offset.x) > 60 || Math.abs(info.velocity.x) > 400) goTo(index + (info.offset.x < 0 ? 1 : -1));
        }}
      >
        {loading && <Image src={current.src} alt="" aria-hidden fill priority sizes="(max-width: 1280px) 100vw, 1152px" loader={isCloudinary(current.src) ? cloudinaryLoader : undefined} unoptimized={!isOptimizedHost(current.src)} className="pointer-events-none opacity-0" onLoad={() => { if (wantedSrcRef.current === current.src) { setDisplayed(current); setImageError(false); } }} onError={() => setImageError(true)} />}
        <AnimatePresence initial={false}>
          <motion.div key={shown.src} initial={reducedMotion ? false : { opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} transition={{ duration: reducedMotion ? 0 : 0.24 }} className="absolute inset-0">
            <Image src={shown.src} alt="" aria-hidden fill priority sizes="(max-width: 1280px) 100vw, 1152px" loader={isCloudinary(shown.src) ? cloudinaryLoader : undefined} unoptimized={!isOptimizedHost(shown.src)} className="pointer-events-none select-none object-cover opacity-25 blur-xl" />
            <Image src={shown.src} alt={shown.alt || (index === 0 ? `${title} cover image` : `${title} image ${index + 1}`)} fill priority sizes="(max-width: 1280px) 100vw, 1152px" loader={isCloudinary(shown.src) ? cloudinaryLoader : undefined} unoptimized={!isOptimizedHost(shown.src)} draggable={false} className="pointer-events-none select-none object-contain" />
          </motion.div>
        </AnimatePresence>
        {loading && <span role="status" className="absolute bottom-3 left-3 z-10 rounded-full bg-neutral-950 px-3 py-2 text-xs text-white sm:bottom-5 sm:left-5">{imageError ? "Image unavailable. Choose another." : "Loading image..."}</span>}
        <button ref={expandRef} type="button" disabled={loading} onClick={() => setExpanded(true)} aria-label={`View image ${index + 1} in full screen`} className="group absolute inset-0 z-10 cursor-zoom-in focus-visible:outline focus-visible:outline-2 focus-visible:-outline-offset-2 focus-visible:outline-text-primary disabled:cursor-wait">
          <span style={{ backgroundColor: "var(--bg-primary)" }} className="absolute bottom-3 right-3 inline-flex min-h-10 items-center gap-2 rounded-full border border-border-primary px-4 text-xs font-medium text-text-primary shadow-sm sm:bottom-5 sm:right-5"><Expand aria-hidden className="size-3.5" /> View image</span>
        </button>
        {images.length > 1 && <>
          <button type="button" aria-label="Previous image" onClick={() => goTo(index - 1)} style={{ backgroundColor: "var(--bg-primary)" }} className="absolute left-3 top-1/2 z-20 hidden size-11 -translate-y-1/2 items-center justify-center rounded-full border border-border-primary text-text-primary shadow-sm focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-text-primary sm:left-5 sm:flex"><ChevronLeft aria-hidden className="size-5" /></button>
          <button type="button" aria-label="Next image" onClick={() => goTo(index + 1)} style={{ backgroundColor: "var(--bg-primary)" }} className="absolute right-3 top-1/2 z-20 hidden size-11 -translate-y-1/2 items-center justify-center rounded-full border border-border-primary text-text-primary shadow-sm focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-text-primary sm:right-5 sm:flex"><ChevronRight aria-hidden className="size-5" /></button>
        </>}
      </motion.figure>
      {(images.length > 1 || current.caption) && <div className="mt-4 flex min-h-11 flex-wrap items-center justify-between gap-3 px-2">
        <p aria-live="polite" className="w-full min-w-0 text-sm text-text-secondary sm:w-auto sm:flex-1">{images.length > 1 && <span className="mr-3 whitespace-nowrap font-mono text-xs">{index + 1} / {images.length}</span>}{current.caption}</p>
        {images.length > 1 && <div className="flex w-full items-center justify-between gap-2 sm:w-auto sm:justify-end">
          <button type="button" aria-label="Previous image" onClick={() => goTo(index - 1)} className="flex size-11 shrink-0 items-center justify-center rounded-full border border-border-primary text-text-primary sm:hidden"><ChevronLeft aria-hidden className="size-5" /></button>
          {images.length <= 12 && images.map((image, position) => <button key={`${image.src}-${position}`} type="button" aria-label={`Go to image ${position + 1}`} aria-current={position === index ? "true" : undefined} onClick={() => goTo(position)} className="group hidden h-11 items-center px-1 sm:flex"><span className={`h-1 rounded-full transition-all ${position === index ? "w-10 bg-text-primary" : "w-5 bg-border-primary group-hover:bg-text-secondary"}`} /></button>)}
          <button type="button" onClick={() => setPaused((value) => !value)} aria-label={paused ? "Play carousel" : "Pause carousel"} className="flex size-11 shrink-0 items-center justify-center rounded-full border border-border-primary text-text-secondary focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-text-primary">{paused ? <Play aria-hidden className="size-4" /> : <Pause aria-hidden className="size-4" />}</button>
          <button type="button" aria-label="Next image" onClick={() => goTo(index + 1)} className="flex size-11 shrink-0 items-center justify-center rounded-full border border-border-primary text-text-primary sm:hidden"><ChevronRight aria-hidden className="size-5" /></button>
        </div>}
      </div>}
      {expanded && createPortal(
        <div data-project-image-viewer ref={dialogRef} role="dialog" aria-modal="true" aria-label={`${title} image viewer`} className="fixed inset-0 z-[8000] grid grid-rows-[auto_minmax(0,1fr)_auto] gap-3 bg-white/95 p-3 pb-[max(12px,env(safe-area-inset-bottom))] text-neutral-950 backdrop-blur-xl dark:bg-neutral-950/95 dark:text-white sm:gap-5 sm:p-6">
          <div className="flex min-w-0 items-center justify-between gap-4">
            <div className="min-w-0"><p className="truncate text-sm font-medium">{title}</p><p className="font-mono text-xs text-neutral-600 dark:text-neutral-400">Image {index + 1} of {images.length}</p></div>
            <div className="flex shrink-0 items-center gap-2">
              <button type="button" onClick={() => setZoomed((value) => !value)} aria-label={zoomed ? "Zoom out" : "Zoom in"} className="flex size-11 items-center justify-center rounded-full border border-neutral-300 bg-white text-neutral-950 hover:bg-neutral-100 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-neutral-950 dark:border-white/25 dark:bg-white/10 dark:text-white dark:hover:bg-white/20 dark:focus-visible:outline-white">{zoomed ? <ZoomOut aria-hidden className="size-5" /> : <ZoomIn aria-hidden className="size-5" />}</button>
              <button ref={closeRef} type="button" onClick={() => setExpanded(false)} aria-label="Close image viewer" className="flex size-11 items-center justify-center rounded-full border border-neutral-300 bg-white text-neutral-950 transition-colors hover:bg-neutral-100 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-neutral-950 dark:border-white/25 dark:bg-white/10 dark:text-white dark:hover:bg-white/20 dark:focus-visible:outline-white"><X aria-hidden className="size-5" /></button>
            </div>
          </div>
          <motion.div ref={viewerStageRef} className={`relative min-h-0 rounded-xl ${zoomed ? "overflow-auto touch-auto" : "overflow-hidden touch-pan-y"}`} drag={images.length > 1 && !zoomed ? "x" : false} dragConstraints={{ left: 0, right: 0 }} dragElastic={0.06} onDragEnd={(_, info) => { if (Math.abs(info.offset.x) > 60 || Math.abs(info.velocity.x) > 400) goTo(index + (info.offset.x < 0 ? 1 : -1)); }}>
            <div className="relative" style={{ width: zoomed ? "200%" : "100%", height: zoomed ? "200%" : "100%" }}>
              <Image src={shown.src} alt={shown.alt || `${title} image ${index + 1}`} fill priority sizes={zoomed ? "200vw" : "100vw"} loader={isCloudinary(shown.src) ? cloudinaryLoader : undefined} unoptimized={!isOptimizedHost(shown.src)} draggable={false} className="pointer-events-none select-none object-contain" />
            </div>
          </motion.div>
          <div className="flex min-h-11 min-w-0 flex-col items-stretch gap-3 sm:flex-row sm:items-center">
            <p aria-live="polite" className="max-h-24 min-w-0 flex-1 overflow-y-auto break-words text-xs leading-5 text-neutral-600 dark:text-neutral-300 sm:text-sm">{shown.caption || `${index + 1} / ${images.length}`}</p>
            {images.length > 1 && <div className="flex shrink-0 justify-end gap-2">
              <button type="button" aria-label="Previous full-screen image" onClick={() => goTo(index - 1)} className="flex size-11 items-center justify-center rounded-full border border-neutral-300 bg-white transition-colors hover:bg-neutral-100 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-neutral-950 dark:border-white/25 dark:bg-white/10 dark:hover:bg-white/20 dark:focus-visible:outline-white"><ChevronLeft aria-hidden className="size-5" /></button>
              <button type="button" aria-label="Next full-screen image" onClick={() => goTo(index + 1)} className="flex size-11 items-center justify-center rounded-full border border-neutral-300 bg-white transition-colors hover:bg-neutral-100 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-neutral-950 dark:border-white/25 dark:bg-white/10 dark:hover:bg-white/20 dark:focus-visible:outline-white"><ChevronRight aria-hidden className="size-5" /></button>
            </div>}
          </div>
        </div>, document.body)}
    </section>
  );
}
