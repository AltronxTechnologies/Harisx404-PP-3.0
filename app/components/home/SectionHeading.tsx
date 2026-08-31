import type { ReactNode } from "react";

/**
 * Section header matching the reference site exactly:
 * kicker (mono 12px w400 uppercase tracking-widest) + Instrument Serif
 * heading (48→60px, w500, -1.5px, leading-none, max-w-xl, text-balance,
 * white glow text-shadow). The reference renders headers statically —
 * no entry animation; only the gradient accent word animates (gradient-x).
 */
export function SectionHeading({
  kicker,
  children,
  align = "center",
  className = "",
  // Kept for backwards compatibility with existing call sites.
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
      <p className="font-mono text-xs font-normal uppercase tracking-widest text-text-secondary">
        {kicker}
      </p>
      <h2
        className={`heading-glow mt-4 max-w-xl text-balance [font-family:var(--font-instrument-serif),serif] text-5xl font-medium leading-none tracking-tight text-black dark:text-white md:text-6xl md:tracking-[-1.5px] ${
          centered ? "mx-auto" : ""
        }`}
      >
        {children}
      </h2>
    </div>
  );
}
