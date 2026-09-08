import type { Metadata } from "next";
import Link from "next/link";
import { BlogStatePanel } from "@/app/components/blog/BlogStatePanel";
import { GridWrapper } from "@/app/components/GridWrapper";
import { PaperHeroTexture } from "@/app/components/PaperHeroTexture";
import { CtaSection } from "@/app/components/home/CtaSection";
import { fetchCredentialCollection } from "./data";
import { CredentialsCollection } from "./CredentialsCollection";

export const revalidate = 3600;

export const metadata: Metadata = {
  title: "Credentials",
  description:
    "Verified certifications earned by Muhammad Haris across web development, cybersecurity, cloud, and AI/ML.",
};

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
              Certifications and learning milestones across programming, full-stack engineering, cybersecurity, networking, and AI.
            </p>
          </header>
        </div>
      </GridWrapper>

      <section aria-labelledby="credential-collection-heading" className="mt-14 px-2 sm:px-4">
        <div className="mb-6 flex flex-col gap-3 border-y border-border-primary px-2 py-4 sm:flex-row sm:items-center sm:justify-between sm:px-4">
          <div>
            <h2 id="credential-collection-heading" className="font-mono text-xs font-medium uppercase tracking-widest text-text-secondary">Credential collection</h2>
            <p className="mt-1.5 text-sm text-text-secondary">Courses, certifications, and verifiable professional learning.</p>
          </div>
          {credentials.length > 0 && (
            <div className="flex items-center gap-2 font-mono text-[10px] uppercase tracking-widest text-text-secondary">
              <span className="rounded-full border border-border-primary px-3 py-1.5">{credentials.length} {credentials.length === 1 ? "credential" : "credentials"}</span>
              <span className="rounded-full border border-border-primary px-3 py-1.5">{categories} {categories === 1 ? "domain" : "domains"}</span>
            </div>
          )}
        </div>

        {credentials.length > 0 ? (
          <CredentialsCollection credentials={credentials} />
        ) : (
          <BlogStatePanel kicker="No credentials yet" title={<>The verified collection is being <span className="animate-gradient-x text-colorfull px-1 pb-1 italic [text-shadow:none]">prepared.</span></>} description="Verified credentials will appear here as they are published.">
            <Link href="/resume" className="inline-flex min-h-9 items-center rounded-full border border-border-primary px-5 font-mono text-[11px] uppercase tracking-widest text-text-secondary transition-colors hover:border-neutral-400/70 hover:text-text-primary active:border-neutral-400/70 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-text-primary dark:hover:border-white/25 dark:active:border-white/25">View resume</Link>
          </BlogStatePanel>
        )}
      </section>

      <div className="mt-28"><CtaSection /></div>
    </div>
  );
}
