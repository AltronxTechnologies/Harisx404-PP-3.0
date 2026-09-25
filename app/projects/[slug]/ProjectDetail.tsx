"use client";

import { useEffect, useRef, useState, type ReactNode } from "react";
import Image from "next/image";
import Link from "next/link";
import ReactMarkdown from "react-markdown";
import { ArrowUpRight, ChevronDown, Copy, Download, ExternalLink } from "lucide-react";
import { GridWrapper } from "@/app/components/GridWrapper";
import { PaperHeroTexture } from "@/app/components/PaperHeroTexture";
import { CtaSection } from "@/app/components/home/CtaSection";
import { optimizeImageUrl } from "@/app/lib/image-utils";

export type DetailProject = {
  title: string;
  slug: string;
  tagline: string;
  description: string;
  content: string;
  tech: string[];
  year: string;
  category: string;
  image_url: string;
  live_url: string;
  github_url: string;
  features: string[];
  tags: string[];
  gallery: Array<{ src: string; caption: string; alt: string }>;
};

export type NeighborProject = {
  title: string;
  slug: string;
  category: string;
  tagline?: string;
};

const focusStyle = "focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-text-primary";

function Fact({ label, children }: { label: string; children: ReactNode }) {
  return (
    <div className="min-w-0">
      <dt className="font-mono text-[11px] uppercase tracking-widest text-text-secondary">{label}</dt>
      <dd className="mt-2 break-words text-sm font-medium text-text-primary">{children}</dd>
    </div>
  );
}

function SectionRule() {
  return <div aria-hidden className="border-t border-border-primary" />;
}

function StorySection({ number, title, children }: { number: string; title: string; children: ReactNode }) {
  return (
    <section className="grid lg:grid-cols-12">
      <div className="px-4 py-6 sm:px-6 lg:col-span-4 lg:py-14">
        <div className="lg:sticky lg:top-32">
          <span className="font-mono text-xs font-medium text-text-secondary">{number}</span>
          <h2 className="mt-2 [font-family:var(--font-instrument-serif),serif] text-[32px] font-medium leading-none tracking-tight text-text-primary sm:text-[38px]">{title}</h2>
        </div>
      </div>
      <div className="min-w-0 px-4 pb-10 sm:px-6 lg:col-span-8 lg:py-14">{children}</div>
    </section>
  );
}

function CaseStudy({ content }: { content: string }) {
  return (
    <div className="prose max-w-none break-words text-[15px] leading-7 text-text-secondary prose-headings:font-medium prose-headings:text-text-primary prose-p:leading-7 prose-p:text-text-secondary prose-strong:text-text-primary prose-a:text-text-primary prose-code:break-all prose-code:text-text-primary prose-blockquote:border-border-primary dark:prose-invert">
      <ReactMarkdown
        components={{
          h2: ({ children }) => <h3 className="[font-family:var(--font-instrument-serif),serif] text-2xl">{children}</h3>,
          a: ({ href, children }) => (
            <a href={href} target={href?.startsWith("http") ? "_blank" : undefined} rel={href?.startsWith("http") ? "noopener noreferrer" : undefined} className={`underline underline-offset-4 ${focusStyle}`}>
              {children}
              {href?.startsWith("http") && <span className="sr-only"> (opens in a new tab)</span>}
            </a>
          ),
        }}
      >
        {content}
      </ReactMarkdown>
    </div>
  );
}

export function ProjectDetail({ project, prev, next }: { project: DetailProject; prev: NeighborProject | null; next: NeighborProject | null }) {
  const [shareOpen, setShareOpen] = useState(false);
  const [copyStatus, setCopyStatus] = useState("");
  const shareRef = useRef<HTMLDivElement>(null);
  const shareTriggerRef = useRef<HTMLButtonElement>(null);
  const firstShareItemRef = useRef<HTMLButtonElement>(null);
  const copyTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const upNext = next ?? prev;
  const galleryImages = project.gallery.filter((image) => image.src && image.src !== project.image_url);
  const summary = project.tagline || project.description;
  const overview = project.content.trim() && project.content.trim() !== summary.trim()
    ? project.content.trim()
    : project.description.trim() !== summary.trim() ? project.description.trim() : "";

  useEffect(() => {
    if (!shareOpen) return;
    const outside = (event: PointerEvent) => {
      if (!shareRef.current?.contains(event.target as Node)) setShareOpen(false);
    };
    const escape = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        setShareOpen(false);
        shareTriggerRef.current?.focus();
      }
    };
    document.addEventListener("pointerdown", outside);
    document.addEventListener("keydown", escape);
    return () => {
      document.removeEventListener("pointerdown", outside);
      document.removeEventListener("keydown", escape);
    };
  }, [shareOpen]);

  useEffect(() => () => {
    if (copyTimerRef.current) clearTimeout(copyTimerRef.current);
  }, []);

  const copyText = async (text: string, message: string) => {
    try {
      await navigator.clipboard.writeText(text);
      setCopyStatus(message);
    } catch {
      setCopyStatus("Copy unavailable. Select and copy the address from your browser instead.");
    }
    if (copyTimerRef.current) clearTimeout(copyTimerRef.current);
    copyTimerRef.current = setTimeout(() => setCopyStatus(""), 3000);
  };

  const projectUrl = () => new URL(`/projects/${project.slug}`, window.location.origin).href;
  const markdown = () => [
    `# ${project.title}`,
    summary,
    project.content || project.description,
    project.features.length ? `## Highlights\n${project.features.map((feature) => `- ${feature}`).join("\n")}` : "",
    projectUrl(),
  ].filter(Boolean).join("\n\n");

  return (
    <div className="relative mt-14 min-w-0 bg-bg-primary">
      <GridWrapper>
        <div className="relative px-4 xl:px-0">
          <PaperHeroTexture className="-inset-x-2 bottom-0 top-[-128px] sm:-inset-x-3 sm:top-[-144px] md:top-[-176px] lg:inset-x-0" />
          <header className="relative mx-auto max-w-4xl text-center">
            <nav aria-label="Breadcrumb" className="mb-5">
              <ol className="flex flex-wrap items-center justify-center gap-2 font-mono text-[11px] text-text-secondary">
                <li><Link href="/" className={`rounded-sm hover:text-text-primary ${focusStyle}`}>Home</Link></li>
                <li aria-hidden>/</li>
                <li><Link href="/projects" className={`rounded-sm hover:text-text-primary ${focusStyle}`}>Projects</Link></li>
                <li aria-hidden>/</li>
                <li aria-current="page" className="max-w-48 truncate text-text-primary" title={project.title}>{project.title}</li>
              </ol>
            </nav>
            <p className="font-mono text-xs font-medium uppercase tracking-widest text-text-secondary">Case study / {project.category}</p>
            <h1 className="heading-glow mx-auto mt-4 max-w-3xl text-balance [font-family:var(--font-instrument-serif),serif] text-[46px] font-medium leading-none tracking-tight text-text-primary md:text-[56px] md:tracking-[-1.5px]">{project.title}</h1>
            {summary && <p className="mx-auto mt-4 max-w-2xl text-pretty text-[15px] leading-6 text-text-secondary">{summary}</p>}

            <div ref={shareRef} className="relative mt-6 inline-flex">
              <button
                ref={shareTriggerRef}
                type="button"
                aria-expanded={shareOpen}
                aria-controls="project-share-options"
                onClick={(event) => {
                  setShareOpen((open) => !open);
                  if (!shareOpen && event.detail === 0) requestAnimationFrame(() => firstShareItemRef.current?.focus());
                }}
                className={`inline-flex min-h-11 items-center gap-2 rounded-full border border-border-primary bg-bg-primary px-5 text-sm font-medium text-text-primary transition-colors hover:border-neutral-400/70 dark:hover:border-white/25 ${focusStyle}`}
              >
                <Copy className="size-4" aria-hidden /> Share project <ChevronDown className={`size-4 transition-transform motion-reduce:transition-none ${shareOpen ? "rotate-180" : ""}`} aria-hidden />
              </button>
              {shareOpen && (
                <div id="project-share-options" role="group" aria-label="Share project" className="absolute left-1/2 top-full z-30 mt-2 w-[min(292px,calc(100vw-4rem))] -translate-x-1/2 rounded-2xl border border-border-primary bg-bg-primary p-2 text-left shadow-xl">
                  <button ref={firstShareItemRef} type="button" onClick={() => copyText(projectUrl(), "Link copied")} className={`flex min-h-11 w-full items-center gap-3 rounded-xl px-3 text-sm text-text-primary hover:bg-text-primary/5 ${focusStyle}`}><Copy className="size-4" aria-hidden /> Copy link</button>
                  <button type="button" onClick={() => copyText(markdown(), "Markdown copied")} className={`flex min-h-11 w-full items-center gap-3 rounded-xl px-3 text-sm text-text-primary hover:bg-text-primary/5 ${focusStyle}`}><Download className="size-4" aria-hidden /> Copy as Markdown</button>
                </div>
              )}
            </div>
            <p role="status" aria-live="polite" className={copyStatus ? "mx-auto mt-3 max-w-sm text-xs leading-5 text-text-secondary" : "sr-only"}>{copyStatus}</p>
          </header>
        </div>
      </GridWrapper>

      <section aria-labelledby="project-facts-heading" className="mt-14 px-2 sm:px-4">
        <div className="mx-auto max-w-6xl overflow-hidden rounded-3xl border border-border-primary bg-white dark:bg-white/[0.02]">
          <div className={`grid ${project.tech.length ? "lg:grid-cols-[1.1fr_0.9fr]" : ""}`}>
            <div className="p-5 sm:p-7 lg:p-8">
              <h2 id="project-facts-heading" className="font-mono text-xs font-medium uppercase tracking-widest text-text-secondary">At a glance</h2>
              <dl className="mt-6 grid grid-cols-2 gap-x-5 gap-y-6 sm:grid-cols-4">
                <Fact label="Type">{project.category}</Fact>
                {project.year && <Fact label="Built">{project.year}</Fact>}
                <Fact label="Visit">{project.live_url ? <a href={project.live_url} target="_blank" rel="noopener noreferrer" className={`inline-flex items-center gap-1.5 rounded-sm text-text-primary underline underline-offset-4 ${focusStyle}`}>Live site <ExternalLink className="size-3.5" aria-hidden /><span className="sr-only">opens in a new tab</span></a> : <span className="text-text-secondary">Not public</span>}</Fact>
                <Fact label="Source">{project.github_url ? <a href={project.github_url} target="_blank" rel="noopener noreferrer" className={`inline-flex items-center gap-1.5 rounded-sm text-text-primary underline underline-offset-4 ${focusStyle}`}>View source <ExternalLink className="size-3.5" aria-hidden /><span className="sr-only">opens in a new tab</span></a> : <span className="text-text-secondary">Private</span>}</Fact>
              </dl>
            </div>
            {project.tech.length > 0 && (
              <div className="border-t border-border-primary p-5 sm:p-7 lg:border-l lg:border-t-0 lg:p-8">
                <h2 className="font-mono text-xs font-medium uppercase tracking-widest text-text-secondary">Tech stack</h2>
                <ul className="mt-6 flex flex-wrap gap-2">
                  {project.tech.map((tech) => <li key={tech} className="rounded-full border border-border-primary bg-neutral-50 px-3 py-1.5 font-mono text-[11px] text-text-secondary dark:bg-white/[0.04]">{tech}</li>)}
                </ul>
              </div>
            )}
          </div>
        </div>
      </section>

      <article className="mx-auto mt-14 max-w-6xl px-2 sm:px-4">
        {project.image_url && (
          <figure className="relative aspect-[16/10] overflow-hidden rounded-3xl border border-border-primary bg-neutral-100 dark:bg-white/[0.04] sm:aspect-video">
            <Image src={optimizeImageUrl(project.image_url, 1600)} alt="" fill priority sizes="(max-width: 1280px) 100vw, 1152px" className="object-cover" />
          </figure>
        )}
        {(overview || project.features.length || galleryImages.length) && <div className="mt-10 border-t border-border-primary" />}
        {overview && (
          <StorySection number="01" title="Overview">
            <CaseStudy content={overview} />
          </StorySection>
        )}
        {overview && (project.features.length > 0 || galleryImages.length > 0) && <SectionRule />}
        {project.features.length > 0 && (
          <StorySection number={overview ? "02" : "01"} title="Highlights">
            <ol className="grid gap-3 md:grid-cols-2">
              {project.features.map((feature, index) => (
                <li key={`${index}-${feature}`} className="flex gap-4 rounded-2xl border border-border-primary bg-white p-5 dark:bg-white/[0.02]">
                  <span className="shrink-0 font-mono text-xs text-text-secondary">{String(index + 1).padStart(2, "0")}</span>
                  <p className="text-[15px] leading-6 text-text-secondary">{feature}</p>
                </li>
              ))}
            </ol>
          </StorySection>
        )}
        {project.features.length > 0 && galleryImages.length > 0 && <SectionRule />}
        {galleryImages.length > 0 && (
          <StorySection number={String(1 + Number(Boolean(overview)) + Number(project.features.length > 0)).padStart(2, "0")} title="Gallery">
            <div className="grid gap-4 sm:grid-cols-2">
              {galleryImages.map((image) => (
                <figure key={image.src} className="overflow-hidden rounded-2xl border border-border-primary bg-neutral-100 dark:bg-white/[0.04]">
                  <div className="relative aspect-video"><Image src={optimizeImageUrl(image.src, 1000)} alt={image.caption || image.alt} fill sizes="(max-width: 640px) 100vw, 50vw" className="object-contain" /></div>
                  {image.caption && <figcaption className="border-t border-border-primary px-4 py-3 text-sm leading-5 text-text-secondary">{image.caption}</figcaption>}
                </figure>
              ))}
            </div>
          </StorySection>
        )}
        {(overview || project.features.length || galleryImages.length) && <SectionRule />}
      </article>

      {upNext && (
        <Link href={`/projects/${upNext.slug}`} className={`group mx-auto flex max-w-6xl flex-col items-center rounded-2xl px-4 py-16 text-center sm:px-6 ${focusStyle}`}>
          <p className="font-mono text-xs uppercase tracking-widest text-text-secondary">Up next / {upNext.category}</p>
          <h2 className="mt-5 text-balance [font-family:var(--font-instrument-serif),serif] text-[36px] font-medium leading-none tracking-tight text-text-primary sm:text-[46px]">{upNext.title}</h2>
          {upNext.tagline && <p className="mt-4 max-w-xl text-sm leading-6 text-text-secondary">{upNext.tagline}</p>}
          <span className="mt-5 inline-flex size-10 items-center justify-center rounded-full border border-border-primary text-text-primary transition-colors group-hover:border-neutral-400/70 dark:group-hover:border-white/25"><ArrowUpRight className="size-4" aria-hidden /></span>
        </Link>
      )}

      <div className={upNext ? "mt-12" : "mt-28"}><CtaSection /></div>
    </div>
  );
}
