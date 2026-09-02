import { HeroTexture } from "@/app/components/HeroTexture";
import { CtaSection } from "@/app/components/home/CtaSection";
import type { Metadata } from "next";
import type { ReactNode } from "react";

export const revalidate = 3600;

export const metadata: Metadata = {
  title: "Terms of Use",
  description:
    "The ground rules for using this personal portfolio site — plain-language terms, rights, and limits.",
};

/* ---------- Icons ---------- */

function Icon({ children, className = "size-5" }: { children: ReactNode; className?: string }) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.75} strokeLinecap="round" strokeLinejoin="round" className={className} aria-hidden="true">
      {children}
    </svg>
  );
}

const icons = {
  calendar: <Icon><rect x="3" y="4" width="18" height="18" rx="2" /><path d="M16 2v4M8 2v4M3 10h18" /></Icon>,
  ban: <Icon><circle cx="12" cy="12" r="9" /><path d="m5.5 5.5 13 13" /></Icon>,
  check: <Icon><path d="M20 6 9 17l-5-5" /></Icon>,
  chat: <Icon><path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" /></Icon>,
  shield: <Icon className="size-4"><path d="M12 2 4 6v6c0 5 3.5 8.5 8 10 4.5-1.5 8-5 8-10V6l-8-4Z" /></Icon>,
  gavel: <Icon className="size-4"><path d="m14 13-8.5 8.5a2.12 2.12 0 1 1-3-3L11 10" /><path d="m16 16 6-6M8 8l6-6M9 7l8 8M21 11l-8-8" /></Icon>,
};

/* ---------- Building blocks ---------- */

function SectionHeader({ index, title, subtitle }: { index: string; title: string; subtitle: string }) {
  return (
    <div className="p-4 lg:sticky lg:top-32 lg:col-span-3 lg:self-start lg:p-6">
      <p className="font-mono text-xs font-bold text-text-secondary">{index}</p>
      <h2 className="mt-1 font-display text-2xl font-bold leading-snug text-neutral-900 dark:text-neutral-100 md:text-3xl">
        {title}
      </h2>
      <p className="font-display text-2xl font-bold leading-snug text-neutral-400 dark:text-[#777B84] md:text-3xl">
        {subtitle}
      </p>
    </div>
  );
}

function Spacer() {
  return <div aria-hidden="true" className="hidden border-x border-dashed border-neutral-200 dark:border-neutral-800 lg:col-span-1 lg:block" />;
}

function SectionDivider() {
  return (
    <div aria-hidden="true" className="flex w-full flex-col gap-4">
      <div className="border-t border-neutral-200 dark:border-neutral-800" />
      <div className="border-t border-neutral-200 dark:border-neutral-800" />
    </div>
  );
}

/* ---------- Page ---------- */

export default function TermsOfUsePage() {
  return (
    <div className="relative min-w-0 pb-24">
      {/* Hatched side rails */}
      <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-y-0 left-0 hidden w-3 border-r border-border-primary sm:block lg:w-8 [background-image:repeating-linear-gradient(45deg,rgba(0,0,0,0.04)_0px,rgba(0,0,0,0.04)_1px,transparent_1px,transparent_7px)] dark:[background-image:repeating-linear-gradient(45deg,rgba(255,255,255,0.05)_0px,rgba(255,255,255,0.05)_1px,transparent_1px,transparent_7px)]"
      />
      <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-y-0 right-0 hidden w-3 border-l border-border-primary sm:block lg:w-8 [background-image:repeating-linear-gradient(45deg,rgba(0,0,0,0.04)_0px,rgba(0,0,0,0.04)_1px,transparent_1px,transparent_7px)] dark:[background-image:repeating-linear-gradient(45deg,rgba(255,255,255,0.05)_0px,rgba(255,255,255,0.05)_1px,transparent_1px,transparent_7px)]"
      />

      <HeroTexture />

      {/* Hero */}
      <h1 className="relative z-[2] mx-auto mt-24 mb-14 max-w-xl text-balance text-center font-medium text-5xl tracking-tight [text-shadow:rgba(255,255,255,0.05)_0px_4px_8px,rgba(255,255,255,0.2)_0px_8px_30px] max-sm:px-5 md:mt-28 md:text-6xl">
        <p className="mb-4 font-mono text-xs font-medium uppercase tracking-widest text-text-secondary">
          Legal &amp; Policy
        </p>
        <span className="inline-block text-text-primary [font-family:var(--font-instrument-serif),serif]">
          Simple Terms,{" "}
          <span
            className="animate-gradient-x text-colorfull px-1 pb-1 italic [text-shadow:none]"
            style={{
              maskImage: "linear-gradient(to right, black 70%, transparent 100%)",
              maskSize: "200% 100%",
              maskPosition: "left center",
              maskRepeat: "no-repeat",
            }}
          >
            Fairly
          </span>
        </span>
      </h1>

      <div className="relative mx-auto w-full max-w-6xl space-y-10 px-4 sm:px-8 lg:px-12">
        {/* 01 — Terms */}
        <section className="grid grid-cols-1 lg:grid-cols-12">
          <SectionHeader index="01" title="Terms." subtitle="The Agreement" />
          <Spacer />
          <div className="space-y-8 p-4 lg:col-span-8 lg:p-6">
            <p className="text-lg leading-relaxed text-text-secondary">
              By browsing this site you agree to these terms. They exist to keep things fair for
              both of us — written in plain language, no legalese required.
            </p>
            <div className="flex items-center gap-4 rounded-xl border border-neutral-200 bg-neutral-50/50 p-4 dark:border-neutral-800 dark:bg-neutral-900/20">
              <span className="flex size-10 shrink-0 items-center justify-center rounded-full bg-white text-neutral-600 shadow-sm dark:bg-neutral-800 dark:text-neutral-300">
                {icons.calendar}
              </span>
              <div>
                <p className="text-sm font-semibold text-neutral-900 dark:text-white">Effective Date</p>
                <p className="font-mono text-xs text-text-secondary">
                  <time dateTime="2026-08-01">AUG 01, 2026</time> — applies to every page on this site
                </p>
              </div>
            </div>
            <p className="text-sm leading-relaxed text-text-secondary">
              These terms may be updated as the site evolves. Meaningful changes will be reflected
              in the effective date above; continued use of the site means you accept the current
              version.
            </p>
          </div>
        </section>

        <SectionDivider />

        {/* 02 — Rights */}
        <section className="grid grid-cols-1 lg:grid-cols-12">
          <SectionHeader index="02" title="Rights." subtitle="Use & Reuse" />
          <Spacer />
          <div className="space-y-8 p-4 lg:col-span-8 lg:p-6">
            <p className="text-lg leading-relaxed text-text-secondary">
              Content and code on this site are my original work unless credited otherwise.
              Here&apos;s exactly what you can and can&apos;t do with them.
            </p>
            <div className="grid gap-6 md:grid-cols-2">
              {/* Restriction card (red) */}
              <div className="rounded-xl border border-red-200 bg-red-50/50 p-6 dark:border-red-900/30 dark:bg-red-950/10">
                <span className="flex size-10 items-center justify-center rounded-full bg-red-100 text-red-600 dark:bg-red-900/30 dark:text-red-400">
                  {icons.ban}
                </span>
                <p className="mb-2 mt-4 font-mono text-xs font-bold uppercase tracking-wider text-neutral-900 dark:text-white">
                  Restrictions on Use
                </p>
                <p className="text-sm leading-relaxed text-text-secondary">
                  The site&apos;s codebase, design, and written content are proprietary. Don&apos;t
                  republish articles wholesale, clone the design as your own, or use my name,
                  photos, or projects to imply endorsement.
                </p>
              </div>
              {/* Permission card (green) */}
              <div className="rounded-xl border border-green-200 bg-green-50/50 p-6 dark:border-green-900/30 dark:bg-green-950/10">
                <span className="flex size-10 items-center justify-center rounded-full bg-green-100 text-green-600 dark:bg-green-900/30 dark:text-green-400">
                  {icons.check}
                </span>
                <p className="mb-2 mt-4 font-mono text-xs font-bold uppercase tracking-wider text-neutral-900 dark:text-white">
                  Limited Use
                </p>
                <p className="text-sm leading-relaxed text-text-secondary">
                  You may quote short excerpts, share links, and reference code snippets from
                  articles in your own work — with a visible link back to the original page as
                  attribution.
                </p>
              </div>
            </div>
          </div>
        </section>

        <SectionDivider />

        {/* 03 — Limits */}
        <section className="grid grid-cols-1 lg:grid-cols-12">
          <SectionHeader index="03" title="Limits." subtitle="Of Liability" />
          <Spacer />
          <div className="space-y-8 p-4 lg:col-span-8 lg:p-6">
            <p className="text-lg leading-relaxed text-text-secondary">
              This is a personal site, shared in good faith. A few sensible limits apply.
            </p>

            {/* UGC card */}
            <div className="rounded-xl border border-neutral-200 bg-neutral-50/50 p-6 dark:border-neutral-800 dark:bg-neutral-900/20">
              <div className="flex items-center gap-3">
                <span className="text-neutral-500">{icons.chat}</span>
                <h3 className="text-base font-semibold text-neutral-900 dark:text-white">User-Generated Content</h3>
              </div>
              <p className="mt-3 text-sm leading-relaxed text-text-secondary">
                Notes on the community wall and testimonial submissions remain your words, but by
                posting you grant permission to display them here. Spam, abuse, or anything illegal
                will be removed without notice — moderation decisions are final.
              </p>
              <div className="my-8 border-t border-dashed border-neutral-200 dark:border-neutral-800" />
              <div className="grid gap-6 text-sm md:grid-cols-2">
                <div>
                  <p className="mb-1.5 flex items-center gap-2 font-semibold text-neutral-900 dark:text-white">
                    {icons.shield}
                    No Warranty
                  </p>
                  <p className="leading-relaxed text-text-secondary">
                    Everything here — articles, code snippets, tools — is provided &quot;as is&quot;
                    without warranties of any kind. Test before you ship.
                  </p>
                </div>
                <div>
                  <p className="mb-1.5 flex items-center gap-2 font-semibold text-neutral-900 dark:text-white">
                    {icons.gavel}
                    Limitation of Liability
                  </p>
                  <p className="leading-relaxed text-text-secondary">
                    I&apos;m not liable for damages arising from your use of this site or anything
                    you build with what you learn here.
                  </p>
                </div>
              </div>
              <div className="my-8 border-t border-dashed border-neutral-200 dark:border-neutral-800" />
              <p className="text-sm text-text-secondary">
                Questions about these terms?{" "}
                <a href="mailto:itsharis.tech@gmail.com" className="font-medium text-neutral-900 hover:underline dark:text-white">
                  itsharis.tech@gmail.com
                </a>
              </p>
            </div>
          </div>
        </section>
      </div>

      {/* Contact CTA */}
      <div className="relative mt-16">
        <CtaSection />
      </div>
    </div>
  );
}
