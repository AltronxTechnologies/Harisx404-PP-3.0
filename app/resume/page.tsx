import type { Metadata } from "next";
import type { ReactNode } from "react";
import { ArrowUpRight, Download, FileText } from "lucide-react";
import { GridWrapper } from "@/app/components/GridWrapper";
import { PaperHeroTexture } from "@/app/components/PaperHeroTexture";
import { CtaSection } from "@/app/components/home/CtaSection";
import {
  RESUME_DOWNLOAD_NAME,
  RESUME_PDF,
  RESUME_REVISION,
  type ResumeEntry,
  resumeEducation,
  resumeExperience,
  resumeProjects,
  resumeSkills,
} from "@/app/data/resume";

export const metadata: Metadata = {
  title: "Resume - Muhammad Haris",
  description:
    "Muhammad Haris's accessible web resume and downloadable PDF, covering cybersecurity, full-stack engineering, education, projects, and technical expertise.",
};

const paperLink =
  "rounded-sm text-[#1756ad] underline decoration-[#1e64c8]/35 underline-offset-2 outline-none transition-colors hover:text-[#103f82] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#1e64c8]";

function Section({ label, children }: { label: string; children: ReactNode }) {
  return (
    <section className="grid grid-cols-1 gap-3 border-t border-neutral-200 py-5 md:grid-cols-[172px_minmax(0,1fr)] md:gap-8 md:py-6">
      <h3 className="text-[11px] font-bold uppercase tracking-[0.14em] text-[#1e64c8] md:pt-1">
        {label}
      </h3>
      <div className="min-w-0 space-y-5">{children}</div>
    </section>
  );
}

function Entry({ entry }: { entry: ResumeEntry }) {
  return (
    <div>
      <div className="flex flex-col gap-1 sm:flex-row sm:items-baseline sm:justify-between sm:gap-x-5">
        <h4 className="text-[15px] font-semibold leading-5 text-neutral-900">
          {entry.title}
        </h4>
        <span className="shrink-0 font-mono text-[11px] uppercase tracking-wider text-neutral-600">
          {entry.period}
        </span>
      </div>
      <p className="mt-1 text-[13px] font-medium text-[#1756ad]">
        {entry.organization}
      </p>
      {entry.description && (
        <p className="mt-2 text-sm leading-[1.65] text-neutral-700">
          {entry.description}
        </p>
      )}
      {entry.bullets && <Bullets items={entry.bullets} />}
    </div>
  );
}

function Bullets({ items }: { items: string[] }) {
  return (
    <ul className="mt-2 space-y-1.5 text-sm leading-[1.65] text-neutral-700">
      {items.map((item) => (
        <li key={item.slice(0, 40)} className="flex gap-2.5">
          <span
            aria-hidden
            className="mt-[9px] size-1 shrink-0 rounded-full bg-[#1e64c8]"
          />
          <span>{item}</span>
        </li>
      ))}
    </ul>
  );
}

function EntryList({ entries }: { entries: ResumeEntry[] }) {
  return entries.map((entry) => <Entry key={entry.title} entry={entry} />);
}

export default function ResumePage() {
  return (
    <div className="relative mt-14">
      <GridWrapper>
        <div className="relative px-4 xl:px-0">
          <PaperHeroTexture className="-inset-x-2 bottom-0 top-[-128px] sm:-inset-x-3 sm:top-[-144px] md:top-[-176px] lg:inset-x-0" />
          <header className="relative mx-auto max-w-3xl text-center">
            <p className="font-mono text-xs font-medium uppercase tracking-widest text-text-secondary">
              Resume
            </p>
            <h1 className="heading-glow mx-auto mt-4 max-w-xl text-balance [font-family:var(--font-instrument-serif),serif] text-[46px] font-medium leading-none tracking-tight text-text-primary md:text-[56px] md:tracking-[-1.5px]">
              Experience, clearly{" "}
              <span className="animate-gradient-x text-colorfull px-1 pb-1 italic [text-shadow:none] motion-reduce:animate-none">
                documented.
              </span>
            </h1>
            <p className="mx-auto mt-4 max-w-2xl text-pretty text-[15px] leading-6 text-text-secondary">
              An accessible web resume with a downloadable PDF for applications,
              referrals, and a closer look at the work behind the portfolio.
            </p>
            <div className="mt-7 flex flex-wrap items-center justify-center gap-3">
              <a
                href={RESUME_PDF}
                download={RESUME_DOWNLOAD_NAME}
                className="inline-flex min-h-11 items-center gap-2.5 rounded-full border border-text-primary bg-text-primary px-5 text-sm font-medium text-bg-primary outline-none transition-colors hover:opacity-85 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-text-primary"
              >
                <Download className="size-4" aria-hidden />
                Download PDF
              </a>
              <a
                href={RESUME_PDF}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex min-h-11 items-center gap-2.5 rounded-full border border-border-primary px-5 text-sm font-medium text-text-secondary outline-none transition-colors hover:border-neutral-400/70 hover:text-text-primary focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-text-primary dark:hover:border-white/25"
              >
                Preview PDF
                <ArrowUpRight className="size-4" aria-hidden />
                <span className="sr-only">Opens in a new tab</span>
              </a>
            </div>
          </header>
        </div>
      </GridWrapper>

      <section aria-labelledby="resume-document-heading" className="mt-14 px-2 sm:px-4">
        <div className="mx-auto max-w-5xl">
          <div className="mb-6 flex flex-col gap-3 border-y border-border-primary px-2 py-4 sm:flex-row sm:items-center sm:justify-between sm:px-4">
            <div>
              <h2
                id="resume-document-heading"
                className="font-mono text-xs font-medium uppercase tracking-widest text-text-secondary"
              >
                Web resume
              </h2>
              <p className="mt-1.5 text-sm text-text-secondary">
                Structured for quick scanning, keyboard access, and readable detail.
              </p>
            </div>
            <p className="font-mono text-[10px] uppercase tracking-widest text-text-secondary">
              Updated {RESUME_REVISION} · PDF available
            </p>
          </div>

          <article
            aria-labelledby="resume-paper-title"
            className="overflow-hidden rounded-3xl border border-neutral-200 bg-white shadow-[0_24px_70px_-36px_rgba(0,0,0,0.45)] dark:shadow-[0_26px_90px_-38px_rgba(0,0,0,0.9)]"
          >
            <header className="border-b-4 border-[#1e64c8] px-5 py-6 sm:px-8 sm:py-8 lg:px-10">
              <div className="flex flex-col gap-5 sm:flex-row sm:items-end sm:justify-between">
                <div>
                  <p className="text-[11px] font-bold uppercase tracking-[0.26em] text-[#1e64c8]">
                    Curriculum Vitae
                  </p>
                  <h2
                    id="resume-paper-title"
                    className="mt-2 text-3xl font-bold tracking-tight text-neutral-950 sm:text-4xl"
                  >
                    Muhammad Haris
                  </h2>
                  <p className="mt-2 max-w-xl text-sm font-medium leading-5 text-neutral-700">
                    Full-Stack Engineer · Cybersecurity Professional · AI/ML Practitioner
                  </p>
                </div>
                <div className="flex items-center gap-2 text-neutral-700">
                  <FileText className="size-4 text-[#1e64c8]" aria-hidden />
                  <p className="font-mono text-[11px] uppercase tracking-[0.16em]">
                    Europass-inspired
                  </p>
                </div>
              </div>
            </header>

            <div className="px-5 pb-7 sm:px-8 lg:px-10">
              <Section label="Personal Information">
                <address className="not-italic">
                  <dl className="grid grid-cols-1 gap-x-8 gap-y-3 text-sm text-neutral-700 sm:grid-cols-2">
                    <div>
                      <dt className="font-semibold text-neutral-900">Email</dt>
                      <dd className="mt-0.5 break-all">
                        <a className={paperLink} href="mailto:itsharis.tech@gmail.com">
                          itsharis.tech@gmail.com
                        </a>
                      </dd>
                    </div>
                    <div>
                      <dt className="font-semibold text-neutral-900">Location</dt>
                      <dd className="mt-0.5">Pakistan · working worldwide</dd>
                    </div>
                    <div>
                      <dt className="font-semibold text-neutral-900">LinkedIn</dt>
                      <dd className="mt-0.5 break-all">
                        <a className={paperLink} href="https://www.linkedin.com/in/harisx404/" target="_blank" rel="noopener noreferrer">
                          linkedin.com/in/harisx404
                          <span className="sr-only"> (opens in a new tab)</span>
                        </a>
                      </dd>
                    </div>
                    <div>
                      <dt className="font-semibold text-neutral-900">GitHub</dt>
                      <dd className="mt-0.5 break-all">
                        <a className={paperLink} href="https://github.com/harisx404" target="_blank" rel="noopener noreferrer">
                          github.com/harisx404
                          <span className="sr-only"> (opens in a new tab)</span>
                        </a>
                      </dd>
                    </div>
                  </dl>
                </address>
              </Section>

              <Section label="Professional Summary">
                <p className="text-sm leading-[1.7] text-neutral-700">
                  BSIT graduate working across full-stack engineering,
                  cybersecurity, and AI/ML. Ranked in Pakistan&apos;s Top 15% in the
                  National Skill Competency Test among more than 33,000 graduates,
                  with a 96% Cybersecurity coursework result and practical SOC
                  experience using Wazuh SIEM. I build secure applications from the
                  architecture upward, combining production engineering with OWASP
                  controls, role-based access, and measurable performance gains.
                </p>
              </Section>

              <Section label="Experience">
                <EntryList entries={resumeExperience} />
              </Section>

              <Section label="Selected Projects">
                <EntryList entries={resumeProjects} />
              </Section>

              <Section label="Education & Training">
                <EntryList entries={resumeEducation} />
              </Section>

              <Section label="Technical Expertise">
                <dl className="space-y-3.5">
                  {resumeSkills.map(([name, detail]) => (
                    <div
                      key={name}
                      className="grid grid-cols-1 gap-1 md:grid-cols-[154px_minmax(0,1fr)] md:gap-5"
                    >
                      <dt className="text-[13px] font-semibold text-neutral-900">
                        {name}
                      </dt>
                      <dd className="text-sm leading-relaxed text-neutral-700">
                        {detail}
                      </dd>
                    </div>
                  ))}
                </dl>
              </Section>
            </div>
          </article>
        </div>
      </section>

      <div className="mt-28">
        <CtaSection />
      </div>
    </div>
  );
}
