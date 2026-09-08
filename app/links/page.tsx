import type { Metadata } from "next";
import type { ReactNode } from "react";
import Image from "next/image";
import Link from "next/link";
import {
  ArrowRight,
  ArrowUpRight,
  Award,
  FileText,
  Globe2,
  Mail,
  MapPin,
  MessageSquareText,
  ShieldCheck,
} from "lucide-react";
import { BrandGlyph } from "@/app/components/BrandGlyph";
import { GridWrapper } from "@/app/components/GridWrapper";
import { PaperHeroTexture } from "@/app/components/PaperHeroTexture";
import { CtaSection } from "@/app/components/home/CtaSection";
import { siteMetadata } from "@/app/data/siteMetadata";

export const metadata: Metadata = {
  title: "Links",
  description:
    "Find Muhammad Haris across code, cybersecurity, professional networks, credentials, and direct contact channels.",
};

type SocialLink = {
  title: string;
  detail: string;
  href?: string;
  icon: ReactNode;
  external?: boolean;
  unavailable?: boolean;
};

const linkGroups: Array<{ label: string; description: string; links: SocialLink[] }> = [
  {
    label: "Code & craft",
    description: "Projects, security practice, credentials, and professional experience.",
    links: [
      { title: "GitHub", detail: "Code, experiments, and open-source work", href: siteMetadata.github, external: true, icon: <BrandGlyph name="github" className="size-5" /> },
      { title: "TryHackMe", detail: "Cybersecurity labs and learning progress", href: "https://tryhackme.com/p/harisx404", external: true, icon: <ShieldCheck className="size-5" aria-hidden /> },
      { title: "Credly", detail: "Verified certifications and digital badges", href: siteMetadata.credly, external: true, icon: <Award className="size-5" aria-hidden /> },
      { title: "Resume", detail: "Experience, education, and technical skills", href: "/resume", icon: <FileText className="size-5" aria-hidden /> },
    ],
  },
  {
    label: "Connect",
    description: "Professional profiles and direct ways to start a conversation.",
    links: [
      { title: "LinkedIn", detail: "Professional updates and connections", href: siteMetadata.linkedin, external: true, icon: <BrandGlyph name="linkedin" className="size-5" /> },
      { title: "X / Twitter", detail: "Profile link coming soon", unavailable: true, icon: <BrandGlyph name="x" className="size-5" /> },
      { title: "Email", detail: "itsharis.tech@gmail.com", href: siteMetadata.email, icon: <Mail className="size-5" aria-hidden /> },
      { title: "Website", detail: "Projects, writing, and everything else", href: "/", icon: <Globe2 className="size-5" aria-hidden /> },
    ],
  },
];

const cardClass =
  "flex h-full min-h-[92px] items-center gap-4 rounded-2xl border border-border-primary bg-white p-3 outline-none transition-all dark:bg-white/[0.02] sm:p-4";

function CardContent({ link }: { link: SocialLink }) {
  return (
    <>
      <span className="flex size-12 shrink-0 items-center justify-center rounded-xl border border-border-primary bg-neutral-50 text-text-secondary transition-colors group-hover:border-neutral-400/70 group-hover:text-text-primary dark:bg-white/[0.04] dark:group-hover:border-white/25">
        {link.icon}
      </span>
      <span className="min-w-0 flex-1">
        <span className="flex items-center gap-2">
          <span className="truncate text-[15px] font-medium text-text-primary">{link.title}</span>
          {link.unavailable && (
            <span className="shrink-0 rounded-full border border-border-primary px-2 py-0.5 font-mono text-[9px] uppercase tracking-widest text-text-secondary">Soon</span>
          )}
        </span>
        <span className="mt-1 block line-clamp-2 text-sm leading-5 text-text-secondary">{link.detail}</span>
      </span>
      {!link.unavailable && (
        <span className="flex size-8 shrink-0 items-center justify-center rounded-lg border border-dashed border-border-primary text-text-secondary transition-colors group-hover:border-neutral-400/70 group-hover:text-text-primary group-active:border-neutral-400/70 dark:group-hover:border-white/25 dark:group-active:border-white/25">
          {link.external ? (
            <ArrowUpRight className="size-4 transition-transform duration-300 group-hover:translate-x-0.5 group-hover:-translate-y-0.5 motion-reduce:transition-none" aria-hidden />
          ) : (
            <ArrowRight className="size-4 transition-transform duration-300 group-hover:translate-x-0.5 motion-reduce:transition-none" aria-hidden />
          )}
        </span>
      )}
    </>
  );
}

function LinkCard({ link }: { link: SocialLink }) {
  if (!link.href || link.unavailable) {
    return <div className={cardClass}><CardContent link={link} /></div>;
  }

  const interactiveClass = `group ${cardClass} hover:border-neutral-400/70 active:border-neutral-400/70 hover:shadow-md focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-text-primary dark:hover:border-white/25 dark:active:border-white/25`;
  if (link.external) {
    return (
      <a href={link.href} target="_blank" rel="noopener noreferrer" className={interactiveClass}>
        <CardContent link={link} />
        <span className="sr-only">Opens in a new tab</span>
      </a>
    );
  }
  if (link.href.startsWith("mailto:")) {
    return <a href={link.href} className={interactiveClass}><CardContent link={link} /></a>;
  }
  return <Link href={link.href} className={interactiveClass}><CardContent link={link} /></Link>;
}

function LinkGroup({ group }: { group: (typeof linkGroups)[number] }) {
  const headingId = `links-${group.label.replace(/\W+/g, "-").toLowerCase()}`;
  return (
    <section aria-labelledby={headingId}>
      <div className="mb-4 flex items-end justify-between gap-4 border-b border-border-primary pb-4">
        <div>
          <h2 id={headingId} className="font-mono text-xs font-medium uppercase tracking-widest text-text-secondary">{group.label}</h2>
          <p className="mt-2 max-w-xl text-sm leading-5 text-text-secondary">{group.description}</p>
        </div>
        <span aria-hidden className="shrink-0 font-mono text-[11px] tabular-nums text-text-secondary">{String(group.links.length).padStart(2, "0")}</span>
        <span className="sr-only">{group.links.length} entries</span>
      </div>
      <ul className="grid gap-3 sm:grid-cols-2">
        {group.links.map((link) => <li key={link.title}><LinkCard link={link} /></li>)}
      </ul>
    </section>
  );
}

export default function LinksPage() {
  return (
    <div className="relative mt-14">
      <GridWrapper>
        <div className="relative px-4 xl:px-0">
          <PaperHeroTexture className="-inset-x-2 bottom-0 top-[-128px] sm:-inset-x-3 sm:top-[-144px] md:top-[-176px] lg:inset-x-0" />
          <header className="relative mx-auto max-w-3xl text-center">
            <p className="font-mono text-xs font-medium uppercase tracking-widest text-text-secondary">Connect</p>
            <h1 className="heading-glow mx-auto mt-4 max-w-xl text-balance [font-family:var(--font-instrument-serif),serif] text-[46px] font-medium leading-none tracking-tight text-text-primary md:text-[56px] md:tracking-[-1.5px]">
              One handle,{" "}
              <span className="animate-gradient-x bg-gradient-to-r from-indigo-600 via-fuchsia-600 to-pink-600 bg-clip-text px-1 pb-1 italic text-transparent [text-shadow:none] dark:from-blue-500 dark:via-violet-500 dark:to-pink-500">everywhere.</span>
            </h1>
            <p className="mx-auto mt-4 max-w-2xl text-pretty text-[15px] leading-6 text-text-secondary">
              Find my code, credentials, professional profiles, and the clearest way to start a conversation.
            </p>
          </header>
        </div>
      </GridWrapper>

      <section aria-label="Profiles and links" className="mt-14 px-2 sm:px-4">
        <div className="grid items-start gap-3 lg:grid-cols-[minmax(0,0.8fr)_minmax(0,1.7fr)]">
          <aside className="rounded-3xl border border-border-primary bg-white p-3 dark:bg-white/[0.02] lg:sticky lg:top-28">
            <div className="px-3 pb-4 pt-3 text-center sm:px-5 sm:pb-6 sm:pt-5">
              <div className="relative mx-auto size-24">
                <Image src="/harisx404.png" alt="Muhammad Haris" fill sizes="96px" className="rounded-full border border-border-primary object-cover" priority />
                <span aria-hidden className="absolute bottom-1 right-1 flex size-2.5">
                  <span className="absolute inline-flex size-full animate-ping rounded-full bg-emerald-500 opacity-75 motion-reduce:animate-none" />
                  <span className="relative inline-flex size-2.5 rounded-full bg-emerald-500 ring-2 ring-bg-primary" />
                </span>
              </div>
              <p className="mt-5 font-mono text-[11px] font-medium uppercase tracking-widest text-text-secondary">Harisx404</p>
              <h2 className="mt-2 [font-family:var(--font-instrument-serif),serif] text-[32px] font-medium leading-none tracking-tight text-text-primary">Muhammad Haris</h2>
              <p className="mx-auto mt-3 max-w-xs text-sm leading-5 text-text-secondary">Full-stack engineer working across web development, cybersecurity, and AI / ML.</p>
              <div className="mt-5 flex flex-wrap justify-center gap-2">
                {["Web", "Security", "AI / ML"].map((role) => <span key={role} className="rounded-full border border-border-primary px-2.5 py-1 font-mono text-[10px] uppercase tracking-widest text-text-secondary">{role}</span>)}
              </div>
              <div className="mt-6 space-y-3 border-t border-border-primary pt-5 text-left text-sm text-text-secondary">
                <p className="flex items-center gap-3"><MapPin className="size-4 shrink-0" aria-hidden />Pakistan, working worldwide</p>
                <p className="flex items-center gap-3"><MessageSquareText className="size-4 shrink-0" aria-hidden />Usually replies within one business day</p>
              </div>
              <Link href="/contact" className="group relative mt-6 inline-flex min-h-11 w-full items-center justify-center gap-3 overflow-hidden rounded-full bg-text-primary py-1.5 pl-6 pr-1.5 text-sm font-medium text-bg-primary shadow-lg outline-none transition-all hover:shadow-[0_0_40px_-8px_rgba(139,92,246,0.5)] focus-visible:ring-2 focus-visible:ring-text-primary focus-visible:ring-offset-2 focus-visible:ring-offset-bg-primary">
                <span aria-hidden className="pointer-events-none absolute inset-0 -translate-x-full bg-gradient-to-r from-transparent via-white/20 to-transparent transition-transform duration-700 ease-out group-hover:translate-x-full motion-reduce:hidden dark:via-black/10" />
                <span className="relative">Send a message</span>
                <span className="relative ml-auto flex size-8 items-center justify-center overflow-hidden rounded-full bg-bg-primary text-text-primary">
                  <ArrowRight className="absolute size-4 transition-transform duration-300 group-hover:translate-x-6 group-hover:opacity-0 motion-reduce:group-hover:translate-x-0 motion-reduce:group-hover:opacity-100" aria-hidden />
                  <ArrowRight className="absolute size-4 -translate-x-6 opacity-0 transition-transform duration-300 group-hover:translate-x-0 group-hover:opacity-100 motion-reduce:hidden" aria-hidden />
                </span>
              </Link>
            </div>
          </aside>

          <nav aria-label="Social and professional links" className="space-y-10 rounded-3xl border border-border-primary bg-white p-4 dark:bg-white/[0.02] sm:p-6 lg:p-8">
            {linkGroups.map((group) => <LinkGroup key={group.label} group={group} />)}
          </nav>
        </div>
      </section>

      <div className="mt-28"><CtaSection /></div>
    </div>
  );
}
