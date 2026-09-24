import type { Metadata } from "next";
import {
  ArrowUpRight,
  CalendarDays,
  CheckCircle2,
  Download,
  FileText,
  HardDrive,
  RefreshCw,
  ScanText,
  Share2,
} from "lucide-react";
import { BlogStatePanel } from "@/app/components/blog/BlogStatePanel";
import { GridWrapper } from "@/app/components/GridWrapper";
import { PaperHeroTexture } from "@/app/components/PaperHeroTexture";
import { CtaSection } from "@/app/components/home/CtaSection";
import { RESUME_DOWNLOAD_ROUTE } from "@/app/data/resume";
import { fetchResumeDocument } from "./data";

export const metadata: Metadata = {
  title: "Resume - Muhammad Haris",
  description:
    "Open or download Muhammad Haris's current resume covering cybersecurity, full-stack engineering, education, projects, and technical expertise.",
};

function formatBytes(bytes: number) {
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(2)} MB`;
}

function formatDate(value: string) {
  return new Intl.DateTimeFormat("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  }).format(new Date(value));
}

const benefits = [
  {
    icon: RefreshCw,
    title: "Always current",
    description: "This page points to the latest Resume published through the Admin workspace.",
  },
  {
    icon: ScanText,
    title: "Original formatting",
    description: "Open the exact PDF as designed, with native zoom, search, links, and printing.",
  },
  {
    icon: Share2,
    title: "Ready to share",
    description: "Download the original file for applications, referrals, and offline access.",
  },
] as const;

export default async function ResumePage() {
  const resume = await fetchResumeDocument();
  const version = resume ? encodeURIComponent(resume.updatedAt) : "";

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
              Open the current Resume in your browser or download the original PDF
              for applications, referrals, and offline access.
            </p>
          </header>
        </div>
      </GridWrapper>

      <section aria-label="Current Resume" className="mt-14 px-2 sm:px-4">
        <div className="mx-auto max-w-5xl">
          {resume ? (
            <>
              <article className="overflow-hidden rounded-3xl border border-border-primary bg-white shadow-sm dark:bg-white/[0.02]">
                <div className="grid lg:grid-cols-[minmax(0,0.82fr)_minmax(0,1.18fr)]">
                  <div className="flex min-h-[280px] items-center justify-center border-b border-border-primary bg-neutral-50 p-5 dark:bg-white/[0.025] sm:min-h-[340px] sm:p-10 lg:border-b-0 lg:border-r">
                    <div aria-hidden="true" className="w-full max-w-[236px] rounded-2xl border border-neutral-200 bg-white p-4 shadow-[0_20px_50px_-28px_rgba(15,23,42,0.45)] sm:max-w-[286px] sm:p-6">
                      <div className="flex items-center justify-between border-b-2 border-[#1e64c8] pb-4">
                        <span className="flex size-11 items-center justify-center rounded-xl bg-[#1e64c8]/10 text-[#1e64c8]">
                          <FileText className="size-5" />
                        </span>
                        <span className="rounded-full border border-neutral-200 px-2.5 py-1 font-mono text-[9px] uppercase tracking-widest text-neutral-600">
                          PDF
                        </span>
                      </div>
                      <div className="mt-4 space-y-2 sm:mt-6 sm:space-y-3">
                        <div className="h-3 w-3/4 rounded-full bg-neutral-800" />
                        <div className="h-2 w-1/2 rounded-full bg-neutral-300" />
                        <div className="pt-2 sm:pt-3">
                          <div className="h-2 w-full rounded-full bg-neutral-200" />
                          <div className="mt-2 h-2 w-11/12 rounded-full bg-neutral-200" />
                          <div className="mt-2 h-2 w-4/5 rounded-full bg-neutral-200" />
                        </div>
                        <div className="grid grid-cols-3 gap-2 pt-3 sm:pt-4">
                          <div className="h-10 rounded-lg bg-[#1e64c8]/8 sm:h-12" />
                          <div className="h-10 rounded-lg bg-neutral-100 sm:h-12" />
                          <div className="h-10 rounded-lg bg-neutral-100 sm:h-12" />
                        </div>
                      </div>
                      <div className="mt-4 flex items-center gap-2 border-t border-neutral-200 pt-3 text-[9px] font-medium text-neutral-600 sm:mt-6 sm:pt-4 sm:text-[10px]">
                        <CheckCircle2 className="size-4 text-emerald-600" />
                        Current published document
                      </div>
                    </div>
                  </div>

                  <div className="flex flex-col justify-center p-5 sm:p-8 lg:p-10">
                    <div className="flex items-center gap-2 font-mono text-[10px] uppercase tracking-widest text-emerald-700 dark:text-emerald-400">
                      <span aria-hidden className="size-2 rounded-full bg-emerald-500" />
                      Current Resume
                    </div>
                    <h2 className="mt-4 text-balance [font-family:var(--font-instrument-serif),serif] text-[36px] font-medium leading-none tracking-tight text-text-primary sm:text-[42px]">
                      Ready when you are.
                    </h2>
                    <p className="mt-4 text-sm leading-6 text-text-secondary">
                      View the PDF with your browser&apos;s full document controls, or
                      save the exact published file to your device.
                    </p>

                    <div className="mt-6 rounded-2xl border border-border-primary bg-neutral-50/80 p-4 dark:bg-white/[0.025]">
                      <p className="break-words text-sm font-medium text-text-primary">
                        {resume.filename}
                      </p>
                      <dl className="mt-4 grid gap-4 border-t border-border-primary pt-4 sm:grid-cols-3 sm:gap-3">
                        <div>
                          <dt className="flex items-center gap-1.5 font-mono text-[9px] uppercase tracking-widest text-text-secondary">
                            <CalendarDays className="size-3.5" aria-hidden /> Updated
                          </dt>
                          <dd className="mt-1.5 text-sm font-medium text-text-primary">
                            {formatDate(resume.updatedAt)}
                          </dd>
                        </div>
                        <div>
                          <dt className="flex items-center gap-1.5 font-mono text-[9px] uppercase tracking-widest text-text-secondary">
                            <HardDrive className="size-3.5" aria-hidden /> File size
                          </dt>
                          <dd className="mt-1.5 text-sm font-medium text-text-primary">
                            {formatBytes(resume.sizeBytes)}
                          </dd>
                        </div>
                        <div>
                          <dt className="flex items-center gap-1.5 font-mono text-[9px] uppercase tracking-widest text-text-secondary">
                            <FileText className="size-3.5" aria-hidden /> Format
                          </dt>
                          <dd className="mt-1.5 text-sm font-medium text-text-primary">PDF document</dd>
                        </div>
                      </dl>
                    </div>

                    <div className="mt-6 grid gap-3 sm:grid-cols-2">
                      <a
                        href={resume.fileUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex min-h-12 items-center justify-center gap-2.5 rounded-full border border-text-primary bg-text-primary px-5 text-sm font-medium text-bg-primary outline-none transition-opacity hover:opacity-85 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-text-primary"
                      >
                        Open Resume <ArrowUpRight className="size-4" aria-hidden />
                        <span className="sr-only">in a new tab</span>
                      </a>
                      <a
                        href={`${RESUME_DOWNLOAD_ROUTE}&v=${version}`}
                        className="inline-flex min-h-12 items-center justify-center gap-2.5 rounded-full border border-border-primary px-5 text-sm font-medium text-text-secondary outline-none transition-colors hover:border-neutral-400/70 hover:text-text-primary focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-text-primary dark:hover:border-white/25"
                      >
                        <Download className="size-4" aria-hidden /> Download PDF
                      </a>
                    </div>
                  </div>
                </div>
              </article>

              <ul className="mt-3 grid gap-3 md:grid-cols-3">
                {benefits.map(({ icon: Icon, title, description }) => (
                  <li key={title} className="rounded-2xl border border-border-primary bg-white p-5 dark:bg-white/[0.02] sm:p-6">
                    <span className="flex size-10 items-center justify-center rounded-xl border border-border-primary bg-neutral-50 text-text-secondary dark:bg-white/[0.04]">
                      <Icon className="size-4.5" aria-hidden />
                    </span>
                    <h3 className="mt-5 text-[15px] font-medium text-text-primary">{title}</h3>
                    <p className="mt-2 text-sm leading-5 text-text-secondary">{description}</p>
                  </li>
                ))}
              </ul>
            </>
          ) : (
            <BlogStatePanel
              kicker="Resume unavailable"
              title={<>A new Resume is being <span className="animate-gradient-x text-colorfull px-1 pb-1 italic [text-shadow:none] motion-reduce:animate-none">prepared.</span></>}
              description="The current document has been removed and a replacement will be published here soon."
            />
          )}
        </div>
      </section>

      <div className="mt-28">
        <CtaSection />
      </div>
    </div>
  );
}
