import { GridWrapper } from "@/app/components/GridWrapper";
import { PaperHeroTexture } from "@/app/components/PaperHeroTexture";
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
      <p className="font-display text-2xl font-bold leading-snug text-text-secondary md:text-3xl">
        {subtitle}
      </p>
    </div>
  );
}

function Spacer() {
  return <div aria-hidden="true" className="hidden border-x border-dashed border-border-primary lg:col-span-1 lg:block" />;
}

function SectionDivider() {
  return (
    <div aria-hidden="true" className="flex w-full flex-col gap-4">
      <div className="border-t border-border-primary" />
      <div className="border-t border-border-primary" />
    </div>
  );
}

/* ---------- Page ---------- */

export default function TermsOfUsePage() {
  return (
    <div className="relative mt-14 min-w-0">
      <GridWrapper>
        <div className="relative px-4 xl:px-0">
          <PaperHeroTexture className="-inset-x-2 bottom-0 top-[-128px] sm:-inset-x-3 sm:top-[-144px] md:top-[-176px] lg:inset-x-0" />
          <header className="relative mx-auto max-w-3xl text-center">
            <p className="font-mono text-xs font-medium uppercase tracking-widest text-text-secondary">Legal</p>
            <h1 className="heading-glow mx-auto mt-4 max-w-xl text-balance [font-family:var(--font-instrument-serif),serif] text-[46px] font-medium leading-none tracking-tight text-text-primary md:text-[56px] md:tracking-[-1.5px]">
              Terms{" "}
              <span className="animate-gradient-x text-colorfull px-1 pb-1 italic [text-shadow:none] motion-reduce:animate-none">of Use.</span>
            </h1>
            <p className="mx-auto mt-4 max-w-2xl text-pretty text-[15px] leading-6 text-text-secondary">
              The terms that apply when you visit, read, and contribute to this site.
            </p>
          </header>
        </div>
      </GridWrapper>

      <div className="relative mx-auto mt-14 w-full max-w-6xl space-y-10 px-2 sm:px-4 lg:px-8">
        {/* 01 — Terms */}
        <section className="grid grid-cols-1 lg:grid-cols-12">
          <SectionHeader index="01" title="Terms." subtitle="Using This Site" />
          <Spacer />
          <div className="space-y-8 p-4 lg:col-span-8 lg:p-6">
            <p className="text-lg leading-relaxed text-text-secondary">
              This personal site shares projects, writing, and ways to get in
              touch. These terms explain what to expect when you browse or use
              its interactive features.
            </p>
            <div className="flex items-center gap-4 rounded-2xl border border-border-primary bg-neutral-50/50 p-4 dark:bg-neutral-900/20">
              <span className="flex size-10 shrink-0 items-center justify-center rounded-full bg-white text-neutral-600 shadow-sm dark:bg-neutral-800 dark:text-neutral-300">
                {icons.calendar}
              </span>
              <div>
                <p className="text-sm font-semibold text-neutral-900 dark:text-white">Effective Date</p>
                <p className="font-mono text-xs text-text-secondary">
                  <time dateTime="2026-09-25">SEP 25, 2026</time> — applies to this site
                </p>
              </div>
            </div>
            <p className="text-sm leading-relaxed text-text-secondary">
              If the site or these terms change materially, this page may be
              updated. Please review it when returning.
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
              The site combines portfolio material, credited third-party work,
              and contributions from visitors. Please respect each creator&apos;s rights.
            </p>
            <div className="grid gap-6 md:grid-cols-2">
              {/* Restriction card (red) */}
              <div className="rounded-2xl border border-red-200 bg-red-50/50 p-6 dark:border-red-900/30 dark:bg-red-950/10">
                <span className="flex size-10 items-center justify-center rounded-full bg-red-100 text-red-600 dark:bg-red-900/30 dark:text-red-400">
                  {icons.ban}
                </span>
                <p className="mb-2 mt-4 font-mono text-xs font-bold uppercase tracking-wider text-neutral-900 dark:text-white">
                  Restrictions on Use
                </p>
                <p className="text-sm leading-relaxed text-text-secondary">
                  Do not present this site, its projects, or someone else&apos;s
                  contribution as your own. Do not use names, images, or projects
                  here to imply endorsement. Respect any third-party rights.
                </p>
              </div>
              {/* Permission card (green) */}
              <div className="rounded-2xl border border-green-200 bg-green-50/50 p-6 dark:border-green-900/30 dark:bg-green-950/10">
                <span className="flex size-10 items-center justify-center rounded-full bg-green-100 text-green-600 dark:bg-green-900/30 dark:text-green-400">
                  {icons.check}
                </span>
                <p className="mb-2 mt-4 font-mono text-xs font-bold uppercase tracking-wider text-neutral-900 dark:text-white">
                  Limited Use
                </p>
                <p className="text-sm leading-relaxed text-text-secondary">
                  You may share links and quote short excerpts with a visible
                  link to the source. For substantial reuse of text, code,
                  images, or design work, request permission from the relevant owner.
                </p>
              </div>
            </div>
            <p className="text-sm leading-relaxed text-text-secondary">
              Selected interface patterns reference work by{" "}
              <a href="https://aayushbharti.in" target="_blank" rel="noopener noreferrer" className="rounded-sm font-medium text-text-primary underline decoration-dotted underline-offset-4 hover:text-text-secondary focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-text-primary">
                Aayush Bharti
              </a>
              . Other third-party materials and visitor contributions remain with
              their respective owners.
            </p>
          </div>
        </section>

        <SectionDivider />

        {/* 03 — Limits */}
        <section className="grid grid-cols-1 lg:grid-cols-12">
          <SectionHeader index="03" title="Community." subtitle="Use & Responsibility" />
          <Spacer />
          <div className="space-y-8 p-4 lg:col-span-8 lg:p-6">
            <p className="text-lg leading-relaxed text-text-secondary">
              Shared content is for general information and learning. Please use
              interactive features respectfully and check examples before relying on them.
            </p>

            {/* UGC card */}
            <div className="rounded-2xl border border-border-primary bg-neutral-50/50 p-6 dark:bg-neutral-900/20">
              <div className="flex items-center gap-3">
                <span className="text-neutral-500">{icons.chat}</span>
                <h3 className="text-base font-semibold text-neutral-900 dark:text-white">User-Generated Content</h3>
              </div>
              <p className="mt-3 text-sm leading-relaxed text-text-secondary">
                Community Wall notes may appear publicly after submission;
                testimonials are reviewed before publication. You retain rights
                to your contribution and allow it to be displayed on this site.
                Inappropriate or unlawful submissions may be removed.
              </p>
              <div className="my-8 border-t border-dashed border-neutral-200 dark:border-neutral-800" />
              <div className="grid gap-6 text-sm md:grid-cols-2">
                <div>
                  <p className="mb-1.5 flex items-center gap-2 font-semibold text-neutral-900 dark:text-white">
                    {icons.shield}
                    No Warranty
                  </p>
                  <p className="leading-relaxed text-text-secondary">
                    Articles, code samples, and tools are provided &quot;as is&quot;
                    for information and learning, without a guarantee that they
                    will fit your project. Test them before use.
                  </p>
                </div>
                <div>
                  <p className="mb-1.5 flex items-center gap-2 font-semibold text-neutral-900 dark:text-white">
                    {icons.gavel}
                    Limitation of Liability
                  </p>
                  <p className="leading-relaxed text-text-secondary">
                    To the extent permitted by applicable law, I&apos;m not responsible
                    for losses resulting from your use of this site or its examples.
                  </p>
                </div>
              </div>
              <div className="my-8 border-t border-dashed border-neutral-200 dark:border-neutral-800" />
              <p className="text-sm text-text-secondary">
                Questions about these terms?{" "}
                <a href="mailto:itsharis.tech@gmail.com" className="rounded-sm font-medium text-neutral-900 hover:underline focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-text-primary dark:text-white">
                  itsharis.tech@gmail.com
                </a>
              </p>
            </div>
          </div>
        </section>
      </div>

      {/* Contact CTA */}
      <div className="mt-28">
        <CtaSection />
      </div>
    </div>
  );
}
