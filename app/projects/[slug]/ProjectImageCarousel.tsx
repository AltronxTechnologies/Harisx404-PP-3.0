"use client";

import { useEffect, useRef, useState } from "react";
import Image, { type ImageLoaderProps } from "next/image";
import { AnimatePresence, motion, useReducedMotion } from "framer-motion";
import { ChevronLeft, ChevronRight, MessageSquareText, Pause, Play, X } from "lucide-react";

type Slide = { src: string; alt: string; caption: string };

const cloudinaryLoader = ({ src, width }: ImageLoaderProps) =>
  src.replace("/upload/", `/upload/f_webp,q_auto:good,c_limit,w_${Math.min(width, 1920)}/`);

const isCloudinary = (src: string) => /^https:\/\/res\.cloudinary\.com\/[^/]+\/image\/upload\//.test(src);
const isOptimizedHost = (src: string) => /^https:\/\/(?:images\.unsplash\.com|res\.cloudinary\.com|avatars\.githubusercontent\.com|lh3\.googleusercontent\.com|cdn\.hashnode\.com|media\.giphy\.com|dev-to-uploads\.s3\.amazonaws\.com|badges\.pufler\.dev|img\.shields\.io|framerusercontent\.com)\//.test(src);
const controlClass = "flex h-11 w-11 shrink-0 items-center justify-center rounded-full border border-border-primary text-text-secondary transition-colors hover:border-neutral-400/70 active:border-neutral-400/70 hover:text-text-primary dark:hover:border-white/25 dark:active:border-white/25 sm:h-9 sm:w-9 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-text-primary";

export function ProjectImageCarousel({ images, title }: { images: Slide[]; title: string }) {
  const [index, setIndex] = useState(0);
  const [paused, setPaused] = useState(false);
  const [captionOpen, setCaptionOpen] = useState(false);
  const [visible, setVisible] = useState(false);
  const [pageActive, setPageActive] = useState(true);
  const [cycle, setCycle] = useState(0);
  const [direction, setDirection] = useState(1);
  const [displayed, setDisplayed] = useState<Slide | null>(images[0] ?? null);
  const [imageError, setImageError] = useState(false);
  const [showLoading, setShowLoading] = useState(false);
  const figureRef = useRef<HTMLElement>(null);
  const captionBoxRef = useRef<HTMLDivElement>(null);
  const captionButtonRef = useRef<HTMLButtonElement>(null);
  const wantedSrcRef = useRef(images[0]?.src);
  const readyUrlsRef = useRef(new Set<string>());
  const reducedMotion = useReducedMotion();
  const current = images[index];
  const shown = displayed ?? current;
  const shownIndex = images.findIndex((image) => image.src === shown?.src);
  const loading = Boolean(current && shown && current.src !== shown.src);
  const adjacent = images.length > 1 && visible
    ? [images[(shownIndex + 1) % images.length], images[(shownIndex - 1 + images.length) % images.length]]
      .filter((image, position, list) => image.src !== shown.src && list.findIndex((item) => item.src === image.src) === position)
    : [];
  wantedSrcRef.current = current?.src;
  const canPlay = images.length > 1 && visible && pageActive && !paused && !captionOpen && !loading;

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
    const timer = window.setInterval(() => { setCaptionOpen(false); setDirection(1); setIndex((value) => (value + 1) % images.length); }, 5000);
    return () => window.clearInterval(timer);
  }, [canPlay, cycle, images.length]);

  useEffect(() => {
    if (!loading) { setShowLoading(false); return; }
    const timer = window.setTimeout(() => setShowLoading(true), 350);
    return () => window.clearTimeout(timer);
  }, [loading, current?.src]);

  useEffect(() => {
    if (current && loading && readyUrlsRef.current.has(current.src)) setDisplayed(current);
  }, [current, loading]);

  useEffect(() => {
    if (!captionOpen) return;
    const onPointerDown = (event: PointerEvent) => {
      const target = event.target as Node;
      if (!captionBoxRef.current?.contains(target) && !captionButtonRef.current?.contains(target)) setCaptionOpen(false);
    };
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") { setCaptionOpen(false); captionButtonRef.current?.focus(); }
    };
    document.addEventListener("pointerdown", onPointerDown);
    document.addEventListener("keydown", onKeyDown);
    return () => { document.removeEventListener("pointerdown", onPointerDown); document.removeEventListener("keydown", onKeyDown); };
  }, [captionOpen]);

  if (!current) return null;

  const goTo = (next: number) => {
    const target = (next + images.length) % images.length;
    setCaptionOpen(false);
    setDirection(next < index ? -1 : 1);
    setImageError(false);
    if (readyUrlsRef.current.has(images[target].src)) setDisplayed(images[target]);
    setIndex(target);
    setCycle((value) => value + 1);
  };

  return (
    <section aria-label={`${title} images`} className="min-w-0">
      <figure
        ref={figureRef}
        aria-label={`Image ${shownIndex + 1} of ${images.length}`}
        className="isolate overflow-hidden rounded-2xl border border-border-primary bg-white dark:bg-white/[0.02] sm:rounded-3xl"
      >
        <motion.div
          className="relative aspect-[3/2] overflow-hidden bg-neutral-100 dark:bg-white/[0.04]"
        drag={images.length > 1 ? "x" : false}
        dragConstraints={{ left: 0, right: 0 }}
        dragElastic={0.08}
        onDragEnd={(_, info) => {
          if (Math.abs(info.offset.x) > 60 || Math.abs(info.velocity.x) > 400) goTo(index + (info.offset.x < 0 ? 1 : -1));
        }}
        >
          {adjacent.map((image) => <Image key={`prepared-${image.src}`} src={image.src} alt="" aria-hidden fill loading="eager" sizes="(max-width: 1280px) 100vw, 1152px" loader={isCloudinary(image.src) ? cloudinaryLoader : undefined} unoptimized={!isOptimizedHost(image.src)} className="pointer-events-none opacity-0" onLoad={() => { readyUrlsRef.current.add(image.src); if (wantedSrcRef.current === image.src) { setDisplayed(image); setImageError(false); } }} onError={() => { if (wantedSrcRef.current === image.src) setImageError(true); }} />)}
          {loading && !adjacent.some((image) => image.src === current.src) && <Image src={current.src} alt="" aria-hidden fill priority sizes="(max-width: 1280px) 100vw, 1152px" loader={isCloudinary(current.src) ? cloudinaryLoader : undefined} unoptimized={!isOptimizedHost(current.src)} className="pointer-events-none opacity-0" onLoad={() => { readyUrlsRef.current.add(current.src); if (wantedSrcRef.current === current.src) { setDisplayed(current); setImageError(false); } }} onError={() => setImageError(true)} />}
          <AnimatePresence initial={false} custom={direction}>
            <motion.div key={shown.src} custom={direction} variants={{ enter: (travel: number) => ({ x: `${travel * 100}%` }), center: { x: "0%" }, exit: (travel: number) => ({ x: `${-travel * 100}%` }) }} initial={reducedMotion ? false : "enter"} animate="center" exit="exit" transition={{ duration: reducedMotion ? 0 : 0.48, ease: [0.22, 1, 0.36, 1] }} className="absolute inset-0">
              <Image src={shown.src} alt={shown.alt || (shownIndex === 0 ? `${title} cover image` : `${title} image ${shownIndex + 1}`)} fill priority sizes="(max-width: 1280px) 100vw, 1152px" loader={isCloudinary(shown.src) ? cloudinaryLoader : undefined} unoptimized={!isOptimizedHost(shown.src)} draggable={false} className="pointer-events-none select-none object-cover" onLoad={() => readyUrlsRef.current.add(shown.src)} />
            </motion.div>
          </AnimatePresence>
          {loading && (showLoading || imageError) && <span role="status" className="absolute bottom-3 left-3 z-10 rounded-full bg-neutral-950 px-3 py-2 text-xs text-white">{imageError ? "Image unavailable. Choose another." : "Loading image..."}</span>}
          {!loading && shown.caption.trim() && <>
            {captionOpen && <div ref={captionBoxRef} id="project-image-caption" role="region" aria-label="Image caption" className="absolute bottom-16 left-3 z-20 flex max-h-[calc(100%-5rem)] w-72 max-w-[calc(100%-1.5rem)] flex-col overflow-hidden rounded-xl border border-neutral-300 bg-white text-neutral-900 shadow-xl dark:border-white/25 dark:bg-neutral-900 dark:text-white dark:shadow-black/50 sm:max-h-48">
              <div className="flex shrink-0 items-center justify-between border-b border-neutral-200 pl-4 pr-1 dark:border-white/15">
                <span className="font-mono text-[10px] uppercase tracking-widest text-neutral-600 dark:text-neutral-300">Caption</span>
                <button type="button" aria-label="Close image caption" onClick={() => { setCaptionOpen(false); captionButtonRef.current?.focus(); }} className="flex size-11 items-center justify-center rounded-lg text-neutral-700 hover:bg-neutral-100 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-neutral-900 dark:text-neutral-200 dark:hover:bg-neutral-800 dark:focus-visible:outline-white"><X aria-hidden className="size-4" /></button>
              </div>
              <p className="min-h-0 overflow-y-auto whitespace-pre-wrap break-words px-4 py-2.5 text-[13px] leading-5">{shown.caption}</p>
            </div>}
            <button ref={captionButtonRef} type="button" aria-label={captionOpen ? "Hide image caption" : "Show image caption"} aria-expanded={captionOpen} aria-controls="project-image-caption" onClick={() => setCaptionOpen((open) => !open)} className="absolute bottom-3 left-3 z-20 flex size-11 items-center justify-center rounded-full border border-neutral-300 bg-white text-neutral-900 shadow-md transition-colors hover:bg-neutral-100 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-neutral-900 dark:border-white/25 dark:bg-neutral-900 dark:text-white dark:hover:bg-neutral-800 dark:focus-visible:outline-white"><MessageSquareText aria-hidden className="size-4" /></button>
          </>}
        </motion.div>
      </figure>
      {images.length > 1 && <div role="group" aria-label="Carousel controls" className="mt-8 flex flex-wrap items-center justify-center gap-4">
        <button type="button" aria-label="Previous image" onClick={() => goTo(index - 1)} className={`${controlClass} order-2 sm:order-none`}><ChevronLeft aria-hidden className="size-3.5" /></button>
        <div className="order-1 flex w-full max-w-[70vw] flex-wrap items-center justify-center sm:order-none sm:w-auto">
          {images.map((image, position) => <button key={`${image.src}-${position}`} type="button" aria-label={`Go to image ${position + 1}`} aria-current={position === shownIndex ? "true" : undefined} onClick={() => goTo(position)} className="group flex h-8 items-center px-1 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-text-primary">
            <span className={`relative h-1 overflow-hidden rounded-full bg-border-primary transition-all duration-300 ${position === shownIndex ? "w-14" : "w-7 group-hover:bg-neutral-400/50 dark:group-hover:bg-white/25"}`}>
              {position === shownIndex && <motion.span key={`${shownIndex}-${cycle}-${canPlay}`} className="absolute inset-0 origin-left rounded-full bg-gradient-to-r from-blue-500 via-violet-500 to-pink-500" initial={{ scaleX: canPlay ? 0 : 1 }} animate={{ scaleX: 1 }} transition={canPlay ? { duration: 5, ease: "linear" } : { duration: 0 }} />}
            </span>
          </button>)}
        </div>
        <button type="button" onClick={() => setPaused((value) => !value)} aria-label={paused ? "Play carousel" : "Pause carousel"} className={`${controlClass} order-3 sm:order-none`}>{paused ? <Play aria-hidden className="size-3.5" /> : <Pause aria-hidden className="size-3.5" />}</button>
        <button type="button" aria-label="Next image" onClick={() => goTo(index + 1)} className={`${controlClass} order-4 sm:order-none`}><ChevronRight aria-hidden className="size-3.5" /></button>
      </div>}
    </section>
  );
}
