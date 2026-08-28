"use client";

import { useRef, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { useClickAnyWhere, useMediaQuery } from "usehooks-ts";

import { cn } from "../lib/utils";
import { useRotationVelocity } from "../lib/useRotationVelocity";
import { BentoCard } from "./BentoCard";
import {
  monogramSvg,
  nametagSvg,
  shipitSvg,
  terminalSvg,
} from "./sticker-art";

/* Vector-sharp sticker: inline SVG fills the sized wrapper */
function StickerArt({
  svg,
  className,
  label,
}: {
  svg: string;
  className?: string;
  label: string;
}) {
  return (
    <div
      role="img"
      aria-label={label}
      className={cn("[&>svg]:h-auto [&>svg]:w-full", className)}
      dangerouslySetInnerHTML={{ __html: svg }}
    />
  );
}

// Deterministic "random" values based on index to avoid hydration mismatch
const stickerRotations = [-8, 12, -5, 10];
const stickerYOffsets = [12, -8, 15, -10];
/* Total VISUAL tilt = live rotation + the tilt baked into each SVG's
   artwork (-5, -2, +3, +5). Captions use this so they match what the
   eye actually sees. */
const stickerVisualTilts = [-13, 10, -2, 12];

function Sticker({
  children,
  index = 1,
  caption,
  className,
}: {
  children: React.ReactNode;
  index: number;
  caption?: string;
  className?: string;
}) {
  // Refs + live measurement of the sticker's on-screen position
  const itemRef = useRef<HTMLDivElement | null>(null);

  // Interaction state
  const [isDragging, setIsDragging] = useState<boolean>(false);
  const [isCaptionVisible, setIsCaptionVisible] = useState<boolean>(false);
  const [isModal, setIsModal] = useState<boolean>(false);

  // Deterministic per-sticker values (no hydration mismatch)
  const initialRotation = stickerRotations[index % stickerRotations.length];
  const initialY = stickerYOffsets[index % stickerYOffsets.length];

  /* Touch behavior is detected by pointer capability, not viewport width —
     touch iPads and hybrid laptops in tablet mode get tap-to-reveal even at
     desktop sizes, while a desktop with a mouse always gets hover. */
  const matches = useMediaQuery("(hover: none)");

  function onOpen() {
    if (matches) {
      setIsModal(!isModal);
      setIsCaptionVisible(!isModal);
    }
  }

  function onStart() {
    if (!matches) {
      setIsCaptionVisible(true);
      setIsDragging(true);
    }
  }

  function onEnd() {
    if (!matches) {
      setIsCaptionVisible(false);
      setIsDragging(false);
    }
  }

  useClickAnyWhere((e) => {
    if (
      e.target != itemRef.current &&
      !itemRef.current?.contains(e.target as Node) &&
      isModal &&
      matches
    ) {
      setIsModal(false);
      setIsCaptionVisible(false);
    }
  });

  // Rotation driven by drag velocity
  const { rotate, x } = useRotationVelocity(initialRotation);

  /* Caption placement: always centered under its sticker (it may
     extend past the card edges - intentional, tooltips float). It
     carries the SAME tilt as its sticker, so the pair reads as one
     tilted unit. */
  const captionTilt = stickerVisualTilts[index % stickerVisualTilts.length];
  /* Rotation about the card center slides its TOP edge (the edge the
     eye aligns with the sticker) sideways by (height/2)*sin(tilt).
     Compensate by the same amount so the card sits visually
     dead-centered below its sticker. (~84px card -> half = 42) */
  const topEdgeShift = Math.round(
    42 * Math.sin((captionTilt * Math.PI) / 180)
  );
  const captionPos = { left: `calc(50% - ${topEdgeShift}px)`, x: "-50%" };

  const captionId = `sticker-caption-${index}`;

  /* Sticker feedback: touch tap and desktop hover use the SAME treatment —
     a gentle 1.1x lift with the tilt kept intact, so the sticker never
     "snaps straight" before its caption appears. Springs are tuned for a
     quick, non-wobbly settle (transform-only -> GPU composited, 60fps). */
  const liftTransition = {
    type: "spring" as const,
    stiffness: 400,
    damping: 26,
    mass: 0.7,
  };
  const stickerVariants = {
    default: { scale: 1, transition: liftTransition },
    modal: {
      scale: 1.1,
      zIndex: 1000,
      transition: liftTransition,
    },
    dragging: {
      scale: 1.1,
      zIndex: 1000,
      transition: liftTransition,
    },
  };

  return (
    <motion.div
      ref={itemRef}
      variants={{
        hidden: {
          opacity: 0,
          scale: 0.9,
          y: 10,
        },
        shown: {
          opacity: 1,
          scale: 1,
          y: initialY,
        },
      }}
      style={{
        zIndex: isModal || isDragging || isCaptionVisible ? 1000 : undefined,
      }}
      className={cn(
        "relative shrink-0 cursor-grab rounded-xl outline-none focus-visible:ring-2 focus-visible:ring-indigo-400/70 active:cursor-grabbing",
        className,
      )}
      /* Hover lives on the wrapper (which also contains the caption), so
         moving the pointer up onto the caption keeps it open. */
      onHoverStart={onStart}
      onHoverEnd={onEnd}
      /* Keyboard access: focus shows the story, blur hides it. */
      tabIndex={0}
      aria-describedby={caption ? captionId : undefined}
      onFocus={() => setIsCaptionVisible(true)}
      onBlur={() => {
        setIsCaptionVisible(false);
        setIsModal(false);
      }}
    >
      <motion.div
        variants={stickerVariants}
        className={cn(
          "flex-shrink-1 relative h-fit min-w-[96px] will-change-transform drop-shadow-lg",
        )}
        drag={!matches}
        dragConstraints={{ left: 0, right: 0, top: 0, bottom: 0 }}
        dragTransition={{
          power: 0.1,
          bounceStiffness: 200,
        }}
        dragElastic={0.8}
        style={{
          rotate,
          x,
        }}
        animate={
          matches
            ? isModal
              ? "modal"
              : "default"
            : isDragging
              ? "dragging"
              : "default"
        }
        onTap={onOpen}
        /* The caption stays anchored at the home position, so hide it
           the moment a real drag starts — no disconnected text box. */
        onDragStart={() => setIsCaptionVisible(false)}
        onDragEnd={onEnd}
      >
        <div className="pointer-events-none select-none">{children}</div>
      </motion.div>

      <AnimatePresence>
        {caption && caption.length > 0 && isCaptionVisible && (
          <motion.div
            key="caption"
            initial={{ opacity: 0, y: -6, scale: 0.92, rotate: captionTilt }}
            animate={{ opacity: 1, y: 0, scale: 1, rotate: captionTilt }}
            exit={{
              opacity: 0,
              y: -6,
              scale: 0.95,
              rotate: captionTilt,
              transition: { duration: 0.14, ease: "easeIn" },
            }}
            /* Pop-in: springy but critically damped enough to never jitter.
               Only opacity + transforms animate -> compositor-only, 60fps. */
            transition={{
              type: "spring",
              stiffness: 480,
              damping: 32,
              mass: 0.7,
              opacity: { duration: 0.16, ease: "easeOut" },
            }}
            style={captionPos}
            /* 24px anchor gap: ~12px absorbs the sticker 1.1x lift scale,
               the rest is clean air; also acts as the hover bridge */
            className="pointer-events-auto absolute top-full z-10 pt-6"
          >
            <div
              id={captionId}
              role="tooltip"
              className="w-[200px] select-none text-balance rounded-lg border border-black/10 bg-white px-3.5 py-2.5 text-center text-[11px] leading-relaxed text-neutral-800 shadow-xl dark:border-white/15 dark:bg-neutral-900 dark:text-neutral-200"
            >
              {caption}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}

export function ScrapbookBento({ className }: { className?: string }) {
  const container = {
    hidden: { opacity: 0 },
    shown: {
      opacity: 1,
      transition: {
        delayChildren: 0,
        staggerChildren: 0.1,
      },
    },
  };

  return (
    <BentoCard
      colSpan={9}
      rowSpan={4}
      height="h-[300px]"
      showHoverGradient={false}
      hideOverflow={false}
    >
      <h2 className="mb-2 font-medium text-text-primary">Behind the handle</h2>
      <div className="absolute inset-0 overflow-hidden rounded-2xl bg-[radial-gradient(#e5e7eb_1px,transparent_2px)] [background-size:14px_14px] [mask-image:radial-gradient(ellipse_80%_70%_at_50%_50%,black_40%,transparent_100%)] dark:bg-[radial-gradient(#333_1px,transparent_2px)]"></div>
      <div
        className={cn(
          "absolute inset-x-0 top-8 bottom-5 @container",
          className,
        )}
      >
        <motion.div
          variants={container}
          initial="hidden"
          animate="shown"
          className="flex h-full w-full flex-wrap content-center items-center justify-center gap-x-5 gap-y-1 px-6 md:flex-nowrap md:gap-5 md:px-8 lg:gap-4 lg:px-8 xl:gap-6 xl:px-10"
        >
          <Sticker
            caption="One mark on everything I build — if it wears the monogram, I stand behind it."
            index={0}
          >
            <StickerArt
              svg={monogramSvg}
              className="w-[94px] md:w-[127px] lg:w-[94px] xl:w-[127px]"
              label="Holographic monogram badge sticker"
            />
          </Sticker>
          <Sticker
            caption="Home is a dark screen and a blinking cursor — most of my best ideas start at this prompt."
            index={1}
          >
            <StickerArt
              svg={terminalSvg}
              className="w-[112px] md:w-[151px] lg:w-[112px] xl:w-[151px]"
              label="Late-night terminal sticker"
            />
          </Sticker>
          <Sticker
            caption="Same handle on every platform — if you spot @harisx404 out there, it's really me. Say hi."
            index={2}
          >
            <StickerArt
              svg={nametagSvg}
              className="w-[110px] md:w-[149px] lg:w-[110px] xl:w-[149px]"
              label="Hello, my handle is @harisx404 name tag sticker"
            />
          </Sticker>
          <Sticker
            caption="Build, break, learn — then ship it. The only loop I never want to terminate."
            index={3}
          >
            <StickerArt
              svg={shipitSvg}
              className="w-[94px] md:w-[125px] lg:w-[94px] xl:w-[125px]"
              label="Ship It postage stamp sticker with rocket"
            />
          </Sticker>
        </motion.div>
      </div>
    </BentoCard>
  );
}
