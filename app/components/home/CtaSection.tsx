"use client";

import { useState } from "react";
import Link from "next/link";
import { motion, useReducedMotion } from "framer-motion";
import { ArrowRight, Check, Copy } from "lucide-react";
import { siteContent } from "@/app/data/site-content";

const { cta } = siteContent;

export function CtaSection() {
  const prefersReducedMotion = useReducedMotion();
  const [copied, setCopied] = useState(false);

  const copyEmail = async () => {
    try {
      await navigator.clipboard.writeText(cta.email);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      // Clipboard unavailable (e.g. insecure context) — fall back to mailto.
      window.location.href = `mailto:${cta.email}`;
    }
  };

  return (
    <section className="relative -mx-2 overflow-hidden px-4 pb-20 pt-6 text-center sm:-mx-3 sm:px-6 md:pb-28 md:pt-8 lg:mx-0 lg:px-4">
      {/* Single soft bloom — one confident focal glow instead of many. */}
      <div
        aria-hidden
        className="pointer-events-none absolute bottom-[-280px] left-1/2 h-[640px] w-[960px] max-w-none -translate-x-1/2 rounded-full bg-[radial-gradient(ellipse_at_center,rgba(99,102,241,0.1),rgba(139,92,246,0.06)_45%,transparent_70%)] blur-3xl dark:bg-[radial-gradient(ellipse_at_center,rgba(99,102,241,0.25),rgba(139,92,246,0.14)_45%,transparent_70%)]"
      />

      <motion.div
        initial={false}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true, margin: "-80px" }}
        transition={{ duration: 0.7, ease: "easeOut" }}
        className="relative flex flex-col items-center"
      >
        {/* Availability kicker — matches the site-wide mono kicker pattern. */}
        <p className="inline-flex items-center gap-2.5 font-mono text-xs font-medium uppercase tracking-widest text-text-secondary">
          <span aria-hidden className="relative flex h-2 w-2">
            <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-emerald-500 opacity-75 motion-reduce:animate-none" />
            <span className="relative inline-flex h-2 w-2 rounded-full bg-emerald-500" />
          </span>
          Available for opportunities
        </p>

        {/* Heading — the site's signature serif + gradient-italic style. */}
        <h2 className="mt-5 max-w-3xl font-display text-4xl font-medium leading-tight tracking-tight text-text-primary [text-wrap:balance] sm:text-5xl md:text-6xl">
          {cta.line1},
          <motion.span
            className="text-gradient-animated block italic"
            initial={false}
            whileInView={prefersReducedMotion ? undefined : { opacity: 1, y: 0 }}
            viewport={{ once: true, margin: "-60px" }}
            transition={{ duration: 0.7, ease: "easeOut", delay: 0.05 }}
          >
            {cta.line2.replace(/\s*!$/, "").toLowerCase()}.
          </motion.span>
        </h2>

        {/* Two clear actions: hire me (primary) + copy email (secondary). */}
        <div className="mt-14 flex flex-col items-center gap-3 sm:flex-row sm:gap-4">
          <Link
            href="/contact"
            className="group relative inline-flex items-center gap-3 overflow-hidden rounded-full bg-text-primary px-8 py-4 text-base font-medium text-bg-primary shadow-lg outline-none transition-all hover:shadow-[0_0_40px_-8px_rgba(139,92,246,0.5)] focus-visible:ring-2 focus-visible:ring-blue-500/60 focus-visible:ring-offset-2 focus-visible:ring-offset-bg-primary"
          >
            {/* Shine sweep on hover */}
            <span
              aria-hidden
              className="pointer-events-none absolute inset-0 -translate-x-full bg-gradient-to-r from-transparent via-white/20 to-transparent transition-transform duration-700 ease-out group-hover:translate-x-full motion-reduce:hidden dark:via-black/10"
            />
            {cta.buttonLabel}
            <span className="relative flex h-8 w-8 items-center justify-center overflow-hidden rounded-full bg-bg-primary text-text-primary">
              <ArrowRight
                aria-hidden
                className="absolute h-4 w-4 transition-transform duration-300 group-hover:translate-x-6 group-hover:opacity-0 motion-reduce:group-hover:translate-x-0 motion-reduce:group-hover:opacity-100"
              />
              <ArrowRight
                aria-hidden
                className="absolute h-4 w-4 -translate-x-6 opacity-0 transition-transform duration-300 group-hover:translate-x-0 group-hover:opacity-100 motion-reduce:hidden"
              />
            </span>
          </Link>

          <button
            type="button"
            onClick={copyEmail}
            aria-live="polite"
            className="inline-flex items-center gap-2.5 rounded-full border border-border-primary bg-white px-6 py-[21px] font-mono text-sm text-text-secondary outline-none transition-colors hover:border-text-tertiary/60 hover:text-text-primary focus-visible:ring-2 focus-visible:ring-blue-500/60 focus-visible:ring-offset-2 focus-visible:ring-offset-bg-primary dark:bg-white/[0.03] hover:dark:bg-white/[0.06]"
          >
            {copied ? (
              <>
                <Check aria-hidden className="h-4 w-4 text-emerald-500" />
                Copied!
              </>
            ) : (
              <>
                <Copy aria-hidden className="h-4 w-4" />
                {cta.email}
              </>
            )}
          </button>
        </div>

        {/* One quiet trust line. */}
        <p className="mt-8 text-sm text-text-secondary">{cta.note1}</p>
      </motion.div>
    </section>
  );
}
