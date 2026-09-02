import Image from "next/image";
import Link from "next/link";
import { HeroTexture } from "@/app/components/HeroTexture";
import { CtaSection } from "@/app/components/home/CtaSection";
import { siteMetadata } from "@/app/data/siteMetadata";
import type { Metadata } from "next";
import type { ReactNode } from "react";
import { BrandGlyph } from "@/app/components/BrandGlyph";

export const metadata: Metadata = {
  title: "Links | Social Profiles & Connect",
  description:
    "All of Muhammad Haris's important links in one place — social profiles, code platforms, and ways to get in touch.",
};

/* ---------- Icons (inline, stroke-based) ---------- */

/* Brand marks come from the shared BrandGlyph. All three render at size-6 to
   match their six siblings in the same card grid - X and LinkedIn were
   previously size-5, i.e. 20px peers next to 24px peers. */
function GitHubIcon() {
  return <BrandGlyph name="github" className="size-6" />;
}

function XIcon() {
  return <BrandGlyph name="x" className="size-6" />;
}

function LinkedInIcon() {
  return <BrandGlyph name="linkedin" className="size-6" />;
}

function TryHackMeIcon() {
  return (
    <svg className="size-6" fill="none" stroke="currentColor" strokeWidth={1.75} strokeLinecap="round" strokeLinejoin="round" viewBox="0 0 24 24" aria-hidden="true">
      <path d="M12 2 4 6v6c0 5 3.5 8.5 8 10 4.5-1.5 8-5 8-10V6l-8-4Z" />
      <path d="m9 12 2 2 4-4" />
    </svg>
  );
}

function CredlyIcon() {
  return (
    <svg className="size-6" fill="none" stroke="currentColor" strokeWidth={1.75} strokeLinecap="round" strokeLinejoin="round" viewBox="0 0 24 24" aria-hidden="true">
      <circle cx="12" cy="9" r="6" />
      <path d="m8.5 13.5-2 7 5.5-3 5.5 3-2-7" />
    </svg>
  );
}

function MailIcon({ className = "size-6" }: { className?: string }) {
  return (
    <svg className={className} fill="none" stroke="currentColor" strokeWidth={1.75} strokeLinecap="round" strokeLinejoin="round" viewBox="0 0 24 24" aria-hidden="true">
      <rect x="3" y="5" width="18" height="14" rx="2" />
      <path d="m3 7 9 6 9-6" />
    </svg>
  );
}

function GlobeIcon({ className = "size-6" }: { className?: string }) {
  return (
    <svg className={className} fill="none" stroke="currentColor" strokeWidth={1.75} strokeLinecap="round" strokeLinejoin="round" viewBox="0 0 24 24" aria-hidden="true">
      <circle cx="12" cy="12" r="9" />
      <path d="M3 12h18M12 3a15 15 0 0 1 0 18M12 3a15 15 0 0 0 0 18" />
    </svg>
  );
}

function ResumeIcon() {
  return (
    <svg className="size-6" fill="none" stroke="currentColor" strokeWidth={1.75} strokeLinecap="round" strokeLinejoin="round" viewBox="0 0 24 24" aria-hidden="true">
      <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
      <path d="M14 2v6h6M9 13h6M9 17h6" />
    </svg>
  );
}

function ArrowUpRight({ className = "size-3" }: { className?: string }) {
  return (
    <svg className={className} fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" viewBox="0 0 24 24" aria-hidden="true">
      <path d="M7 17 17 7M7 7h10v10" />
    </svg>
  );
}

/* ---------- Data ---------- */

interface SocialLink {
  title: string;
  handle: string;
  href: string;
  icon: ReactNode;
}

const linkGroups: { label: string; links: SocialLink[] }[] = [
  {
    label: "Code & Craft",
    links: [
      { title: "GitHub", handle: "@harisx404", href: siteMetadata.github, icon: <GitHubIcon /> },
      { title: "TryHackMe", handle: "tryhackme.com/p/harisx404", href: "https://tryhackme.com/p/harisx404", icon: <TryHackMeIcon /> },
      { title: "Credly", handle: "credly.com/users/harisx404", href: siteMetadata.credly, icon: <CredlyIcon /> },
      { title: "Resume", handle: "harisx404 · full-stack · security · AI", href: "/resume", icon: <ResumeIcon /> },
    ],
  },
  {
    label: "Connect",
    links: [
      { title: "LinkedIn", handle: "in/harisx404", href: siteMetadata.linkedin, icon: <LinkedInIcon /> },
      { title: "X / Twitter", handle: "@harisx404", href: siteMetadata.twitter, icon: <XIcon /> },
      { title: "Email", handle: "itsharis.tech@gmail.com", href: siteMetadata.email, icon: <MailIcon /> },
      { title: "Website", handle: "harisx404.vercel.app", href: "/", icon: <GlobeIcon /> },
    ],
  },
];

/* ---------- Components ---------- */

function SocialLinkCard({ link }: { link: SocialLink }) {
  const isExternal = link.href.startsWith("http") || link.href.startsWith("mailto:");
  const Wrapper = isExternal ? "a" : Link;
  return (
    <Wrapper
      href={link.href}
      {...(isExternal ? { target: "_blank", rel: "noopener noreferrer" } : {})}
      className="group relative flex items-center gap-4 rounded-xl border border-neutral-200 bg-white p-4 shadow-sm transition-all duration-150 active:scale-[0.98] hover:border-neutral-300 hover:shadow-md dark:border-neutral-800 dark:bg-neutral-900/50 dark:hover:border-neutral-700 dark:hover:bg-neutral-900 sm:shadow-none sm:dark:bg-neutral-900/30"
    >
      <span className="flex size-10 shrink-0 items-center justify-center rounded-lg border border-neutral-200 bg-neutral-50 text-neutral-900 transition-colors group-hover:bg-white dark:border-neutral-700 dark:bg-neutral-800 dark:text-white sm:size-12 sm:text-neutral-600 sm:dark:text-neutral-400 sm:dark:group-hover:bg-neutral-800">
        <span className="transition-transform duration-300 group-hover:scale-110">{link.icon}</span>
      </span>
      <span className="min-w-0 flex-1">
        <span className="block truncate text-sm font-medium text-neutral-900 dark:text-white sm:font-semibold">{link.title}</span>
        <span className="hidden truncate font-mono text-[10px] text-text-secondary sm:block">{link.handle}</span>
      </span>
      {/* Mobile: static trailing arrow */}
      <ArrowUpRight className="ml-auto size-4 shrink-0 text-neutral-400 sm:hidden" />
      {/* Desktop: slide-in hover arrow */}
      <ArrowUpRight className="absolute right-3 top-3 hidden size-3 -translate-x-1 text-neutral-400 opacity-0 transition-all group-hover:translate-x-0 group-hover:opacity-100 sm:block" />
    </Wrapper>
  );
}

function GroupHeader({ label }: { label: string }) {
  return (
    <div className="mb-3 flex items-center justify-center gap-4 sm:mb-6 sm:justify-start">
      <span className="font-mono text-xs font-bold uppercase tracking-wider text-text-secondary">
        {label}
      </span>
      <span aria-hidden="true" className="hidden h-px flex-1 border-t border-dashed border-neutral-200 dark:border-neutral-800 sm:block" />
    </div>
  );
}

/* ---------- Page ---------- */

export default function LinksPage() {
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

      {/* Hero — hidden on mobile per reference (profile card is the mobile hero) */}
      <h1 className="relative z-[2] mx-auto mt-20 mb-14 hidden max-w-xl text-balance text-center font-medium text-5xl tracking-tight [text-shadow:rgba(255,255,255,0.05)_0px_4px_8px,rgba(255,255,255,0.2)_0px_8px_30px] max-sm:px-5 md:mt-28 md:block md:text-6xl">
        <p className="mb-4 font-mono text-xs font-medium uppercase tracking-widest text-text-secondary">
          Connect
        </p>
        <span className="inline-block text-text-primary [font-family:var(--font-instrument-serif),serif]">
          One Handle,{" "}
          <span
            className="animate-gradient-x text-colorfull px-1 pb-1 italic [text-shadow:none]"
            style={{
              maskImage: "linear-gradient(to right, black 70%, transparent 100%)",
              maskSize: "200% 100%",
              maskPosition: "left center",
              maskRepeat: "no-repeat",
            }}
          >
            Everywhere
          </span>
        </span>
      </h1>

      {/* Split layout */}
      <div className="relative mx-auto mt-24 w-full max-w-6xl border-t border-dashed border-neutral-200 px-4 max-md:border-t-0 dark:border-neutral-800 sm:px-8 md:mt-0 lg:px-12">
        <div className="grid grid-cols-1 lg:grid-cols-12">
          {/* Left: sticky profile card */}
          <div className="p-4 lg:sticky lg:top-32 lg:col-span-3 lg:self-start lg:p-6 lg:pl-0">
            <div className="rounded-2xl border border-neutral-200 bg-white p-6 shadow-sm dark:border-neutral-800 dark:bg-neutral-900 lg:shadow-none">
              <div className="relative mx-auto size-24">
                <Image
                  src={siteMetadata.avatarImage}
                  alt="Muhammad Haris"
                  width={96}
                  height={96}
                  className="size-24 rounded-full object-cover"
                />
                <span className="absolute bottom-1 right-1 flex size-2.5">
                  <span className="absolute inline-flex size-full animate-ping rounded-full bg-green-400 opacity-75 motion-reduce:animate-none" />
                  <span className="relative inline-flex size-2.5 rounded-full bg-green-500 ring-2 ring-white dark:ring-neutral-900" />
                </span>
              </div>
              <h2 className="mt-4 text-center font-display text-3xl font-bold text-neutral-900 dark:text-white lg:text-2xl">
                Muhammad Haris
              </h2>
              <div className="mt-2 flex flex-wrap items-center justify-center gap-1.5">
                {["Developer", "Security", "AI/ML"].map((role) => (
                  <span
                    key={role}
                    className="inline-flex h-5 items-center rounded-md bg-neutral-50 px-2 font-mono text-xs text-neutral-600 dark:bg-neutral-800 dark:text-neutral-400"
                  >
                    {role}
                  </span>
                ))}
              </div>

              <div className="mt-6 space-y-3 border-t border-dashed border-neutral-100 pt-6 dark:border-neutral-800">
                <p className="flex items-center gap-2 text-sm text-text-secondary">
                  <GlobeIcon className="size-4 shrink-0" />
                  Remote from Pakistan
                </p>
                <p className="flex items-center gap-2 text-sm text-text-secondary">
                  <MailIcon className="size-4 shrink-0" />
                  <span className="truncate">itsharis.tech@gmail.com</span>
                </p>
              </div>

              {/* Desktop in-card CTA */}
              <Link
                href="/contact"
                className="group mt-6 hidden w-full items-center justify-center gap-1.5 rounded-lg bg-neutral-900 px-3 py-2.5 text-sm font-medium text-white transition-colors hover:bg-neutral-800 dark:bg-white dark:text-neutral-900 dark:hover:bg-neutral-200 lg:flex"
              >
                Book a Call
                <ArrowUpRight className="size-3.5 transition-transform group-hover:translate-x-1 group-hover:-translate-y-1" />
              </Link>

              <div className="mt-6 grid grid-cols-2 gap-3 lg:mt-3">
                <a
                  href={siteMetadata.email}
                  className="rounded-lg border border-neutral-200 bg-neutral-50 py-2.5 text-center text-xs font-medium text-neutral-900 transition-colors hover:bg-white dark:border-neutral-700 dark:bg-neutral-800 dark:text-white dark:hover:bg-neutral-700"
                >
                  Email
                </a>
                <Link
                  href="/"
                  className="rounded-lg border border-neutral-200 bg-neutral-50 py-2.5 text-center text-xs font-medium text-neutral-900 transition-colors hover:bg-white dark:border-neutral-700 dark:bg-neutral-800 dark:text-white dark:hover:bg-neutral-700"
                >
                  Full Website
                </Link>
              </div>
            </div>

            {/* Mobile standalone primary CTA — reference: full-width py-6 button below card */}
            <Link
              href="/contact"
              className="group mt-4 flex w-full items-center justify-center gap-2 rounded-lg bg-neutral-900 px-4 py-6 text-base font-medium text-white shadow-md transition-all hover:bg-neutral-800 active:scale-[0.98] dark:bg-white dark:text-neutral-900 dark:hover:bg-neutral-200 lg:hidden"
            >
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.75} strokeLinecap="round" strokeLinejoin="round" className="size-4" aria-hidden="true">
                <rect x="3" y="4" width="18" height="18" rx="2" />
                <path d="M16 2v4M8 2v4M3 10h18" />
              </svg>
              Book a Call
              <ArrowUpRight className="size-4 opacity-50 transition-transform group-hover:translate-x-1 group-hover:-translate-y-1" />
            </Link>
          </div>

          {/* Middle: dashed structural spacer */}
          <div aria-hidden="true" className="hidden border-x border-dashed border-neutral-200 dark:border-neutral-800 lg:col-span-1 lg:block" />

          {/* Right: link groups */}
          <nav aria-label="Social links" className="mt-8 space-y-6 p-4 pt-0 lg:col-span-8 lg:mt-0 lg:space-y-12 lg:p-6 lg:pr-0">
            {linkGroups.map((group) => (
              <section key={group.label}>
                <GroupHeader label={group.label} />
                <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 sm:gap-4">
                  {group.links.map((link) => (
                    <SocialLinkCard key={link.title} link={link} />
                  ))}
                </div>
              </section>
            ))}
          </nav>
        </div>
      </div>

      {/* Contact CTA */}
      <div className="relative mt-16">
        <CtaSection />
      </div>
    </div>
  );
}
