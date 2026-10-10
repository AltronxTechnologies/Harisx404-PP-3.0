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
const controlClass = "flex h-11 w-11 shrink-0 items-center justify-center rounded-full border border-border-primary text-text-secondary transition-colors hover:border-neutral-400/70 active:border-neutral-400/70 hover:text-text-primary dark:hover:border-white/25 dark:active:border-white/25 max-[319px]:h-10 max-[319px]:w-10 sm:h-9 sm:w-9 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-text-primary";

export function ProjectImageCarousel({ images, title }: { images: Slide[]; title: string }) {
  const [index, setIndex] = useState(0);
  const [paused, setPaused] = useState(false);
  const [captionSlot, setCaptionSlot] = useState<0 | 1 | null>(null);
  const [visible, setVisible] = useState(false);
  const [pageActive, setPageActive] = useState(true);
  const [cycle, setCycle] = useState(0);
  const [direction, setDirection] = useState(1);
  const [displayed, setDisplayed] = useState<Slide | null>(images[0] ?? null);
  const [imageError, setImageError] = useState(false);
  const [secondaryError, setSecondaryError] = useState<string | null>(null);
  const [showLoading, setShowLoading] = useState(false);
  const [slideStep, setSlideStep] = useState(0);
  const figureRef = useRef<HTMLElement>(null);
  const captionBoxRef = useRef<HTMLDivElement>(null);
  const captionButtonRefs = useRef<(HTMLButtonElement | null)[]>([]);
  const nextButtonRef = useRef<HTMLButtonElement>(null);
  const wantedSrcRef = useRef(images[0]?.src);
  const readyUrlsRef = useRef(new Set<string>());
  const reducedMotion = useReducedMotion();
  const current = images[index];
  const shown = displayed ?? current;
  const shownIndex = images.findIndex((image) => image.src === shown?.src);
  const following = images.length > 1 ? images[(shownIndex + 1) % images.length] : null;
  const captionOpen = captionSlot !== null;
  const loading = Boolean(current && shown && current.src !== shown.src);
  const adjacent = images.length > 1 && visible
    ? [images[(shownIndex + 1) % images.length], images[(shownIndex - 1 + images.length) % images.length]]
      .filter((image, position, list) => image.src !== shown.src && list.findIndex((item) => item.src === image.src) === position)
    : [];
  wantedSrcRef.current = current?.src;
  const canPlay = images.length > 1 && visible && pageActive && !paused && !captionOpen && !loading && !imageError;

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
    const figure = figureRef.current;
    if (!figure) return;
    const update = () => {
      const width = figure.getBoundingClientRect().width;
      const desktop = window.matchMedia("(min-width: 1024px)").matches;
      setSlideStep(desktop && images.length > 1 ? (width + 16) / 2 : width);
      if (!desktop) setCaptionSlot((slot) => slot === 1 ? null : slot);
    };
    update();
    const observer = new ResizeObserver(update);
    observer.observe(figure);
    window.addEventListener("resize", update);
    return () => { observer.disconnect(); window.removeEventListener("resize", update); };
  }, [images.length]);

  useEffect(() => {
    if (!canPlay) return;
    const timer = window.setInterval(() => { setCaptionSlot(null); setDirection(1); setIndex((value) => (value + 1) % images.length); }, 5000);
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
    if (captionSlot === null) return;
    const onPointerDown = (event: PointerEvent) => {
      const target = event.target as Node;
      if (!captionBoxRef.current?.contains(target) && !captionButtonRefs.current.some((button) => button?.contains(target))) setCaptionSlot(null);
    };
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") { captionButtonRefs.current[captionSlot]?.focus(); setCaptionSlot(null); }
    };
    document.addEventListener("pointerdown", onPointerDown);
    document.addEventListener("keydown", onKeyDown);
    return () => { document.removeEventListener("pointerdown", onPointerDown); document.removeEventListener("keydown", onKeyDown); };
  }, [captionSlot]);

  if (!current) return null;

  const goTo = (next: number) => {
    const target = (next + images.length) % images.length;
    setCaptionSlot(null);
    setDirection(next < index ? -1 : 1);
    setImageError(false);
    if (readyUrlsRef.current.has(images[target].src)) setDisplayed(images[target]);
    setIndex(target);
    setCycle((value) => value + 1);
  };

  const renderCaption = (image: Slide, slot: 0 | 1) => {
    if (!image.caption.trim()) return null;
    const open = captionSlot === slot;
    const imageNumber = (shownIndex + slot) % images.length + 1;
    const position = slot === 0 ? "left-3" : "left-[calc(50%+20px)]";
    const id = slot === 0 ? "project-image-caption" : "project-image-caption-next";
    return <>
      {open && <div ref={captionBoxRef} id={id} role="region" aria-label="Image caption" className={`absolute bottom-16 z-20 flex max-h-[calc(100%-5rem)] w-48 max-w-[calc(100%-1.5rem)] flex-col overflow-hidden rounded-xl border border-border-primary bg-bg-primary text-text-primary shadow-xl dark:shadow-black/50 sm:max-h-48 sm:w-72 lg:max-w-[calc(50%-1.5rem)] ${position}`}>
        <div className="flex shrink-0 items-center justify-between border-b border-border-primary pl-3 pr-1 sm:pl-4">
          <span className="font-mono text-[10px] uppercase tracking-widest text-text-secondary">Caption</span>
          <button type="button" aria-label="Close image caption" onClick={() => { captionButtonRefs.current[slot]?.focus(); setCaptionSlot(null); }} className="flex size-11 items-center justify-center rounded-lg text-text-secondary hover:text-text-primary focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-text-primary"><X aria-hidden className="size-4" /></button>
        </div>
        <p className="min-h-0 overflow-y-auto whitespace-pre-wrap break-words px-3 py-2 text-xs leading-[18px] sm:px-4 sm:py-2.5 sm:text-[13px] sm:leading-5">{image.caption}</p>
      </div>}
      <button ref={(node) => { captionButtonRefs.current[slot] = node; }} type="button" aria-label={`${open ? "Hide" : "Show"} image ${imageNumber} caption`} aria-expanded={open} aria-controls={id} onClick={() => setCaptionSlot((current) => current === slot ? null : slot)} className={`absolute bottom-3 z-20 flex size-11 items-center justify-center rounded-full border border-border-primary bg-bg-primary text-text-primary shadow-md transition-colors hover:bg-neutral-100 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-text-primary dark:hover:bg-neutral-800 ${position}`}><MessageSquareText aria-hidden className="size-4" /></button>
    </>;
  };

  return (
    <section aria-label={`${title} images`} className="min-w-0">
      <figure
        ref={figureRef}
        aria-label={`Image ${shownIndex + 1} of ${images.length}`}
        className="isolate"
      >
        <motion.div
          className={`relative aspect-[3/2] overflow-hidden bg-bg-primary ${following ? "lg:aspect-auto lg:before:block lg:before:aspect-[3/2] lg:before:w-[calc(50%-8px)] lg:before:content-['']" : ""}`}
        drag={images.length > 1 ? "x" : false}
        dragConstraints={{ left: 0, right: 0 }}
        dragElastic={0.08}
        onDragEnd={(_, info) => {
          if (Math.abs(info.offset.x) > 60 || Math.abs(info.velocity.x) > 400) goTo(index + (info.offset.x < 0 ? 1 : -1));
        }}
        >
          {adjacent.map((image) => <Image key={`prepared-${image.src}`} src={image.src} alt="" aria-hidden fill loading="eager" sizes="(max-width: 1280px) 100vw, 1152px" loader={isCloudinary(image.src) ? cloudinaryLoader : undefined} unoptimized={!isOptimizedHost(image.src)} className="pointer-events-none opacity-0" onLoad={() => { readyUrlsRef.current.add(image.src); if (wantedSrcRef.current === image.src) { setDisplayed(image); setImageError(false); } }} onError={() => { if (wantedSrcRef.current === image.src) setImageError(true); }} />)}
          {loading && !adjacent.some((image) => image.src === current.src) && <Image src={current.src} alt="" aria-hidden fill loading="eager" sizes="(max-width: 1280px) 100vw, 1152px" loader={isCloudinary(current.src) ? cloudinaryLoader : undefined} unoptimized={!isOptimizedHost(current.src)} className="pointer-events-none opacity-0" onLoad={() => { readyUrlsRef.current.add(current.src); if (wantedSrcRef.current === current.src) { setDisplayed(current); setImageError(false); } }} onError={() => setImageError(true)} />}
          <AnimatePresence initial={false} custom={direction}>
            <motion.div key={shown.src} custom={direction} variants={{ enter: (travel: number) => ({ x: travel * slideStep }), center: { x: 0 }, exit: (travel: number) => ({ x: -travel * slideStep }) }} initial={reducedMotion ? false : "enter"} animate="center" exit="exit" transition={{ duration: reducedMotion ? 0 : 0.48, ease: [0.22, 1, 0.36, 1] }} className={`absolute inset-0 ${following ? "lg:flex lg:gap-4" : ""}`}>
              <div className={`relative h-full min-w-0 overflow-hidden rounded-2xl border border-border-primary bg-neutral-100 dark:bg-white/[0.04] sm:rounded-3xl ${following ? "lg:w-[calc(50%-8px)] lg:shrink-0" : ""}`}>
                <Image src={shown.src} alt={shown.alt || (shownIndex === 0 ? `${title} cover image` : `${title} image ${shownIndex + 1}`)} aria-hidden={imageError && !loading} fill loading="eager" sizes={following ? "(min-width: 1280px) 576px, (min-width: 1024px) 50vw, 100vw" : "(max-width: 1280px) 100vw, 1152px"} loader={isCloudinary(shown.src) ? cloudinaryLoader : undefined} unoptimized={!isOptimizedHost(shown.src)} draggable={false} className={`pointer-events-none select-none object-cover ${imageError && !loading ? "opacity-0" : ""}`} onLoad={() => { readyUrlsRef.current.add(shown.src); if (wantedSrcRef.current === shown.src) setImageError(false); }} onError={() => { if (wantedSrcRef.current === shown.src) setImageError(true); }} />
              </div>
              {following && <div className="relative hidden h-full w-[calc(50%-8px)] shrink-0 overflow-hidden rounded-3xl border border-border-primary bg-neutral-100 dark:bg-white/[0.04] lg:block">
                <Image src={following.src} alt={following.alt || `${title} image ${(shownIndex + 1) % images.length + 1}`} fill loading="eager" sizes="(min-width: 1280px) 576px, 50vw" loader={isCloudinary(following.src) ? cloudinaryLoader : undefined} unoptimized={!isOptimizedHost(following.src)} draggable={false} className={`pointer-events-none select-none object-cover ${secondaryError === following.src ? "opacity-0" : ""}`} onLoad={() => { readyUrlsRef.current.add(following.src); if (secondaryError === following.src) setSecondaryError(null); }} onError={() => setSecondaryError(following.src)} />
                {secondaryError === following.src && <div role="status" className="absolute inset-0 flex items-center justify-center bg-bg-primary p-3 text-sm text-text-primary">Image unavailable.</div>}
              </div>}
            </motion.div>
          </AnimatePresence>
          {imageError && <div role="status" className={`absolute z-10 flex items-center gap-3 text-sm text-text-primary ${loading ? "bottom-3 left-3 max-w-[calc(100%-1.5rem)] rounded-xl bg-bg-primary px-3 py-2 shadow-md" : `inset-0 justify-center rounded-2xl border border-border-primary bg-bg-primary p-3 sm:rounded-3xl ${following ? "lg:right-[calc(50%+8px)]" : ""}`}`}>
            <span>Image unavailable.</span>
            {images.length > 1 && <button type="button" onClick={() => { goTo(index + 1); requestAnimationFrame(() => nextButtonRef.current?.focus()); }} className="shrink-0 rounded-md border border-border-primary px-2 py-1 text-xs font-medium hover:border-neutral-400/70 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-text-primary dark:hover:border-white/25">Skip image</button>}
          </div>}
          {loading && showLoading && !imageError && <span role="status" className="absolute bottom-3 left-3 z-10 rounded-full bg-neutral-950 px-3 py-2 text-xs text-white">Loading image...</span>}
          {!loading && !imageError && renderCaption(shown, 0)}
          {following && !loading && secondaryError !== following.src && <div className="hidden lg:block">{renderCaption(following, 1)}</div>}
        </motion.div>
      </figure>
      {images.length > 1 && <div role="group" aria-label="Carousel controls" className="mt-4 flex items-center justify-center gap-2 max-[319px]:gap-1 sm:mt-8 sm:flex-wrap sm:gap-4">
        <button type="button" aria-label="Previous image" onClick={() => goTo(index - 1)} className={controlClass}><ChevronLeft aria-hidden className="size-3.5" /></button>
        <div className="flex min-w-0 flex-initial flex-wrap items-center justify-center sm:w-auto sm:max-w-[70vw] sm:flex-initial">
          {images.map((image, position) => <button key={`${image.src}-${position}`} type="button" aria-label={`Go to image ${position + 1}`} aria-current={position === shownIndex ? "true" : undefined} onClick={() => goTo(position)} className="group flex h-8 items-center px-1 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-text-primary">
            <span className={`relative h-1 overflow-hidden rounded-full bg-border-primary transition-all duration-300 ${position === shownIndex ? "w-8 sm:w-14" : "w-4 group-hover:bg-neutral-400/50 dark:group-hover:bg-white/25 sm:w-7"}`}>
              {position === shownIndex && <motion.span key={`${shownIndex}-${cycle}-${canPlay}`} className="absolute inset-0 origin-left rounded-full bg-gradient-to-r from-blue-500 via-violet-500 to-pink-500" initial={{ scaleX: canPlay ? 0 : 1 }} animate={{ scaleX: 1 }} transition={canPlay ? { duration: 5, ease: "linear" } : { duration: 0 }} />}
            </span>
          </button>)}
        </div>
        <button type="button" onClick={() => setPaused((value) => !value)} aria-label={paused ? "Play carousel" : "Pause carousel"} className={controlClass}>{paused ? <Play aria-hidden className="size-3.5" /> : <Pause aria-hidden className="size-3.5" />}</button>
        <button ref={nextButtonRef} type="button" aria-label="Next image" onClick={() => goTo(index + 1)} className={controlClass}><ChevronRight aria-hidden className="size-3.5" /></button>
      </div>}
    </section>
  );
}
