import type { Metadata } from "next";
import { GridWrapper } from "@/app/components/GridWrapper";
import { SectionHeading } from "@/app/components/home/SectionHeading";
import { CtaSection } from "@/app/components/home/CtaSection";
import {
  fetchCertifications,
  type CertificationRow,
} from "@/app/lib/utils";

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

export default async function CredentialsPage() {
  const dbCertifications = await fetchCertifications();
  const certifications: CertificationRow[] =
    dbCertifications.length > 0 ? dbCertifications : fallbackCertifications;

  return (
    <div className="relative mt-16 md:mt-24">
      <div className="relative space-y-28">
        {/* Header — same system as every other page section */}
        <section className="relative space-y-14 text-center">
          <GridWrapper>
            <SectionHeading kicker="Credentials" className="mx-auto max-w-2xl">
              Licenses &amp;{" "}
              <span className="text-gradient-animated font-display italic">
                certifications
              </span>
            </SectionHeading>
          </GridWrapper>
          <GridWrapper>
            <div className="grid grid-cols-1 gap-3 px-4 text-left md:grid-cols-2 xl:px-0">
              {certifications.map((cert, i) => (
                <div
                  key={`${cert.title}-${i}`}
                  className="group rounded-2xl border border-border-primary bg-white p-6 transition-colors duration-300 hover:border-text-tertiary/60 dark:bg-white/[0.02]"
                >
                  {cert.issue_date && (
                    <p className="font-mono text-[11px] uppercase tracking-[0.25em] text-text-tertiary">
                      {cert.issue_date}
                    </p>
                  )}
                  <h3 className="mt-2 text-2xl font-medium tracking-tight text-text-primary">
                    {cert.title}
                  </h3>
                  {cert.issuer && (
                    <p className="mt-1 text-sm text-text-secondary">
                      {cert.issuer}
                    </p>
                  )}
                  {cert.credential_url && (
                    <a
                      href={cert.credential_url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="mt-4 inline-flex items-center gap-1 py-1 text-sm font-medium text-text-primary transition-colors hover:text-text-secondary"
                    >
                      View credential <span aria-hidden>↗</span>
                    </a>
                  )}
                </div>
              ))}
            </div>
          </GridWrapper>
        </section>

        <CtaSection />
      </div>
    </div>
  );
}
