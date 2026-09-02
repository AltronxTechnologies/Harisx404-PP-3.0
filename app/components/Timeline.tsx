"use client";

import Image from "next/image";
import {
  motion,
  useMotionValue,
  useReducedMotion,
  useScroll,
  useSpring,
  useTransform,
} from "framer-motion";
import { useRef } from "react";

interface TimelineProps {
  avatarUrl: string;
}

export function Timeline({ avatarUrl }: TimelineProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const prefersReducedMotion = useReducedMotion();
  const { scrollYProgress } = useScroll({
    target: containerRef,
    offset: ["end 50%", "start 50%"],
  });

  // Critically-damped spring so the avatar glides instead of stepping with
  // each scroll tick. Transform-only (translateY/scaleY) keeps it on the
  // compositor at 60fps — no layout or paint work per frame.
  const smooth = useSpring(scrollYProgress, {
    stiffness: 120,
    damping: 28,
    mass: 0.4,
    restDelta: 0.001,
  });
  const staticProgress = useMotionValue(1);
  const progress = prefersReducedMotion ? staticProgress : smooth;

  // Avatar rides from the top of the line to its very end (36px = avatar
  // height) so it never slips past the bottom divider.
  const y = useTransform(progress, [0, 1], ["100%", "0%"]);
  // Portion of the line the avatar has already passed (above it) gets the
  // animated gradient fill; the rest stays neutral.
  const passed = useTransform(progress, (v) => 1 - v);

  return (
    <div ref={containerRef} aria-hidden className="relative h-full w-full">
      <motion.div
        className="absolute -left-0.5 z-10 flex will-change-transform"
        style={{
          top: 0,
          height: "calc(100% - 36px)",
          y,
        }}
      >
        <div className="relative h-9 w-9 overflow-hidden rounded-full border-2 border-bg-primary bg-bg-primary shadow-md">
          <Image src={avatarUrl} alt="" fill sizes="36px" className="object-cover" />
        </div>
      </motion.div>
      <div className="absolute bottom-0 left-1/2 top-0 w-2 -translate-x-1/2 overflow-hidden rounded-full bg-gray-200 shadow-[inset_0_2px_1.5px_rgba(165,174,184,0.32)] dark:bg-white/10 dark:shadow-none">
        <motion.div
          className="absolute inset-0 w-full origin-top rounded-full will-change-transform"
          style={{
            scaleY: passed,
            // Same palette as .text-gradient-animated (heading gradient),
            // laid out top-to-bottom. Because this layer scales with the
            // covered area, the full pink→purple→blue run always spans
            // exactly from the top of the line to the avatar.
            background:
              "linear-gradient(180deg, #f472b6 0%, #a78bfa 50%, #60a5fa 100%)",
          }}
        />
      </div>
    </div>
  );
}
