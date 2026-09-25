"use client";

import { Fragment, useEffect, useRef, useState, type ReactNode } from "react";
import Image from "next/image";
import Link from "next/link";
import ReactMarkdown from "react-markdown";
import { ArrowUpRight, ChevronDown, Copy, ExternalLink, FileText, Mail, MessageCircle, Sparkles } from "lucide-react";
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
  latestUpdate: string;
  isPreview: boolean;
  sections: Partial<Record<"why_built" | "key_decisions" | "results" | "lessons_learned", string>>;
  category: string;
  image_url: string;
  live_url: string;
  github_url: string;
  liveNote: string;
  sourceNote: string;
  features: string[];
  tags: string[];
  gallery: Array<{ src: string; caption: string; alt: string }>;
};

export type NeighborProject = {
  title: string;
  slug: string;
  category: string;
  tagline?: string;
  tags: string[];
  tech: string[];
};

const focusStyle = "focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-text-primary";

// The same curated simple-icons set used by the home cards; unknown tools stay text-only.
const techIcons: Record<string, string> = {
  react: "react", reactjs: "react", reactnative: "react", nextjs: "nextdotjs", next: "nextdotjs",
  typescript: "typescript", javascript: "javascript", python: "python", fastapi: "fastapi",
  flask: "flask", django: "django", postgresql: "postgresql", postgres: "postgresql",
  mongodb: "mongodb", mongo: "mongodb", mysql: "mysql", redis: "redis", express: "express",
  nodejs: "nodedotjs", node: "nodedotjs", tailwindcss: "tailwindcss", docker: "docker",
  supabase: "supabase", firebase: "firebase", openai: "openai", gemini: "googlegemini",
  tensorflow: "tensorflow", pytorch: "pytorch", wireshark: "wireshark", graphql: "graphql",
  linux: "linux", kalilinux: "kalilinux", bash: "gnubash", git: "git", kubernetes: "kubernetes",
  pandas: "pandas", numpy: "numpy", jupyter: "jupyter", scikitlearn: "scikitlearn",
  nmap: "nmap", vercel: "vercel", sqlite: "sqlite", prisma: "prisma", rust: "rust",
  go: "go", cplusplus: "cplusplus", php: "php", laravel: "laravel", streamlit: "streamlit",
};

const sectionLabels = [
  ["why_built", "Why I built this"],
  ["key_decisions", "Key decisions"],
  ["results", "Results"],
  ["lessons_learned", "What I learned"],
] as const;

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

export function ProjectDetail({ project, related }: { project: DetailProject; related: NeighborProject[] }) {
  const [shareOpen, setShareOpen] = useState(false);
  const [shareAbove, setShareAbove] = useState(false);
  const [copyStatus, setCopyStatus] = useState("");
  const shareRef = useRef<HTMLDivElement>(null);
  const shareTriggerRef = useRef<HTMLButtonElement>(null);
  const firstShareItemRef = useRef<HTMLButtonElement>(null);
  const copyTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const galleryImages = project.gallery.filter((image) => image.src && image.src !== project.image_url);
  const sourceUrl = /^https?:\/\/(?:www\.)?github\.com\/[^/?#]+\/?(?:\?.*)?$/i.test(project.github_url) ? "" : project.github_url;
  const summary = project.tagline || project.description;
  const overview = project.content.trim() && project.content.trim() !== summary.trim()
    ? project.content.trim()
    : project.description.trim() !== summary.trim() ? project.description.trim() : "";
  const sections = sectionLabels.filter(([key]) => typeof project.sections[key] === "string" && project.sections[key]?.trim());
  const story: Array<{ title: string; content: ReactNode }> = [];
  if (overview) story.push({ title: "Overview", content: <CaseStudy content={overview} /> });
  if (project.sections.why_built?.trim()) story.push({ title: "Why I built this", content: <CaseStudy content={project.sections.why_built} /> });
  if (project.features.length) story.push({ title: "Highlights", content: <ol className="grid gap-3 md:grid-cols-2">{project.features.map((feature, index) => (
    <li key={`${index}-${feature}`} className="flex gap-4 rounded-2xl border border-border-primary bg-white p-5 dark:bg-white/[0.02]">
      <span className="shrink-0 font-mono text-xs text-text-secondary">{String(index + 1).padStart(2, "0")}</span>
      <p className="text-[15px] leading-6 text-text-secondary">{feature}</p>
    </li>
  ))}</ol> });
  for (const [key, label] of sections) {
    const text = project.sections[key];
    if (key !== "why_built" && text) story.push({ title: label, content: <CaseStudy content={text} /> });
  }
  if (galleryImages.length) story.push({ title: "Gallery", content: <div className="grid gap-4 sm:grid-cols-2">{galleryImages.map((image, index) => (
    <figure key={`${image.src}-${index}`} className="overflow-hidden rounded-2xl border border-border-primary bg-neutral-100 dark:bg-white/[0.04]">
      <div className="relative aspect-video"><Image src={optimizeImageUrl(image.src, 1000)} alt={image.alt || image.caption || `${project.title} gallery image ${index + 1}`} fill sizes="(max-width: 640px) 100vw, 50vw" className="object-contain" /></div>
      {image.caption && <figcaption className="border-t border-border-primary px-4 py-3 text-sm leading-5 text-text-secondary">{image.caption}</figcaption>}
    </figure>
  ))}</div> });

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
    let copied = false;
    try {
      await navigator.clipboard.writeText(text);
      copied = true;
    } catch {
      // Clipboard permission can be denied even on an otherwise usable page.
      try {
        const field = document.createElement("textarea");
        field.value = text;
        field.style.position = "fixed";
        field.style.opacity = "0";
        document.body.appendChild(field);
        field.select();
        copied = document.execCommand("copy");
        field.remove();
      } catch {
        copied = false;
      }
    }
    setCopyStatus(copied ? message : "Copy unavailable. You can copy the project URL from your browser address bar.");
    if (copyTimerRef.current) clearTimeout(copyTimerRef.current);
    copyTimerRef.current = setTimeout(() => setCopyStatus(""), 5000);
    return copied;
  };

  const projectUrl = () => new URL(`/projects/${project.slug}`, window.location.origin).href;
  const markdown = () => [
    `# ${project.title}`,
    summary,
    project.content || project.description,
    project.features.length ? `## Highlights\n${project.features.map((feature) => `- ${feature}`).join("\n")}` : "",
    ...sections.map(([key, label]) => `## ${label}\n${project.sections[key]}`),
    projectUrl(),
  ].filter(Boolean).join("\n\n");

  const viewMarkdown = () => {
    const url = URL.createObjectURL(new Blob([markdown()], { type: "text/markdown" }));
    window.open(url, "_blank", "noopener,noreferrer");
    window.setTimeout(() => URL.revokeObjectURL(url), 60_000);
    setShareOpen(false);
    shareTriggerRef.current?.focus();
  };

  const openClaude = () => {
    window.open("https://claude.ai/new", "_blank", "noopener,noreferrer");
    void copyText(`Review this project case study: ${projectUrl()}`, "Prompt copied. Paste it into Claude to start a conversation.");
    setShareOpen(false);
    shareTriggerRef.current?.focus();
  };

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
            <h1 className="heading-glow mx-auto mt-4 max-w-3xl break-words text-balance [font-family:var(--font-instrument-serif),serif] text-[46px] font-medium leading-none tracking-tight text-text-primary md:text-[56px] md:tracking-[-1.5px]">{project.title}</h1>
            {summary && <p className="mx-auto mt-4 max-w-2xl text-pretty text-[15px] leading-6 text-text-secondary">{summary}</p>}
          </header>
        </div>
      </GridWrapper>

      <section aria-labelledby="project-facts-heading" className="mt-14 px-2 sm:px-4">
        <div className="mx-auto max-w-6xl rounded-3xl border border-border-primary bg-white dark:bg-white/[0.02]">
          <div className={`grid ${project.tech.length ? "lg:grid-cols-[1.1fr_0.9fr]" : ""}`}>
            <div className="p-5 sm:p-7 lg:p-8">
              <div className="flex flex-wrap items-center justify-between gap-3">
                <h2 id="project-facts-heading" className="font-mono text-xs font-medium uppercase tracking-widest text-text-secondary">At a glance</h2>
                <div ref={shareRef} className="relative ml-auto inline-flex flex-col items-end">
                  <button
                    ref={shareTriggerRef}
                    type="button"
                    aria-expanded={shareOpen}
                    aria-controls="project-share-options"
                    onClick={(event) => {
                      if (!shareOpen) {
                        const bounds = shareTriggerRef.current?.getBoundingClientRect();
                        if (bounds) setShareAbove(window.innerHeight - bounds.bottom < 390 && bounds.top > window.innerHeight - bounds.bottom);
                      }
                      setShareOpen((open) => !open);
                      if (!shareOpen && event.detail === 0) requestAnimationFrame(() => firstShareItemRef.current?.focus());
                    }}
                    className={`inline-flex min-h-11 items-center gap-1.5 rounded-sm px-1 text-sm font-medium text-blue-600 transition-colors hover:text-blue-700 dark:text-blue-400 dark:hover:text-blue-300 ${focusStyle}`}
                  >
                    Share project <ChevronDown className={`size-3.5 transition-transform motion-reduce:transition-none ${shareOpen ? "rotate-180" : ""}`} aria-hidden />
                  </button>
                  {shareOpen && (
                    <div id="project-share-options" role="group" aria-label="Share project" className={`relative z-30 mt-1 max-h-[min(70dvh,400px)] w-[min(240px,calc(100vw-6rem))] overflow-y-auto rounded-xl border border-border-primary bg-bg-primary p-1.5 text-left shadow-lg dark:shadow-black/40 sm:absolute sm:right-0 ${shareAbove ? "sm:bottom-full sm:mb-1 sm:mt-0" : "sm:top-full sm:mt-1"}`}>
                      <p className="px-2.5 pb-1.5 pt-1 font-mono text-[10px] uppercase tracking-widest text-text-secondary">Share this case study</p>
                      <button ref={firstShareItemRef} type="button" onClick={() => copyText(projectUrl(), "URL copied")} className={`flex min-h-11 w-full items-center gap-2.5 rounded-md px-2.5 text-[13px] text-text-primary hover:bg-text-primary/5 sm:min-h-10 ${focusStyle}`}><Copy className="size-3.5 text-text-secondary" aria-hidden /> Copy URL</button>
                      <button type="button" onClick={() => copyText(markdown(), "Markdown copied")} className={`flex min-h-11 w-full items-center gap-2.5 rounded-md px-2.5 text-[13px] text-text-primary hover:bg-text-primary/5 sm:min-h-10 ${focusStyle}`}><FileText className="size-3.5 text-text-secondary" aria-hidden /> Copy as Markdown</button>
                      <button type="button" onClick={viewMarkdown} className={`flex min-h-11 w-full items-center gap-2.5 rounded-md px-2.5 text-[13px] text-text-primary hover:bg-text-primary/5 sm:min-h-10 ${focusStyle}`}><ExternalLink className="size-3.5 text-text-secondary" aria-hidden /> View as Markdown <span className="sr-only">(opens in a new tab)</span></button>
                      <div aria-hidden className="my-1 border-t border-border-primary" />
                      <a href={`https://chatgpt.com/?q=${encodeURIComponent(`Review this project case study: ${projectUrl()}`)}`} target="_blank" rel="noopener noreferrer" className={`flex min-h-11 w-full items-center gap-2.5 rounded-md px-2.5 text-[13px] text-text-primary hover:bg-text-primary/5 sm:min-h-10 ${focusStyle}`}><MessageCircle className="size-3.5 text-text-secondary" aria-hidden /> Open in ChatGPT <span className="sr-only">(opens in a new tab)</span></a>
                      <button type="button" onClick={openClaude} className={`flex min-h-11 w-full items-center gap-2.5 rounded-md px-2.5 text-[13px] text-text-primary hover:bg-text-primary/5 sm:min-h-10 ${focusStyle}`}><Sparkles className="size-3.5 text-text-secondary" aria-hidden /> Open in Claude <span className="sr-only">(opens in a new tab; prompt copied to clipboard)</span></button>
                      <div aria-hidden className="my-1 border-t border-border-primary" />
                      <a href={`mailto:?subject=${encodeURIComponent(project.title)}&body=${encodeURIComponent(`${summary}\n\n${projectUrl()}`)}`} className={`flex min-h-11 w-full items-center gap-2.5 rounded-md px-2.5 text-[13px] text-text-primary hover:bg-text-primary/5 sm:min-h-10 ${focusStyle}`}><Mail className="size-3.5 text-text-secondary" aria-hidden /> Share by email</a>
                    </div>
                  )}
                </div>
                <p role="status" aria-live="polite" className={copyStatus ? "w-full text-right text-xs leading-5 text-text-secondary" : "sr-only"}>{copyStatus}</p>
              </div>
              <dl className="mt-6 grid grid-cols-2 gap-x-5 gap-y-6 sm:grid-cols-3">
                <Fact label="Type">{project.category}</Fact>
                {project.year && <Fact label="Built">{project.year}</Fact>}
                {project.latestUpdate && <Fact label="Latest update">{project.latestUpdate}</Fact>}
                <Fact label="Visit">{project.live_url ? <a href={project.live_url} target="_blank" rel="noopener noreferrer" className={`inline-flex items-center gap-1.5 rounded-sm text-text-primary underline underline-offset-4 ${focusStyle}`}>{project.isPreview ? "Example live link" : "View live project"} <ExternalLink className="size-3.5" aria-hidden /><span className="sr-only">opens in a new tab</span></a> : <span className="text-text-secondary">{project.liveNote || "No public demo"}</span>}</Fact>
                <Fact label="Source">{sourceUrl ? <a href={sourceUrl} target="_blank" rel="noopener noreferrer" className={`inline-flex items-center gap-1.5 rounded-sm text-text-primary underline underline-offset-4 ${focusStyle}`}>{project.isPreview ? "Example source link" : "View source"} <ExternalLink className="size-3.5" aria-hidden /><span className="sr-only">opens in a new tab</span></a> : <span className="text-text-secondary">{project.sourceNote || "Source not published"}</span>}</Fact>
              </dl>
            </div>
            {project.tech.length > 0 && (
              <div className="border-t border-border-primary p-5 sm:p-7 lg:border-l lg:border-t-0 lg:p-8">
                <h2 className="font-mono text-xs font-medium uppercase tracking-widest text-text-secondary">Tech stack</h2>
                <ul className="mt-6 flex flex-wrap gap-2">
                  {project.tech.map((tech, index) => {
                    const icon = techIcons[tech.toLowerCase().replace(/[^a-z0-9]/g, "")];
                    return <li key={`${tech}-${index}`} className="inline-flex min-h-8 items-center gap-2 rounded-full border border-border-primary bg-neutral-50 px-3 py-1.5 font-mono text-[11px] text-text-secondary dark:bg-white/[0.04]">
                      {icon && <span aria-hidden className="size-3.5 shrink-0 bg-text-primary" style={{ mask: `url(https://cdn.jsdelivr.net/npm/simple-icons@v13/icons/${icon}.svg) center / contain no-repeat`, WebkitMask: `url(https://cdn.jsdelivr.net/npm/simple-icons@v13/icons/${icon}.svg) center / contain no-repeat` }} />}
                      {tech}
                    </li>;
                  })}
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
        {story.length > 0 && <div className="mt-10 border-t border-border-primary" />}
        {story.map(({ title, content }, index) => <Fragment key={title}>
          {index > 0 && <SectionRule />}
          <StorySection number={String(index + 1).padStart(2, "0")} title={title}>{content}</StorySection>
        </Fragment>)}
        {story.length > 0 && <SectionRule />}
      </article>

      {related.length > 0 && (
        <section aria-labelledby="related-projects-heading" className="mx-auto max-w-6xl px-4 py-16 sm:px-6">
          <p className="font-mono text-xs uppercase tracking-widest text-text-secondary">Continue exploring</p>
          <h2 id="related-projects-heading" className="mt-2 [font-family:var(--font-instrument-serif),serif] text-[36px] leading-none text-text-primary sm:text-[42px]">Related projects</h2>
          <div className="mt-7 grid gap-4 sm:grid-cols-2">
            {related.map((item) => <Link key={item.slug} href={`/projects/${item.slug}`} className={`group flex min-w-0 flex-col rounded-2xl border border-border-primary bg-white p-6 transition-colors hover:border-neutral-400/70 dark:bg-white/[0.02] dark:hover:border-white/25 ${focusStyle}`}>
              <span className="font-mono text-[11px] uppercase tracking-widest text-text-secondary">{item.category}</span>
              <span className="mt-4 flex items-start justify-between gap-4 [font-family:var(--font-instrument-serif),serif] text-[28px] leading-tight text-text-primary"><span className="min-w-0 break-words">{item.title}</span><ArrowUpRight aria-hidden className="mt-1 size-5 shrink-0" /></span>
              {item.tagline && <span className="mt-3 line-clamp-2 text-sm leading-6 text-text-secondary">{item.tagline}</span>}
            </Link>)}
          </div>
        </section>
      )}
      {related.length === 0 && (
        <div className="mx-auto max-w-6xl px-4 py-14 text-center sm:px-6">
          <p className="font-mono text-xs uppercase tracking-widest text-text-secondary">Keep exploring</p>
          <Link href="/projects" className={`mt-4 inline-flex min-h-11 items-center gap-2 rounded-full border border-border-primary px-5 text-sm font-medium text-text-primary transition-colors hover:border-neutral-400/70 dark:hover:border-white/25 ${focusStyle}`}>
            Browse all projects <ArrowUpRight className="size-4" aria-hidden />
          </Link>
        </div>
      )}

      <div className="mt-10"><CtaSection /></div>
    </div>
  );
}
