"use client";

import { useTheme } from "next-themes";
import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { Sun, Moon } from "lucide-react";

/**
 * Circular theme toggle button. Styled to match the navbar's
 * floating search circle so they sit as a pair.
 *
 * `iconClassName` / `strokeWidth` let callers scale the glyph with the button:
 * the navbar uses a size-10 button with 18px glyphs, while the Reach Out and
 * Search modals use size-[72px] buttons whose glyphs must be size-8 (32px) to
 * match their Search/Close siblings.
 */
export function ThemeToggle({
  className,
  iconClassName = "size-4.5",
  strokeWidth = 1.75,
}: {
  className?: string;
  iconClassName?: string;
  strokeWidth?: number;
}) {
  const [mounted, setMounted] = useState(false);
  const { resolvedTheme, setTheme } = useTheme();

  // Only render theme-dependent UI after mount to avoid hydration mismatch
  useEffect(() => {
    setMounted(true);
  }, []);

  const baseClasses =
    className ??
    "relative flex size-10 cursor-pointer items-center justify-center rounded-full border border-transparent text-neutral-700 transition-all duration-150 hover:text-neutral-900 active:scale-95 dark:text-white/85 dark:hover:text-white bg-white/90 shadow-[0_10px_30px_-14px_rgba(0,0,0,0.22),0_3px_8px_-4px_rgba(0,0,0,0.08)] shadow-border dark:bg-[#1c1c1c]/90 dark:shadow-none";

  // Reserve identical space pre-mount: no layout shift, no wrong icon flash
  if (!mounted) {
    return (
      <div className={baseClasses} aria-hidden="true">
        <div className={`${iconClassName} opacity-0`} />
      </div>
    );
  }

  const isDark = resolvedTheme === "dark";

  return (
    <motion.button
      type="button"
      onClick={() => setTheme(isDark ? "light" : "dark")}
      className={baseClasses}
      whileTap={{ scale: 0.92 }}
      aria-label={isDark ? "Switch to light mode" : "Switch to dark mode"}
    >
      <motion.span
        initial={false}
        animate={{ rotate: isDark ? 90 : 0, scale: isDark ? 0 : 1, opacity: isDark ? 0 : 1 }}
        transition={{ duration: 0.2 }}
        className="absolute inline-flex"
      >
        <Sun className={iconClassName} strokeWidth={strokeWidth} />
      </motion.span>
      <motion.span
        initial={false}
        animate={{ rotate: isDark ? 0 : -90, scale: isDark ? 1 : 0, opacity: isDark ? 1 : 0 }}
        transition={{ duration: 0.2 }}
        className="absolute inline-flex"
      >
        <Moon className={iconClassName} strokeWidth={strokeWidth} />
      </motion.span>
    </motion.button>
  );
}
