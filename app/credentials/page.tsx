import type { Metadata } from "next";
import { HeroTexture } from "@/app/components/HeroTexture";
import { CtaSection } from "@/app/components/home/CtaSection";
import { fetchCertifications, type CertificationRow } from "@/app/lib/utils";
import type { ReactNode } from "react";

export const revalidate = 3600; // Cache for 1 hour, revalidated on demand via admin panel

export const metadata: Metadata = {
  title: "Credentials",
  description:
    "Licenses and certifications earned by Muhammad Haris across web development, cybersecurity, and AI/ML.",
};

const fallbackCertifications: CertificationRow[] = [
  {
    title: "Certified Ethical Hacking Fundamentals",
    issuer: "Placeholder Academy",
    issue_date: "2024",
    credential_url: null,
  },
  {
    title: "Cloud Practitioner Essentials",
    issuer: "Placeholder Cloud",
    issue_date: "2023",
    credential_url: null,
  },
];

function Icon({ children, className = "size-5" }: { children: ReactNode; className?: string }) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.75} strokeLinecap="round" strokeLinejoin="round" className={className} aria-hidden="true">
      {children}
    </svg>
  );
}

const badgeIcon = (
  <Icon>
    <circle cx="12" cy="9" r="6" />
    <path d="m8.5 13.5-2 7 5.5-3 5.5 3-2-7" />
  </Icon>
);

const arrowUpRight = (
  <Icon className="size-3">
    <path d="M7 17 17 7M7 7h10v10" />
  </Icon>
);

export default async function CredentialsPage() {
  const dbCertifications = await fetchCertifications();
  const certifications: CertificationRow[] =
    dbCertifications.length > 0 ? dbCertifications : fallbackCertifications;

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
      <h1 className="relative z-[2] mx-auto mt-24 mb-14 max-w-xl text-balance text-center font-medium text-5xl tracking-tight [text-shadow:rgba(255,255,255,0.05)_0px_4px_8px,rgba(255,255,255,0.2)_0px_8px_30px] max-sm:px-5 md:mt-28 md:text-6xl">
        <p className="mb-4 font-mono text-xs font-medium uppercase tracking-widest text-text-secondary">
          Credentials
        </p>
        <span className="inline-block text-text-primary [font-family:var(--font-instrument-serif),serif]">
          Proof,{" "}
          <span
            className="animate-gradient-x text-colorfull px-1 pb-1 italic [text-shadow:none]"
            style={{
              maskImage: "linear-gradient(to right, black 70%, transparent 100%)",
              maskSize: "200% 100%",
              maskPosition: "left center",
              maskRepeat: "no-repeat",
            }}
          >
            Verified
          </span>
        </span>
      </h1>

      {/* Split section — sticky header + certification cards */}
      <div className="relative mx-auto w-full max-w-6xl border-t border-dashed border-neutral-200 px-4 dark:border-neutral-800 sm:px-8 lg:px-12">
        <div className="grid grid-cols-1 lg:grid-cols-12">
          <div className="p-4 lg:sticky lg:top-32 lg:col-span-3 lg:self-start lg:p-6 lg:pl-0">
            <p className="font-mono text-xs font-bold text-text-secondary">01</p>
            <h2 className="mt-1 font-display text-2xl font-bold leading-snug text-neutral-900 dark:text-neutral-100 md:text-3xl">
              Certs.
            </h2>
            <p className="font-display text-2xl font-bold leading-snug text-neutral-400 dark:text-[#777B84] md:text-3xl">
              Earned, Not Given
            </p>
            <p className="mt-3 max-w-[26ch] text-[13px] leading-[1.6] text-text-secondary">
              Licenses and certifications across web development, cybersecurity, and AI/ML — every
              one independently verifiable.
            </p>
            <a
              href="https://www.credly.com/users/harisx404"
              target="_blank"
              rel="noopener noreferrer"
              className="mt-4 inline-flex items-center gap-1.5 rounded-full border border-border-primary bg-black/5 px-3 py-1 font-mono text-[10px] text-neutral-600 transition-colors hover:bg-black/10 dark:bg-neutral-900 dark:text-neutral-400 dark:hover:bg-neutral-800"
            >
              credly.com/users/harisx404
              {arrowUpRight}
            </a>
          </div>

          <div aria-hidden="true" className="hidden border-x border-dashed border-neutral-200 dark:border-neutral-800 lg:col-span-1 lg:block" />

          <div className="p-4 lg:col-span-8 lg:p-6 lg:pr-0">
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              {certifications.map((cert, i) => {
                const inner = (
                  <>
                    <span className="flex size-12 shrink-0 items-center justify-center rounded-lg border border-neutral-200 bg-neutral-50 text-neutral-600 transition-colors group-hover:bg-white dark:border-neutral-700 dark:bg-neutral-800 dark:text-neutral-400 dark:group-hover:bg-neutral-800">
                      <span className="transition-transform duration-300 group-hover:scale-110">{badgeIcon}</span>
                    </span>
                    <span className="min-w-0 flex-1">
                      <span className="block text-sm font-semibold leading-snug text-neutral-900 dark:text-white">
                        {cert.title}
                      </span>
                      <span className="mt-0.5 block truncate font-mono text-[10px] text-text-secondary">
                        {cert.issuer}
                        {cert.issue_date ? ` · ${cert.issue_date}` : ""}
                      </span>
                    </span>
                  </>
                );
                const cardClass =
                  "group relative flex items-center gap-4 rounded-xl border border-neutral-200 bg-white p-4 transition-all hover:border-neutral-300 hover:shadow-md dark:border-neutral-800 dark:bg-neutral-900/30 dark:hover:border-neutral-700 dark:hover:bg-neutral-900";
                return cert.credential_url ? (
                  <a
                    key={`${cert.title}-${i}`}
                    href={cert.credential_url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className={cardClass}
                  >
                    {inner}
                    <span className="absolute right-3 top-3 -translate-x-1 text-neutral-400 opacity-0 transition-all group-hover:translate-x-0 group-hover:opacity-100">
                      {arrowUpRight}
                    </span>
                  </a>
                ) : (
                  <div key={`${cert.title}-${i}`} className={cardClass}>
                    {inner}
                  </div>
                );
              })}
            </div>
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
