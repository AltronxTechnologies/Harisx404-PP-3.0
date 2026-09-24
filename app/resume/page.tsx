import type { Metadata } from "next";
import { ArrowUpRight, Download, FileText } from "lucide-react";
import { BlogStatePanel } from "@/app/components/blog/BlogStatePanel";
import { GridWrapper } from "@/app/components/GridWrapper";
import { PaperHeroTexture } from "@/app/components/PaperHeroTexture";
import { CtaSection } from "@/app/components/home/CtaSection";
import { ResumePdfViewer } from "@/app/components/resume/ResumePdfViewer";
import { RESUME_DOWNLOAD_ROUTE } from "@/app/data/resume";
import { fetchResumeDocument } from "./data";

export const metadata: Metadata = {
  title: "Resume - Muhammad Haris",
  description:
    "Muhammad Haris's current resume, covering cybersecurity, full-stack engineering, education, projects, and technical expertise.",
};

function formatBytes(bytes: number) {
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(2)} MB`;
}

function formatDate(value: string) {
  return new Intl.DateTimeFormat("en-US", {
    month: "long",
    day: "numeric",
    year: "numeric",
  }).format(new Date(value));
}

export default async function ResumePage() {
  const resume = await fetchResumeDocument();
  const version = resume ? encodeURIComponent(resume.updatedAt) : "";

  return (
    <div className="relative mt-14">
      <GridWrapper>
        <div className="relative px-4 xl:px-0">
          <PaperHeroTexture className="-inset-x-2 bottom-0 top-[-128px] sm:-inset-x-3 sm:top-[-144px] md:top-[-176px] lg:inset-x-0" />
          <header className="relative mx-auto max-w-3xl text-center">
            <p className="font-mono text-xs font-medium uppercase tracking-widest text-text-secondary">Resume</p>
            <h1 className="heading-glow mx-auto mt-4 max-w-xl text-balance [font-family:var(--font-instrument-serif),serif] text-[46px] font-medium leading-none tracking-tight text-text-primary md:text-[56px] md:tracking-[-1.5px]">
              Experience, clearly <span className="animate-gradient-x text-colorfull px-1 pb-1 italic [text-shadow:none] motion-reduce:animate-none">documented.</span>
            </h1>
            <p className="mx-auto mt-4 max-w-2xl text-pretty text-[15px] leading-6 text-text-secondary">
              The current Resume, available to read here or download exactly as published.
            </p>
            {resume && (
              <div className="mt-7 flex flex-wrap items-center justify-center gap-3">
                <a href={`${RESUME_DOWNLOAD_ROUTE}&v=${version}`} className="inline-flex min-h-11 items-center gap-2.5 rounded-full border border-text-primary bg-text-primary px-5 text-sm font-medium text-bg-primary outline-none transition-colors hover:opacity-85 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-text-primary">
                  <Download className="size-4" aria-hidden /> Download PDF
                </a>
                <a href={resume.fileUrl} target="_blank" rel="noopener noreferrer" className="inline-flex min-h-11 items-center gap-2.5 rounded-full border border-border-primary px-5 text-sm font-medium text-text-secondary outline-none transition-colors hover:border-neutral-400/70 hover:text-text-primary focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-text-primary dark:hover:border-white/25">
                  Open PDF <ArrowUpRight className="size-4" aria-hidden />
                  <span className="sr-only">Opens in a new tab</span>
                </a>
              </div>
            )}
          </header>
        </div>
      </GridWrapper>

      <section aria-label="Published Resume" className="mt-14 px-2 sm:px-4">
        <div className="mx-auto max-w-5xl">
          {resume ? (
            <>
              <div className="mb-6 flex flex-col gap-3 border-y border-border-primary px-2 py-4 sm:flex-row sm:items-center sm:justify-between sm:px-4">
                <div className="flex min-w-0 items-center gap-3">
                  <FileText className="size-5 shrink-0 text-text-secondary" aria-hidden />
                  <p className="truncate text-sm font-medium text-text-primary">{resume.filename}</p>
                </div>
                <p className="font-mono text-[10px] uppercase tracking-widest text-text-secondary">
                  Updated {formatDate(resume.updatedAt)} · {formatBytes(resume.sizeBytes)}
                </p>
              </div>
              <ResumePdfViewer fileUrl={resume.fileUrl} />
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

      <div className="mt-28"><CtaSection /></div>
    </div>
  );
}
