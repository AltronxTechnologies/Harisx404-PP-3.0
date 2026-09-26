"use client";

import { useEffect, useState } from "react";
import Image, { type ImageLoaderProps } from "next/image";
import { motion, useReducedMotion } from "framer-motion";
import { ChevronLeft, ChevronRight, Pause, Play } from "lucide-react";

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
  const reducedMotion = useReducedMotion();
  const canPlay = images.length > 1 && !paused && !hovered && !focused;
  const current = images[index];

  useEffect(() => {
    if (reducedMotion) setPaused(true);
  }, [reducedMotion]);

  useEffect(() => {
    if (!canPlay) return;
    const timer = window.setInterval(() => setIndex((value) => (value + 1) % images.length), 5000);
    return () => window.clearInterval(timer);
  }, [canPlay, cycle, images.length]);

  if (!current) return null;

  const goTo = (next: number) => {
    setIndex((next + images.length) % images.length);
    setCycle((value) => value + 1);
  };

  return (
    <section aria-label={`${title} images`} className="min-w-0" onMouseEnter={() => setHovered(true)} onMouseLeave={() => setHovered(false)} onFocusCapture={() => setFocused(true)} onBlurCapture={(event) => { if (!event.currentTarget.contains(event.relatedTarget)) setFocused(false); }}>
      <motion.figure
        aria-label={`Image ${index + 1} of ${images.length}`}
        className="relative isolate aspect-[4/3] overflow-hidden rounded-3xl border border-border-primary bg-neutral-100 dark:bg-white/[0.04] sm:aspect-video"
        drag={images.length > 1 ? "x" : false}
        dragConstraints={{ left: 0, right: 0 }}
        dragElastic={0.08}
        onDragEnd={(_, info) => {
          if (Math.abs(info.offset.x) > 60 || Math.abs(info.velocity.x) > 400) goTo(index + (info.offset.x < 0 ? 1 : -1));
        }}
      >
        <Image src={current.src} alt="" aria-hidden fill sizes="(max-width: 1280px) 100vw, 1152px" loader={isCloudinary(current.src) ? cloudinaryLoader : undefined} unoptimized={!isOptimizedHost(current.src)} className="pointer-events-none select-none object-cover opacity-25 blur-xl" />
        <motion.div key={current.src} initial={reducedMotion ? false : { opacity: 0 }} animate={{ opacity: 1 }} transition={{ duration: 0.25 }} className="absolute inset-0">
          <Image src={current.src} alt={current.alt || (index === 0 ? `${title} cover image` : `${title} image ${index + 1}`)} fill priority sizes="(max-width: 1280px) 100vw, 1152px" loader={isCloudinary(current.src) ? cloudinaryLoader : undefined} unoptimized={!isOptimizedHost(current.src)} draggable={false} className="pointer-events-none select-none object-contain" />
        </motion.div>
        {images.length > 1 && <>
          <button type="button" aria-label="Previous image" onClick={() => goTo(index - 1)} className="absolute left-3 top-1/2 z-20 flex size-11 -translate-y-1/2 items-center justify-center rounded-full border border-border-primary bg-bg-primary/90 text-text-primary shadow-sm focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-text-primary sm:left-5"><ChevronLeft aria-hidden className="size-5" /></button>
          <button type="button" aria-label="Next image" onClick={() => goTo(index + 1)} className="absolute right-3 top-1/2 z-20 flex size-11 -translate-y-1/2 items-center justify-center rounded-full border border-border-primary bg-bg-primary/90 text-text-primary shadow-sm focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-text-primary sm:right-5"><ChevronRight aria-hidden className="size-5" /></button>
        </>}
      </motion.figure>
      {(images.length > 1 || current.caption) && <div className="mt-4 flex min-h-11 flex-wrap items-center justify-between gap-3 px-2">
        <p aria-live="polite" className="w-full min-w-0 text-sm text-text-secondary sm:w-auto sm:flex-1">{images.length > 1 && <span className="mr-3 whitespace-nowrap font-mono text-xs">{index + 1} / {images.length}</span>}{current.caption}</p>
        {images.length > 1 && <div className="flex w-full flex-wrap items-center justify-center gap-1 sm:w-auto sm:justify-end">
          {images.length <= 12 && images.map((image, position) => <button key={`${image.src}-${position}`} type="button" aria-label={`Go to image ${position + 1}`} aria-current={position === index ? "true" : undefined} onClick={() => goTo(position)} className="group flex h-11 items-center px-1"><span className={`h-1 rounded-full transition-all ${position === index ? "w-10 bg-text-primary" : "w-5 bg-border-primary group-hover:bg-text-secondary"}`} /></button>)}
          <button type="button" onClick={() => setPaused((value) => !value)} aria-label={paused ? "Play carousel" : "Pause carousel"} className="ml-2 flex size-11 items-center justify-center rounded-full border border-border-primary text-text-secondary focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-text-primary">{paused ? <Play aria-hidden className="size-4" /> : <Pause aria-hidden className="size-4" />}</button>
        </div>}
      </div>}
    </section>
  );
}
