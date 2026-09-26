"use client";

import { useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import Image, { type ImageLoaderProps } from "next/image";
import { AnimatePresence, motion, useReducedMotion } from "framer-motion";
import { ChevronLeft, ChevronRight, Expand, Pause, Play, X } from "lucide-react";

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
  const [cycle, setCycle] = useState(0);
  const [expanded, setExpanded] = useState(false);
  const expandRef = useRef<HTMLButtonElement>(null);
  const dialogRef = useRef<HTMLDivElement>(null);
  const closeRef = useRef<HTMLButtonElement>(null);
  const reducedMotion = useReducedMotion();
  const canPlay = images.length > 1 && !paused && !hovered && !focused && !expanded;
  const current = images[index];

  useEffect(() => {
    if (reducedMotion) setPaused(true);
  }, [reducedMotion]);

  useEffect(() => {
    if (!canPlay) return;
    const timer = window.setInterval(() => setIndex((value) => (value + 1) % images.length), 5000);
    return () => window.clearInterval(timer);
  }, [canPlay, cycle, images.length]);

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
    setIndex((next + images.length) % images.length);
    setCycle((value) => value + 1);
  };

  return (
    <section aria-label={`${title} images`} className="min-w-0" onMouseEnter={() => setHovered(true)} onMouseLeave={() => setHovered(false)} onFocusCapture={() => setFocused(true)} onBlurCapture={(event) => { if (!event.currentTarget.contains(event.relatedTarget)) setFocused(false); }}>
      <motion.figure
        aria-label={`Image ${index + 1} of ${images.length}`}
        className="relative isolate aspect-[4/3] overflow-hidden rounded-2xl border border-border-primary bg-neutral-100 dark:bg-white/[0.04] sm:aspect-video sm:rounded-3xl"
        drag={images.length > 1 ? "x" : false}
        dragConstraints={{ left: 0, right: 0 }}
        dragElastic={0.08}
        onDragEnd={(_, info) => {
          if (Math.abs(info.offset.x) > 60 || Math.abs(info.velocity.x) > 400) goTo(index + (info.offset.x < 0 ? 1 : -1));
        }}
      >
        <AnimatePresence initial={false}>
          <motion.div key={current.src} initial={reducedMotion ? false : { opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} transition={{ duration: reducedMotion ? 0 : 0.24 }} className="absolute inset-0">
            <Image src={current.src} alt="" aria-hidden fill priority sizes="(max-width: 1280px) 100vw, 1152px" loader={isCloudinary(current.src) ? cloudinaryLoader : undefined} unoptimized={!isOptimizedHost(current.src)} className="pointer-events-none select-none object-cover opacity-25 blur-xl" />
            <Image src={current.src} alt={current.alt || (index === 0 ? `${title} cover image` : `${title} image ${index + 1}`)} fill priority sizes="(max-width: 1280px) 100vw, 1152px" loader={isCloudinary(current.src) ? cloudinaryLoader : undefined} unoptimized={!isOptimizedHost(current.src)} draggable={false} className="pointer-events-none select-none object-contain" />
          </motion.div>
        </AnimatePresence>
        <button ref={expandRef} type="button" onClick={() => setExpanded(true)} aria-label={`View image ${index + 1} in full screen`} className="group absolute inset-0 z-10 cursor-zoom-in focus-visible:outline focus-visible:outline-2 focus-visible:-outline-offset-2 focus-visible:outline-text-primary">
          <span className="absolute bottom-3 right-3 inline-flex min-h-10 items-center gap-2 rounded-full border border-border-primary bg-bg-primary/95 px-4 text-xs font-medium text-text-primary shadow-sm transition-colors group-hover:bg-bg-primary sm:bottom-5 sm:right-5"><Expand aria-hidden className="size-3.5" /> View image</span>
        </button>
        {images.length > 1 && <>
          <button type="button" aria-label="Previous image" onClick={() => goTo(index - 1)} className="absolute left-3 top-1/2 z-20 flex size-11 -translate-y-1/2 items-center justify-center rounded-full border border-border-primary bg-bg-primary/95 text-text-primary shadow-sm transition-colors hover:bg-bg-primary focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-text-primary sm:left-5"><ChevronLeft aria-hidden className="size-5" /></button>
          <button type="button" aria-label="Next image" onClick={() => goTo(index + 1)} className="absolute right-3 top-1/2 z-20 flex size-11 -translate-y-1/2 items-center justify-center rounded-full border border-border-primary bg-bg-primary/95 text-text-primary shadow-sm transition-colors hover:bg-bg-primary focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-text-primary sm:right-5"><ChevronRight aria-hidden className="size-5" /></button>
        </>}
      </motion.figure>
      {(images.length > 1 || current.caption) && <div className="mt-4 flex min-h-11 flex-wrap items-center justify-between gap-3 px-2">
        <p aria-live="polite" className="w-full min-w-0 text-sm text-text-secondary sm:w-auto sm:flex-1">{images.length > 1 && <span className="mr-3 whitespace-nowrap font-mono text-xs">{index + 1} / {images.length}</span>}{current.caption}</p>
        {images.length > 1 && <div className="flex w-full flex-wrap items-center justify-center gap-1 sm:w-auto sm:justify-end">
          {images.length <= 12 && images.map((image, position) => <button key={`${image.src}-${position}`} type="button" aria-label={`Go to image ${position + 1}`} aria-current={position === index ? "true" : undefined} onClick={() => goTo(position)} className="group flex h-11 items-center px-1"><span className={`h-1 rounded-full transition-all ${position === index ? "w-10 bg-text-primary" : "w-5 bg-border-primary group-hover:bg-text-secondary"}`} /></button>)}
          <button type="button" onClick={() => setPaused((value) => !value)} aria-label={paused ? "Play carousel" : "Pause carousel"} className="ml-2 flex size-11 items-center justify-center rounded-full border border-border-primary text-text-secondary focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-text-primary">{paused ? <Play aria-hidden className="size-4" /> : <Pause aria-hidden className="size-4" />}</button>
        </div>}
      </div>}
      {expanded && createPortal(
        <div data-project-image-viewer ref={dialogRef} role="dialog" aria-modal="true" aria-label={`${title} image viewer`} className="fixed inset-0 z-[8000] grid grid-rows-[auto_minmax(0,1fr)_auto] gap-3 bg-white/95 p-3 pb-[max(12px,env(safe-area-inset-bottom))] text-neutral-950 backdrop-blur-xl dark:bg-neutral-950/95 dark:text-white sm:gap-5 sm:p-6">
          <div className="flex min-w-0 items-center justify-between gap-4">
            <div className="min-w-0"><p className="truncate text-sm font-medium">{title}</p><p className="font-mono text-xs text-neutral-600 dark:text-neutral-400">Image {index + 1} of {images.length}</p></div>
            <button ref={closeRef} type="button" onClick={() => setExpanded(false)} aria-label="Close image viewer" className="flex size-11 shrink-0 items-center justify-center rounded-full border border-neutral-300 bg-white text-neutral-950 transition-colors hover:bg-neutral-100 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-neutral-950 dark:border-white/25 dark:bg-white/10 dark:text-white dark:hover:bg-white/20 dark:focus-visible:outline-white"><X aria-hidden className="size-5" /></button>
          </div>
          <motion.div className="relative min-h-0 touch-pan-y overflow-hidden rounded-xl bg-neutral-100 dark:bg-neutral-900" drag={images.length > 1 ? "x" : false} dragConstraints={{ left: 0, right: 0 }} dragElastic={0.06} onDragEnd={(_, info) => { if (Math.abs(info.offset.x) > 60 || Math.abs(info.velocity.x) > 400) goTo(index + (info.offset.x < 0 ? 1 : -1)); }}>
            <Image src={current.src} alt={current.alt || `${title} image ${index + 1}`} fill priority sizes="100vw" loader={isCloudinary(current.src) ? cloudinaryLoader : undefined} unoptimized={!isOptimizedHost(current.src)} draggable={false} className="pointer-events-none select-none object-contain" />
          </motion.div>
          <div className="flex min-h-11 min-w-0 items-center justify-between gap-3">
            <p aria-live="polite" className="min-w-0 flex-1 truncate text-xs text-neutral-600 dark:text-neutral-300 sm:text-sm">{current.caption || `${index + 1} / ${images.length}`}</p>
            {images.length > 1 && <div className="flex shrink-0 gap-2">
              <button type="button" aria-label="Previous full-screen image" onClick={() => goTo(index - 1)} className="flex size-11 items-center justify-center rounded-full border border-neutral-300 bg-white transition-colors hover:bg-neutral-100 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-neutral-950 dark:border-white/25 dark:bg-white/10 dark:hover:bg-white/20 dark:focus-visible:outline-white"><ChevronLeft aria-hidden className="size-5" /></button>
              <button type="button" aria-label="Next full-screen image" onClick={() => goTo(index + 1)} className="flex size-11 items-center justify-center rounded-full border border-neutral-300 bg-white transition-colors hover:bg-neutral-100 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-neutral-950 dark:border-white/25 dark:bg-white/10 dark:hover:bg-white/20 dark:focus-visible:outline-white"><ChevronRight aria-hidden className="size-5" /></button>
            </div>}
          </div>
        </div>, document.body)}
    </section>
  );
}
