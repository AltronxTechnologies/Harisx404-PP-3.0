import Image from "next/image";
import Link from "next/link";
import { HeroTexture } from "@/app/components/HeroTexture";
import { CtaSection } from "@/app/components/home/CtaSection";
import { siteMetadata } from "@/app/data/siteMetadata";
import type { Metadata } from "next";
import type { ReactNode } from "react";

export const metadata: Metadata = {
  title: "Links | Social Profiles & Connect",
  description:
    "All of Muhammad Haris's important links in one place — social profiles, code platforms, and ways to get in touch.",
};

/* ---------- Icons (inline, stroke-based) ---------- */

function GitHubIcon() {
  return (
    <svg className="size-6" fill="currentColor" viewBox="0 0 24 24" aria-hidden="true">
      <path fillRule="evenodd" clipRule="evenodd" d="M12 2C6.477 2 2 6.484 2 12.017c0 4.425 2.865 8.18 6.839 9.504.5.092.682-.217.682-.483 0-.237-.008-.868-.013-1.703-2.782.605-3.369-1.343-3.369-1.343-.454-1.158-1.11-1.466-1.11-1.466-.908-.62.069-.608.069-.608 1.003.07 1.531 1.032 1.531 1.032.892 1.53 2.341 1.088 2.91.832.092-.647.35-1.088.636-1.338-2.22-.253-4.555-1.113-4.555-4.951 0-1.093.39-1.988 1.029-2.688-.103-.253-.446-1.272.098-2.65 0 0 .84-.27 2.75 1.026A9.564 9.564 0 0 1 12 6.844c.85.004 1.705.115 2.504.337 1.909-1.296 2.747-1.027 2.747-1.027.546 1.379.202 2.398.1 2.651.64.7 1.028 1.595 1.028 2.688 0 3.848-2.339 4.695-4.566 4.943.359.309.678.92.678 1.855 0 1.338-.012 2.419-.012 2.747 0 .268.18.58.688.482A10.019 10.019 0 0 0 22 12.017C22 6.484 17.522 2 12 2z" />
    </svg>
  );
}

function XIcon() {
  return (
    <svg className="size-5" fill="currentColor" viewBox="0 0 24 24" aria-hidden="true">
      <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z" />
    </svg>
  );
}

function LinkedInIcon() {
  return (
    <svg className="size-5" fill="currentColor" viewBox="0 0 24 24" aria-hidden="true">
      <path d="M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455zM5.337 7.433a2.062 2.062 0 1 1 0-4.124 2.062 2.062 0 0 1 0 4.124zM7.119 20.452H3.555V9h3.564zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0z" />
    </svg>
  );
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
      className="group relative flex items-center gap-4 rounded-xl border border-neutral-200 bg-white p-4 transition-all hover:border-neutral-300 hover:shadow-md dark:border-neutral-800 dark:bg-neutral-900/30 dark:hover:border-neutral-700 dark:hover:bg-neutral-900"
    >
      <span className="flex size-12 shrink-0 items-center justify-center rounded-lg border border-neutral-200 bg-neutral-50 text-neutral-600 transition-colors group-hover:bg-white dark:border-neutral-700 dark:bg-neutral-800 dark:text-neutral-400 dark:group-hover:bg-neutral-800">
        <span className="transition-transform duration-300 group-hover:scale-110">{link.icon}</span>
      </span>
      <span className="min-w-0 flex-1">
        <span className="block truncate text-sm font-semibold text-neutral-900 dark:text-white">{link.title}</span>
        <span className="block truncate font-mono text-[10px] text-neutral-500 dark:text-neutral-400">{link.handle}</span>
      </span>
      <ArrowUpRight className="absolute right-3 top-3 size-3 -translate-x-1 text-neutral-400 opacity-0 transition-all group-hover:translate-x-0 group-hover:opacity-100" />
    </Wrapper>
  );
}

function GroupHeader({ label }: { label: string }) {
  return (
    <div className="mb-6 flex items-center gap-4">
      <span className="font-mono text-xs font-bold uppercase tracking-wider text-neutral-400 dark:text-neutral-600">
        {label}
      </span>
      <span aria-hidden="true" className="h-px flex-1 border-t border-dashed border-neutral-200 dark:border-neutral-800" />
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

      {/* Hero */}
      <h1 className="relative z-[2] mx-auto mt-20 mb-14 max-w-xl text-balance text-center font-medium text-5xl tracking-tight [text-shadow:rgba(255,255,255,0.05)_0px_4px_8px,rgba(255,255,255,0.2)_0px_8px_30px] max-sm:px-5 md:mt-28 md:text-6xl">
        <p className="mb-4 font-mono font-normal text-black/80 text-xs uppercase tracking-widest dark:text-white/70">
          Connect
        </p>
        <span className="inline-block text-neutral-900 dark:text-white [font-family:var(--font-instrument-serif),serif]">
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
      <div className="relative mx-auto w-full max-w-6xl border-t border-dashed border-neutral-200 px-4 dark:border-neutral-800 sm:px-8 lg:px-12">
        <div className="grid grid-cols-1 lg:grid-cols-12">
          {/* Left: sticky profile card */}
          <div className="p-4 lg:sticky lg:top-32 lg:col-span-3 lg:self-start lg:p-6 lg:pl-0">
            <div className="rounded-2xl border border-neutral-200 bg-white p-6 dark:border-neutral-800 dark:bg-neutral-900">
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
              <h2 className="mt-4 text-center font-display text-2xl font-bold text-neutral-900 dark:text-white">
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
                <p className="flex items-center gap-2 text-sm text-neutral-600 dark:text-neutral-400">
                  <GlobeIcon className="size-4 shrink-0" />
                  Remote from Pakistan
                </p>
                <p className="flex items-center gap-2 text-sm text-neutral-600 dark:text-neutral-400">
                  <MailIcon className="size-4 shrink-0" />
                  <span className="truncate">itsharis.tech@gmail.com</span>
                </p>
              </div>

              <Link
                href="/contact"
                className="group mt-6 flex w-full items-center justify-center gap-1.5 rounded-lg bg-neutral-900 px-3 py-2.5 text-sm font-medium text-white transition-colors hover:bg-neutral-800 dark:bg-white dark:text-neutral-900 dark:hover:bg-neutral-200"
              >
                Book a Call
                <ArrowUpRight className="size-3.5 transition-transform group-hover:translate-x-1 group-hover:-translate-y-1" />
              </Link>

              <div className="mt-3 grid grid-cols-2 gap-3">
                <Link
                  href="/"
                  className="rounded-lg border border-neutral-200 bg-neutral-50 py-2.5 text-center text-xs font-medium text-neutral-900 transition-colors hover:bg-white dark:border-neutral-700 dark:bg-neutral-800 dark:text-white dark:hover:bg-neutral-700"
                >
                  Website
                </Link>
                <a
                  href={siteMetadata.email}
                  className="rounded-lg border border-neutral-200 bg-neutral-50 py-2.5 text-center text-xs font-medium text-neutral-900 transition-colors hover:bg-white dark:border-neutral-700 dark:bg-neutral-800 dark:text-white dark:hover:bg-neutral-700"
                >
                  Email
                </a>
              </div>
            </div>
          </div>

          {/* Middle: dashed structural spacer */}
          <div aria-hidden="true" className="hidden border-x border-dashed border-neutral-200 dark:border-neutral-800 lg:col-span-1 lg:block" />

          {/* Right: link groups */}
          <div className="space-y-12 p-4 lg:col-span-8 lg:p-6 lg:pr-0">
            {linkGroups.map((group) => (
              <section key={group.label}>
                <GroupHeader label={group.label} />
                <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                  {group.links.map((link) => (
                    <SocialLinkCard key={link.title} link={link} />
                  ))}
                </div>
              </section>
            ))}
          </div>
        </div>
      </div>

      {/* Contact CTA */}
      <div className="relative mt-16">
        <CtaSection />
      </div>
    </div>
  );
}
