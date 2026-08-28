"use client";

import { isValidElement, type ReactNode } from "react";
import { motion, useReducedMotion } from "framer-motion";

/**
 * Scroll reveal for the gradient/accent part of a section heading.
 * Preserves the original span's classes (block, gradients, italic, …) by
 * re-rendering it as a motion.span — the plain text around it stays static.
 */
function GradientReveal({
  className,
  children,
}: {
  className?: string;
  children: ReactNode;
}) {
  const reduced = useReducedMotion();
  if (reduced) return <span className={className}>{children}</span>;
  return (
    <motion.span
      className={className}
      initial={{ opacity: 0, y: 14 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: "-60px" }}
      transition={{ duration: 0.7, ease: "easeOut", delay: 0.05 }}
    >
      {children}
    </motion.span>
  );
}

function revealElements(children: ReactNode): ReactNode {
  const wrap = (part: ReactNode, key?: number) => {
    if (
      isValidElement<{ className?: string; children?: ReactNode }>(part) &&
      part.type === "span"
    ) {
      return (
        <GradientReveal key={key} className={part.props.className}>
          {part.props.children}
        </GradientReveal>
      );
    }
    return part;
  };
  if (Array.isArray(children)) return children.map((p, i) => wrap(p, i));
  return wrap(children);
}

export function SectionHeading({
  kicker,
  children,
  align = "center",
  className = "",
  // Kept for backwards compatibility with existing call sites; the plain
  // text is now always static and only the gradient span animates.
  animateWords: _animateWords = false,
}: {
  kicker: string;
  children: ReactNode;
  align?: "center" | "left";
  className?: string;
  animateWords?: boolean;
}) {
  const centered = align === "center";
  return (
    <div className={`${centered ? "text-center" : "text-left"} ${className}`}>
      <p className="font-mono text-xs font-medium uppercase tracking-[0.35em] text-text-tertiary dark:text-neutral-400">
        {kicker}
      </p>
      <h2
        className={`heading-glow mt-4 font-display text-4xl font-medium leading-[1.05] text-text-primary md:text-[56px] ${
          centered ? "mx-auto" : ""
        }`}
      >
        {revealElements(children)}
      </h2>
    </div>
  );
}
