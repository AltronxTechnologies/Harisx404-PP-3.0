import type { Metadata } from "next";
import Link from "next/link";
import { ArrowUpRight, Award, CalendarDays, ShieldCheck } from "lucide-react";
import { BlogStatePanel } from "@/app/components/blog/BlogStatePanel";
import { GridWrapper } from "@/app/components/GridWrapper";
import { PaperHeroTexture } from "@/app/components/PaperHeroTexture";
import { CtaSection } from "@/app/components/home/CtaSection";
import type { CertificationRow } from "@/app/lib/utils";
import { fetchCredentialCollection } from "./data";
import { CredentialImage } from "./CredentialImage";

export const revalidate = 3600;

export const metadata: Metadata = {
  title: "Credentials",
  description:
    "Verified certifications earned by Muhammad Haris across web development, cybersecurity, cloud, and AI/ML.",
};

function formatCredentialDate(value: string) {
  if (!value) return "Date unavailable";
  const date = new Date(value.length === 4 ? `${value}-01-01T00:00:00Z` : value);
  if (Number.isNaN(date.getTime())) return value;
  return new Intl.DateTimeFormat("en-US", {
    month: value.length === 4 ? undefined : "short",
    year: "numeric",
    timeZone: "UTC",
  }).format(date);
}

function CredentialCard({ credential, index }: { credential: CertificationRow; index: number }) {
  const issued = formatCredentialDate(credential.issue_date);
  const expires = credential.does_not_expire
    ? "No expiration"
    : credential.expiration_date
      ? formatCredentialDate(credential.expiration_date)
      : "Expiration unavailable";
  const issuerInitial = credential.issuer.trim().charAt(0).toUpperCase() || "C";

  return (
    <article className="flex h-full flex-col rounded-3xl border border-border-primary bg-white p-3 dark:bg-white/[0.02]">
      <div className="relative aspect-[16/9] overflow-hidden rounded-2xl border border-border-primary bg-neutral-50 dark:bg-white/[0.03]">
        <div aria-hidden className="absolute inset-0 bg-[radial-gradient(circle_at_20%_20%,rgba(99,102,241,0.10),transparent_38%),radial-gradient(circle_at_80%_80%,rgba(217,70,239,0.08),transparent_40%)] dark:bg-[radial-gradient(circle_at_20%_20%,rgba(99,102,241,0.18),transparent_38%),radial-gradient(circle_at_80%_80%,rgba(217,70,239,0.12),transparent_40%)]" />
        <span className="absolute left-3 top-3 rounded-full border border-border-primary bg-bg-primary/85 px-3 py-1 font-mono text-[10px] uppercase tracking-widest text-text-secondary backdrop-blur-sm">
          {credential.category}
        </span>
        <span className="absolute right-3 top-3 font-mono text-[10px] tabular-nums text-text-secondary">
          {String(index + 1).padStart(2, "0")}
        </span>
        <div className="absolute inset-0 flex items-center justify-center p-10">
          <span className="relative flex size-24 items-center justify-center rounded-[28px] border border-border-primary bg-white text-4xl font-medium text-text-primary shadow-lg dark:bg-[#151518]">
            {issuerInitial}
            <CredentialImage src={credential.badge_image_url || credential.issuer_logo_url} className="absolute inset-3 size-[calc(100%-1.5rem)] object-contain" />
          </span>
        </div>
        {credential.is_demo && (
          <span className="absolute bottom-3 left-3 rounded-full border border-amber-500/30 bg-amber-500/10 px-2.5 py-1 font-mono text-[9px] uppercase tracking-widest text-amber-700 dark:text-amber-300">
            Demo record
          </span>
        )}
        <span className="absolute bottom-3 right-3 inline-flex items-center gap-1.5 rounded-full border border-emerald-500/25 bg-emerald-500/10 px-2.5 py-1 font-mono text-[9px] uppercase tracking-widest text-emerald-700 dark:text-emerald-300">
          <ShieldCheck className="size-3" aria-hidden />
          {credential.credential_url ? "Verifiable" : "Recorded"}
        </span>
      </div>

      <div className="flex flex-1 flex-col px-2 pb-3 pt-5 sm:px-3">
        <div className="flex items-center gap-3">
          <span className="relative flex size-10 shrink-0 items-center justify-center overflow-hidden rounded-xl border border-border-primary bg-neutral-50 text-sm font-medium text-text-secondary dark:bg-white/[0.04]">
            {issuerInitial}
            <CredentialImage src={credential.issuer_logo_url} className="absolute inset-2 size-[calc(100%-1rem)] object-contain" />
          </span>
          <div className="min-w-0">
            <p className="font-mono text-[10px] uppercase tracking-widest text-text-secondary">Issued by</p>
            <p className="mt-1 truncate text-sm font-medium text-text-primary" title={credential.issuer}>{credential.issuer}</p>
          </div>
        </div>

        <h2 className="mt-5 line-clamp-2 text-balance [font-family:var(--font-instrument-serif),serif] text-2xl font-medium leading-7 text-text-primary">
          {credential.title}
        </h2>
        <p className="mt-2 line-clamp-3 min-h-[66px] text-[15px] leading-[22px] text-text-secondary">
          {credential.description || "Credential details are managed through the portfolio administration panel."}
        </p>

        <dl className="mt-5 grid grid-cols-2 gap-3 border-y border-border-primary py-4 text-sm">
          <div>
            <dt className="flex items-center gap-1.5 font-mono text-[9px] uppercase tracking-widest text-text-secondary"><CalendarDays className="size-3" aria-hidden />Issued</dt>
            <dd className="mt-1.5 text-text-primary">{issued}</dd>
          </div>
          <div>
            <dt className="flex items-center gap-1.5 font-mono text-[9px] uppercase tracking-widest text-text-secondary"><Award className="size-3" aria-hidden />Validity</dt>
            <dd className="mt-1.5 text-text-primary">{expires}</dd>
          </div>
        </dl>

        {credential.skills.length > 0 && (
          <div className="mt-4 flex max-h-[68px] flex-wrap gap-2 overflow-hidden">
            {credential.skills.slice(0, 6).map((skill) => (
              <span key={skill} className="rounded-full border border-border-primary px-2.5 py-1 font-mono text-[9px] uppercase tracking-widest text-text-secondary">{skill}</span>
            ))}
            {credential.skills.length > 6 && (
              <span className="rounded-full border border-dashed border-border-primary px-2.5 py-1 font-mono text-[9px] uppercase tracking-widest text-text-secondary">+{credential.skills.length - 6}</span>
            )}
          </div>
        )}

        <div className="mt-auto flex min-h-10 items-end justify-between gap-3 pt-5">
          <div className="min-w-0">
            {credential.credential_id && (
              <p className="truncate font-mono text-[10px] text-text-secondary" title={credential.credential_id}>ID: {credential.credential_id}</p>
            )}
          </div>
          {credential.credential_url ? (
            <a href={credential.credential_url} target="_blank" rel="noopener noreferrer" className="group inline-flex min-h-11 shrink-0 items-center gap-2 rounded-full border border-border-primary px-4 font-mono text-[10px] uppercase tracking-widest text-text-secondary transition-colors hover:border-neutral-400/70 hover:text-text-primary active:border-neutral-400/70 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-text-primary dark:hover:border-white/25 dark:active:border-white/25">
              Verify
              <ArrowUpRight className="size-3.5 transition-transform group-hover:translate-x-0.5 group-hover:-translate-y-0.5 motion-reduce:transition-none" aria-hidden />
              <span className="sr-only">{credential.title} (opens in a new tab)</span>
            </a>
          ) : (
            <span className="font-mono text-[9px] uppercase tracking-widest text-text-secondary">Verification unavailable</span>
          )}
        </div>
      </div>
    </article>
  );
}

export default async function CredentialsPage() {
  const credentials = await fetchCredentialCollection();
  const categories = new Set(credentials.map((credential) => credential.category)).size;

  return (
    <div className="relative mt-14">
      <GridWrapper>
        <div className="relative px-4 xl:px-0">
          <PaperHeroTexture className="-inset-x-2 bottom-0 top-[-128px] sm:-inset-x-3 sm:top-[-144px] md:top-[-176px] lg:inset-x-0" />
          <header className="relative mx-auto max-w-3xl text-center">
            <p className="font-mono text-xs font-medium uppercase tracking-widest text-text-secondary">Credentials</p>
            <h1 className="heading-glow mx-auto mt-4 max-w-xl text-balance [font-family:var(--font-instrument-serif),serif] text-[46px] font-medium leading-none tracking-tight text-text-primary md:text-[56px] md:tracking-[-1.5px]">
              Evidence behind the <span className="animate-gradient-x text-colorfull px-1 pb-1 italic [text-shadow:none]">expertise.</span>
            </h1>
            <p className="mx-auto mt-4 max-w-2xl text-pretty text-[15px] leading-6 text-text-secondary">
              Certifications, validated skills, and professional learning milestones managed directly through this portfolio.
            </p>
          </header>
        </div>
      </GridWrapper>

      <section aria-labelledby="credential-collection-heading" className="mt-14 px-2 sm:px-4">
        <div className="mb-6 flex flex-col gap-3 border-y border-border-primary px-2 py-4 sm:flex-row sm:items-center sm:justify-between sm:px-4">
          <div>
            <h2 id="credential-collection-heading" className="font-mono text-xs font-medium uppercase tracking-widest text-text-secondary">Credential collection</h2>
            <p className="mt-1.5 text-sm text-text-secondary">Published and maintained from the administration panel.</p>
          </div>
          {credentials.length > 0 && (
            <div className="flex items-center gap-2 font-mono text-[10px] uppercase tracking-widest text-text-secondary">
              <span className="rounded-full border border-border-primary px-3 py-1.5">{credentials.length} {credentials.length === 1 ? "credential" : "credentials"}</span>
              <span className="rounded-full border border-border-primary px-3 py-1.5">{categories} {categories === 1 ? "domain" : "domains"}</span>
            </div>
          )}
        </div>

        {credentials.length > 0 ? (
          <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-3">
            {credentials.map((credential, index) => <CredentialCard key={credential.id} credential={credential} index={index} />)}
          </div>
        ) : (
          <BlogStatePanel
            kicker="No credentials yet"
            title={<>The verified collection is being <span className="animate-gradient-x text-colorfull px-1 pb-1 italic [text-shadow:none]">prepared.</span></>}
            description="Published credentials will appear here as soon as they are added through the administration panel."
          >
            <Link href="/resume" className="inline-flex min-h-9 items-center rounded-full border border-border-primary px-5 font-mono text-[11px] uppercase tracking-widest text-text-secondary transition-colors hover:border-neutral-400/70 hover:text-text-primary active:border-neutral-400/70 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-text-primary dark:hover:border-white/25 dark:active:border-white/25">View resume</Link>
          </BlogStatePanel>
        )}
      </section>

      <div className="mt-28"><CtaSection /></div>
    </div>
  );
}
