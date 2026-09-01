"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { motion, useReducedMotion } from "framer-motion";
import { MessageSquarePlus, Pause, Play } from "lucide-react";
import type { Testimonial } from "@/app/data/fallback-home";
import { testimonials as fallbackTestimonials } from "@/app/data/fallback-home";
import { SectionHeading } from "./SectionHeading";
import { TestimonialSubmitModal } from "./TestimonialSubmitModal";

const tints = [
  "from-violet-500/15 to-transparent",
  "from-emerald-500/15 to-transparent",
  "from-blue-500/15 to-transparent",
];

const CARD_WIDTH = 380;
const GAP = 16;
const INTERVAL = 5000;

const initials = (name: string) =>
  name
    .split(" ")
    .map((n) => n[0])
    .slice(0, 2)
    .join("");

/** Avatar with graceful degradation: photo → initials if the URL is
 *  missing OR if the image fails to load at runtime (dead link, deleted
 *  Gravatar, network error). */
function Avatar({ src, name, tint }: { src: string | null; name: string; tint: string }) {
  const [failed, setFailed] = useState(false);
  if (src && !failed) {
    return (
      <span className="relative h-10 w-10 shrink-0 overflow-hidden rounded-full border border-border-primary">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src={src}
          alt={name}
          className="h-full w-full object-cover"
          loading="lazy"
          onError={() => setFailed(true)}
        />
      </span>
    );
  }
  return (
    <span
      className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-full border border-border-primary bg-gradient-to-br font-mono text-xs text-text-secondary ${tint}`}
    >
      {initials(name)}
    </span>
  );
}

export function Testimonials({ items: itemsProp }: { items?: Testimonial[] }) {
  const items =
    itemsProp && itemsProp.length > 0 ? itemsProp : fallbackTestimonials;
  // Circular loop: the track renders the list twice; index is allowed to
  // reach items.length (the first clone), then snaps back to 0 with no
  // transition — so the last card is always followed by the first one and
  // there is never empty space on the right.
  const [index, setIndex] = useState(0);
  const [snapping, setSnapping] = useState(false);
  const [userPaused, setUserPaused] = useState(false);
  const [hovered, setHovered] = useState(false);
  const [cycle, setCycle] = useState(0);
  const [submitOpen, setSubmitOpen] = useState(false);
  const [cardWidth, setCardWidth] = useState(CARD_WIDTH);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const prefersReducedMotion = useReducedMotion();

  // Respect prefers-reduced-motion: start paused (the visitor can still
  // press play to explicitly opt in, and navigate with the dots).
  useEffect(() => {
    if (prefersReducedMotion) setUserPaused(true);
  }, [prefersReducedMotion]);

  // Autoplay stops while the pointer is over the cards (don't move text
  // someone is reading), when explicitly paused, or with < 2 items.
  const paused = userPaused || hovered || items.length < 2;

  const extended = [...items, ...items];
  const activeDot = index % items.length;

  useEffect(() => {
    const update = () =>
      setCardWidth(Math.min(CARD_WIDTH, window.innerWidth * 0.85));
    update();
    window.addEventListener("resize", update);
    return () => window.removeEventListener("resize", update);
  }, []);

  const advance = useCallback(() => {
    setIndex((prev) => {
      // Rescue path: if we're somehow parked on the clone (e.g. the spring
      // was interrupted so onAnimationComplete never fired), snap home and
      // continue instead of freezing the loop.
      if (prev >= items.length) {
        setSnapping(true);
        return 1 % items.length;
      }
      return prev + 1;
    });
  }, [items.length]);

  // `cycle` restarts the interval whenever the visitor navigates manually,
  // so a dot click always gets a full 5s before the next auto-advance.
  useEffect(() => {
    if (paused) return;
    timerRef.current = setInterval(advance, INTERVAL);
    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [paused, advance, cycle]);

  const goTo = useCallback((i: number) => {
    setSnapping(false); // manual navigation must always animate
    setIndex(i);
    setCycle((c) => c + 1);
  }, []);

  // Release the no-transition snap one frame after the instant jump.
  useEffect(() => {
    if (!snapping) return;
    const id = requestAnimationFrame(() => setSnapping(false));
    return () => cancelAnimationFrame(id);
  }, [snapping]);

  const handleLoopEnd = useCallback(() => {
    if (index >= items.length) {
      setSnapping(true);
      setIndex(0);
      // Restart the interval so the progress bar and the next auto-advance
      // stay in phase after the wrap.
      setCycle((c) => c + 1);
    }
  }, [index, items.length]);

  return (
    <section id="testimonials" className="scroll-mt-24 overflow-hidden px-2 sm:px-4">
      <SectionHeading kicker="Testimonials" animateWords>
        Word on the street{" "}
        <span className="animate-gradient-x text-colorfull px-1 pb-1 italic [text-shadow:none]">
          about me
        </span>
      </SectionHeading>

      <div
        className="mt-14"
        aria-live="polite"
        onMouseEnter={() => setHovered(true)}
        onMouseLeave={() => setHovered(false)}
      >
        <motion.div
          className="flex cursor-grab gap-4 active:cursor-grabbing"
          animate={{ x: -(index * (cardWidth + GAP)) }}
          transition={
            snapping || prefersReducedMotion
              ? { duration: 0 }
              : { type: "spring", stiffness: 120, damping: 22 }
          }
          onAnimationComplete={handleLoopEnd}
          // Touch/pointer swipe: constraints pin the track so `animate`
          // stays the source of truth; a decisive drag advances the loop.
          drag={items.length > 1 ? "x" : false}
          dragConstraints={{ left: 0, right: 0 }}
          dragElastic={0.12}
          onDragEnd={(_, info) => {
            const goneFar = Math.abs(info.offset.x) > 60;
            const flung = Math.abs(info.velocity.x) > 400;
            if (!goneFar && !flung) return;
            if (info.offset.x < 0) {
              // Forward — advance() wraps via the clone zone and includes
              // the stuck-on-clone rescue path.
              advance();
              setCycle((c) => c + 1);
            } else {
              goTo((activeDot - 1 + items.length) % items.length);
            }
          }}
        >
          {extended.map((t, i) => (
            <motion.article
              key={`${t.name}-${i}`}
              // Clones are purely visual (they fill the loop seam) —
              // hide them from screen readers to avoid duplicate content.
              aria-hidden={i >= items.length || undefined}
              whileHover={prefersReducedMotion ? undefined : { y: -4 }}
              transition={{ type: "spring", stiffness: 400, damping: 30, mass: 0.8 }}
              className={`card-light-edge relative flex w-[85vw] max-w-[380px] shrink-0 flex-col rounded-3xl border border-border-primary bg-white bg-gradient-to-br p-6 transition-shadow duration-300 hover:shadow-lg dark:bg-white/[0.02] sm:w-[380px] sm:p-8 ${tints[i % tints.length]}`}
            >
              {/* Title — exactly two lines reserved on every card so all
                  headlines start AND end on the same baselines. */}
              <h3 className="line-clamp-2 min-h-[3.45rem] font-display text-xl font-medium italic leading-snug text-text-primary md:min-h-[4.125rem] md:text-2xl">
                &ldquo;{t.quote_headline}&rdquo;
              </h3>
              {/* Quote — flexible middle, capped at 6 lines so an extra-long
                  testimonial can't blow the card height out of line. */}
              <p className="mt-4 line-clamp-6 flex-1 text-sm leading-relaxed text-text-secondary">
                {t.quote}
              </p>
              {/* Author footer — divider above; name/role truncate so long
                  values can't overflow their allocated line. */}
              <div className="mt-6 flex items-center gap-3 border-t border-border-primary pt-4">
                <Avatar
                  src={t.avatar_url ?? null}
                  name={t.name}
                  tint={tints[i % tints.length]}
                />
                <span className="min-w-0">
                  <span className="block truncate text-sm font-medium text-text-primary">
                    {t.name}
                  </span>
                  <span className="block truncate text-xs text-text-secondary">
                    {t.role}
                  </span>
                </span>
              </div>
            </motion.article>
          ))}
        </motion.div>
      </div>

      {items.length > 1 && (
        <div className="mt-8 flex items-center justify-center gap-4">
          <div className="flex max-w-[70vw] flex-wrap items-center justify-center">
            {items.map((t, i) => {
              const active = i === activeDot;
              return (
                <button
                  key={`${t.name}-dot-${i}`}
                  type="button"
                  aria-label={`Go to testimonial ${i + 1}`}
                  aria-current={active || undefined}
                  onClick={() => goTo(i)}
                  // Generous tap target around the slim 4px bar.
                  className="group flex h-8 items-center px-1"
                >
                  <span
                    className={`relative h-1 overflow-hidden rounded-full bg-border-primary transition-all duration-300 ${
                      active ? "w-14" : "w-7 group-hover:bg-neutral-400/50 dark:group-hover:bg-white/25"
                    }`}
                  >
                    {active && (
                      <motion.span
                        key={`progress-${index}-${paused}`}
                        className="absolute inset-0 origin-left rounded-full bg-gradient-to-r from-blue-500 via-violet-500 to-pink-500"
                        initial={{ scaleX: 0 }}
                        animate={{ scaleX: paused ? 0 : 1 }}
                        transition={
                          paused
                            ? { duration: 0 }
                            : { duration: INTERVAL / 1000, ease: "linear" }
                        }
                      />
                    )}
                  </span>
                </button>
              );
            })}
          </div>
          <button
            type="button"
            onClick={() => setUserPaused((p) => !p)}
            aria-label={userPaused ? "Play carousel" : "Pause carousel"}
            className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full border border-border-primary text-text-secondary transition-colors hover:border-neutral-400/70 hover:text-text-primary dark:hover:border-white/25 sm:h-9 sm:w-9"
          >
            {userPaused ? (
              <Play className="h-3.5 w-3.5" aria-hidden />
            ) : (
              <Pause className="h-3.5 w-3.5" aria-hidden />
            )}
          </button>
        </div>
      )}

      {/* Public submission entry point — new quotes land in a moderation
          queue (status 'pending') and only go live after admin approval. */}
      <div className="mt-6 flex justify-center">
        <button
          type="button"
          onClick={() => setSubmitOpen(true)}
          className="inline-flex items-center gap-2 rounded-full border border-border-primary px-5 py-2.5 text-sm font-medium text-text-secondary transition-colors hover:border-neutral-400/70 hover:text-text-primary dark:hover:border-white/25"
        >
          <MessageSquarePlus className="h-4 w-4" aria-hidden />
          Worked with me? Share your experience
        </button>
      </div>

      <TestimonialSubmitModal
        open={submitOpen}
        onClose={() => setSubmitOpen(false)}
      />
    </section>
  );
}
