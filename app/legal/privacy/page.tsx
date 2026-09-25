import { GridWrapper } from "@/app/components/GridWrapper";
import { PaperHeroTexture } from "@/app/components/PaperHeroTexture";
import { CtaSection } from "@/app/components/home/CtaSection";
import type { Metadata } from "next";
import type { ReactNode } from "react";

export const revalidate = 3600;

export const metadata: Metadata = {
  title: "Privacy Policy",
  description:
    "How this personal portfolio site collects, stores, and handles your data — in plain language.",
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
  note: <Icon><path d="M17 3a2.85 2.83 0 1 1 4 4L7.5 20.5 2 22l1.5-5.5Z" /><path d="m15 5 4 4" /></Icon>,
  mail: <Icon><rect x="3" y="5" width="18" height="14" rx="2" /><path d="m3 7 9 6 9-6" /></Icon>,
  message: <Icon><path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" /></Icon>,
  chart: <Icon><path d="M3 3v18h18" /><path d="M7 15v-4M12 15V7M17 15v-6" /></Icon>,
  database: <Icon><ellipse cx="12" cy="5" rx="9" ry="3" /><path d="M3 5v14c0 1.66 4 3 9 3s9-1.34 9-3V5" /><path d="M3 12c0 1.66 4 3 9 3s9-1.34 9-3" /></Icon>,
  image: <Icon><rect x="3" y="3" width="18" height="18" rx="2" /><circle cx="9" cy="9" r="2" /><path d="m21 15-3.5-3.5L6 23" /></Icon>,
  shield: <Icon className="size-6"><path d="M12 2 4 6v6c0 5 3.5 8.5 8 10 4.5-1.5 8-5 8-10V6l-8-4Z" /><path d="m9 12 2 2 4-4" /></Icon>,
  shieldSmall: <Icon><path d="M12 2 4 6v6c0 5 3.5 8.5 8 10 4.5-1.5 8-5 8-10V6l-8-4Z" /><path d="m9 12 2 2 4-4" /></Icon>,
  clock: <Icon className="size-4"><circle cx="12" cy="12" r="9" /><path d="M12 7v5l3 3" /></Icon>,
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

function FeatureCard({ icon, tag, children }: { icon: ReactNode; tag: string; children: ReactNode }) {
  return (
    <div className="flex flex-col gap-4 rounded-2xl border border-border-primary bg-neutral-50/50 p-6 dark:bg-neutral-900/20">
      <span className="flex size-10 items-center justify-center rounded-full border border-neutral-200 bg-white text-neutral-600 dark:border-neutral-700 dark:bg-neutral-800 dark:text-neutral-300">
        {icon}
      </span>
      <div>
        <h3 className="mb-2 font-mono text-xs font-bold uppercase tracking-wider text-neutral-900 dark:text-white">{tag}</h3>
        <p className="text-sm leading-relaxed text-text-secondary">{children}</p>
      </div>
    </div>
  );
}

function ToolCard({ icon, title, children }: { icon: ReactNode; title: string; children: ReactNode }) {
  return (
    <div className="flex items-start gap-4 rounded-2xl border border-dashed border-border-primary p-4 transition-colors hover:bg-neutral-50 dark:hover:bg-neutral-900/30">
      <span className="mt-1 shrink-0 text-neutral-400">{icon}</span>
      <div>
        <h3 className="text-sm font-semibold text-neutral-900 dark:text-white">{title}</h3>
        <p className="text-sm text-text-secondary">{children}</p>
      </div>
    </div>
  );
}

/* ---------- Page ---------- */

export default function PrivacyPolicyPage() {
  return (
    <div className="relative mt-14 min-w-0">
      <GridWrapper>
        <div className="relative px-4 xl:px-0">
          <PaperHeroTexture className="-inset-x-2 bottom-0 top-[-128px] sm:-inset-x-3 sm:top-[-144px] md:top-[-176px] lg:inset-x-0" />
          <header className="relative mx-auto max-w-3xl text-center">
            <p className="font-mono text-xs font-medium uppercase tracking-widest text-text-secondary">Legal &amp; Privacy</p>
            <h1 className="heading-glow mx-auto mt-4 max-w-xl text-balance [font-family:var(--font-instrument-serif),serif] text-[46px] font-medium leading-none tracking-tight text-text-primary md:text-[56px] md:tracking-[-1.5px]">
              Your Data,{" "}
              <span className="animate-gradient-x text-colorfull px-1 pb-1 italic [text-shadow:none] motion-reduce:animate-none">Respected</span>
            </h1>
            <p className="mx-auto mt-4 max-w-2xl text-pretty text-[15px] leading-6 text-text-secondary">
              How information is handled when you use the features on this site.
            </p>
          </header>
        </div>
      </GridWrapper>

      <div className="relative mx-auto mt-14 w-full max-w-6xl space-y-10 px-2 sm:px-4 lg:px-8">
        {/* 01 — Collect */}
        <section className="grid grid-cols-1 lg:grid-cols-12">
          <SectionHeader index="01" title="Collect." subtitle="What You Share" />
          <Spacer />
          <div className="space-y-8 p-4 lg:col-span-8 lg:p-6">
            <p className="text-lg leading-relaxed text-text-secondary">
              This portfolio uses the information you choose to share and limited
              technical signals needed to operate its interactive features.
            </p>
            <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
              <FeatureCard icon={icons.note} tag="Community Wall Notes">
                If you sign in with GitHub or Google to post, the wall stores your
                account ID, note, display name, and available avatar. Your note,
                name, and avatar may appear publicly.
              </FeatureCard>
              <FeatureCard icon={icons.message} tag="Contact Messages">
                The contact form stores your name, email, subject, inquiry type,
                and message so I can respond. It also records submission and
                email-delivery details.
              </FeatureCard>
              <FeatureCard icon={icons.mail} tag="Newsletter Email">
                If you use the newsletter form, your email address is sent to
                Loops to manage the signup. Contact me if you want to ask about
                your subscription or its removal.
              </FeatureCard>
              <FeatureCard icon={icons.chart} tag="Article Reactions">
                Reacting to a post uses an identifier cookie and a reaction cookie
                to remember your choice. Request-derived signals help limit abuse.
              </FeatureCard>
            </div>
          </div>
        </section>

        <SectionDivider />

        {/* 02 — Measure */}
        <section className="grid grid-cols-1 lg:grid-cols-12">
          <SectionHeader index="02" title="Services." subtitle="Behind the Site" />
          <Spacer />
          <div className="space-y-8 p-4 lg:col-span-8 lg:p-6">
            <p className="text-lg leading-relaxed text-text-secondary">
              These services support the features above. What they receive depends
              on which parts of the site you use.
            </p>
            <div className="grid gap-4">
              <ToolCard icon={icons.database} title="Supabase">
                Stores site content and submissions and supports account sign-in.
                GitHub and Google are sign-in options for the Community Wall.
              </ToolCard>
              <ToolCard icon={icons.mail} title="Email services">
                Contact messages may be forwarded to my inbox through an email
                delivery provider. Newsletter signups are sent to Loops.
              </ToolCard>
              <ToolCard icon={icons.message} title="Google Gemini">
                If you use the AI assistant, your messages and relevant chat
                history are sent to Gemini to generate a reply. Avoid entering
                information you do not want to share with that service.
              </ToolCard>
              <ToolCard icon={icons.image} title="Images and avatars">
                Cloudinary serves some site images. If you submit a testimonial,
                the site may check Gravatar using a hash of your email address
                to find an available profile image.
              </ToolCard>
              <ToolCard icon={icons.shieldSmall} title="Abuse prevention">
                Contact, reactions, search, AI chat, and testimonial submissions
                use request-derived signals and rate limits. Some signals are
                hashed or held temporarily; reactions also use cookies.
              </ToolCard>
            </div>
          </div>
        </section>

        <SectionDivider />

        {/* 03 — Yours */}
        <section className="grid grid-cols-1 lg:grid-cols-12">
          <SectionHeader index="03" title="Choices." subtitle="Questions & Requests" />
          <Spacer />
          <div className="space-y-8 p-4 lg:col-span-8 lg:p-6">
            <p className="text-lg leading-relaxed text-text-secondary">
              Questions about information you submitted? You can contact me directly.
            </p>
            <div className="rounded-2xl border border-border-primary bg-neutral-50/50 p-8 dark:bg-neutral-900/20">
              <div className="flex items-center gap-3">
                <span className="text-neutral-600 dark:text-neutral-300">{icons.shield}</span>
                <h3 className="text-lg font-bold text-neutral-900 dark:text-white">Access &amp; Deletion Requests</h3>
              </div>
              <p className="mt-4 text-sm leading-relaxed text-text-secondary">
                Email me to request access to, correction of, or deletion of
                information you submitted. I&apos;ll review the request, confirm
                what can be changed or removed, and explain any limits that apply
                to provider systems or backups.
              </p>
              <div className="my-8 border-t border-dashed border-neutral-200 dark:border-neutral-800" />
              <div className="flex flex-wrap items-center justify-between gap-4">
                <a href="mailto:itsharis.tech@gmail.com" className="rounded-sm font-medium text-neutral-900 hover:underline focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-text-primary dark:text-white">
                  itsharis.tech@gmail.com
                </a>
                <span className="flex items-center gap-1.5 font-mono text-[10px] text-text-secondary">
                  {icons.clock}
                  Updated Sep 2026
                </span>
              </div>
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
