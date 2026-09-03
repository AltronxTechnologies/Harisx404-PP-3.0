import { HeroTexture } from "@/app/components/HeroTexture";
import { ContactClient } from "@/app/components/contact/ContactClient";
import type { Metadata } from "next";
import type { ReactNode } from "react";

export const metadata: Metadata = {
  title: "Contact | Get in Touch - Muhammad Haris",
  description:
    "Book a call or send Muhammad Haris a message — available for full-time roles and freelance projects.",
};

/* ---------- Icons ---------- */

function Icon({ children, className = "size-4" }: { children: ReactNode; className?: string }) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.75} strokeLinecap="round" strokeLinejoin="round" className={className} aria-hidden="true">
      {children}
    </svg>
  );
}

const icons = {
  clock: <Icon><circle cx="12" cy="12" r="9" /><path d="M12 7v5l3 3" /></Icon>,
  globe: <Icon><circle cx="12" cy="12" r="9" /><path d="M3 12h18M12 3a15 15 0 0 1 0 18M12 3a15 15 0 0 0 0 18" /></Icon>,
  mail: <Icon><rect x="3" y="5" width="18" height="14" rx="2" /><path d="m3 7 9 6 9-6" /></Icon>,
  briefcase: <Icon><rect x="2" y="7" width="20" height="14" rx="2" /><path d="M16 7V5a2 2 0 0 0-2-2h-4a2 2 0 0 0-2 2v2" /></Icon>,
};

/* ---------- Page ---------- */

export default function ContactPage() {
  return (
    <div className="relative min-w-0 pb-24">
      {/* Decorative hatched side rails */}
      <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-y-0 left-0 hidden w-3 border-r border-border-primary sm:block lg:w-8 [background-image:repeating-linear-gradient(45deg,rgba(0,0,0,0.04)_0px,rgba(0,0,0,0.04)_1px,transparent_1px,transparent_7px)] dark:[background-image:repeating-linear-gradient(45deg,rgba(255,255,255,0.05)_0px,rgba(255,255,255,0.05)_1px,transparent_1px,transparent_7px)]"
      />
      <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-y-0 right-0 hidden w-3 border-l border-border-primary sm:block lg:w-8 [background-image:repeating-linear-gradient(45deg,rgba(0,0,0,0.04)_0px,rgba(0,0,0,0.04)_1px,transparent_1px,transparent_7px)] dark:[background-image:repeating-linear-gradient(45deg,rgba(255,255,255,0.05)_0px,rgba(255,255,255,0.05)_1px,transparent_1px,transparent_7px)]"
      />

      <HeroTexture />

      {/* Hero — matches the site's blueprint hero pattern */}
      <h1 className="relative z-[2] mx-auto mt-24 mb-14 max-w-xl text-balance text-center font-medium text-[46px] tracking-tight [text-shadow:rgba(255,255,255,0.05)_0px_4px_8px,rgba(255,255,255,0.2)_0px_8px_30px] max-sm:px-5 md:mt-28 md:text-6xl">
        <p className="mb-4 font-mono text-xs font-medium uppercase tracking-widest text-text-secondary">
          Get in touch
        </p>
        <span className="inline-block text-text-primary [font-family:var(--font-instrument-serif),serif]">
          Let&apos;s Build{" "}
          <span
            className="animate-gradient-x text-colorfull px-1 pb-1 italic [text-shadow:none]"
            style={{
              maskImage: "linear-gradient(to right, black 70%, transparent 100%)",
              maskSize: "200% 100%",
              maskPosition: "left center",
              maskRepeat: "no-repeat",
            }}
          >
            Together
          </span>
        </span>
      </h1>

      {/* Split layout — sticky info column + contact tabs (same skeleton as /links) */}
      <div className="relative mx-auto w-full max-w-6xl border-t border-dashed border-neutral-200 px-4 dark:border-neutral-800 sm:px-8 lg:px-12">
        <div className="grid grid-cols-1 lg:grid-cols-12">
          {/* Left: sticky availability card */}
          <div className="p-4 lg:sticky lg:top-32 lg:col-span-3 lg:self-start lg:p-6 lg:pl-0">
            <div className="rounded-2xl border border-neutral-200 bg-white p-6 dark:border-neutral-800 dark:bg-neutral-900">
              <div className="flex items-center gap-2.5">
                <span className="relative flex size-2.5 shrink-0">
                  <span className="absolute inline-flex size-full animate-ping rounded-full bg-green-400 opacity-75 motion-reduce:animate-none" />
                  <span className="relative inline-flex size-2.5 rounded-full bg-green-500" />
                </span>
                <p className="font-mono text-xs uppercase tracking-wider text-text-secondary">
                  Available for work
                </p>
              </div>
              <h2 className="mt-3 font-display text-2xl font-bold leading-snug text-neutral-900 dark:text-white">
                Open to new projects
              </h2>
              <p className="mt-2 text-sm leading-relaxed text-text-secondary">
                Full-time roles &amp; freelance — web, security, and AI/ML work, remote from anywhere.
              </p>

              <div className="mt-6 space-y-3 border-t border-dashed border-neutral-100 pt-6 dark:border-neutral-800">
                <p className="flex items-center gap-2 text-sm text-text-secondary">
                  <span className="text-neutral-400">{icons.clock}</span>
                  Replies within 24 hours
                </p>
                <p className="flex items-center gap-2 text-sm text-text-secondary">
                  <span className="text-neutral-400">{icons.globe}</span>
                  Pakistan · every timezone
                </p>
                <p className="flex items-center gap-2 text-sm text-text-secondary">
                  <span className="text-neutral-400">{icons.briefcase}</span>
                  Freelance &amp; full-time
                </p>
                <p className="flex items-center gap-2 text-sm text-text-secondary">
                  <span className="text-neutral-400">{icons.mail}</span>
                  <a href="mailto:itsharis.tech@gmail.com" className="truncate hover:underline">
                    itsharis.tech@gmail.com
                  </a>
                </p>
              </div>
            </div>
          </div>

          {/* Middle: dashed structural spacer */}
          <div aria-hidden="true" className="hidden border-x border-dashed border-neutral-200 dark:border-neutral-800 lg:col-span-1 lg:block" />

          {/* Right: contact tabs (book a call / send message) */}
          <div className="p-4 lg:col-span-8 lg:p-6 lg:pr-0">
            <ContactClient />
          </div>
        </div>
      </div>
    </div>
  );
}
