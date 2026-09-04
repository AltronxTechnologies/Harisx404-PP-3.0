"use client";

import { useEffect, useRef, useState, type ReactNode } from "react";
import Image from "next/image";
import Link from "next/link";
import { motion, useReducedMotion } from "framer-motion";
import { CtaSection } from "@/app/components/home/CtaSection";
import { siteMetadata } from "@/app/data/siteMetadata";
import { optimizeImageUrl } from "@/app/lib/image-utils";

export type DetailProject = {
  title: string;
  slug: string;
  tagline: string;
  description: string;
  content: string;
  tech: string[];
  year: string;
  updated: string;
  role: string;
  category: string;
  image_url: string;
  live_url: string;
  github_url: string;
  features: string[];
  tags: string[];
  gallery: string[];
};

export type NeighborProject = {
  title: string;
  slug: string;
  category: string;
  tagline?: string;
};

function Chevron() {
  return (
    <svg aria-hidden viewBox="0 0 12 12" className="size-3" fill="none">
      <path d="m4 2 4 4-4 4" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

function ExternalArrow() {
  return (
    <svg aria-hidden viewBox="0 0 12 12" className="size-3" fill="none">
      <path d="M2 10 10 2m0 0H4m6 0v6" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

function LinkIcon() {
  return (
    <svg aria-hidden viewBox="0 0 24 24" className="size-4" fill="none">
      <path d="m9.5 14.5 5-5m-7.1 8.1-1 .9a3.5 3.5 0 0 1-5-5l3-3a3.5 3.5 0 0 1 5 0m7.2-4.1 1-.9a3.5 3.5 0 1 1 5 5l-3 3a3.5 3.5 0 0 1-5 0" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
    </svg>
  );
}

function MenuIcon({ type }: { type: "link" | "copy" | "markdown" | "chatgpt" | "claude" }) {
  if (type === "link") return <LinkIcon />;
  if (type === "copy") return <span aria-hidden className="relative block size-4 border border-current before:absolute before:-left-1 before:-top-1 before:size-4 before:border before:border-current" />;
  if (type === "markdown") return <span aria-hidden className="flex h-3.5 w-5 items-center justify-center border border-current font-mono text-[7px] font-bold">M↧</span>;
  if (type === "chatgpt") return <span aria-hidden className="text-lg leading-none">◎</span>;
  return <span aria-hidden className="text-xl leading-none">✺</span>;
}

function Fact({ label, children }: { label: string; children: ReactNode }) {
  return (
    <div className="min-w-0">
      <p className="mb-1.5 font-mono text-[10px] uppercase tracking-wider text-text-secondary">{label}</p>
      <div className="break-words text-sm font-medium text-text-primary">{children}</div>
    </div>
  );
}

function SectionRule() {
  return (
    <div aria-hidden className="flex flex-col gap-4">
      <div className="border-t border-border-primary" />
      <div className="border-t border-border-primary" />
    </div>
  );
}

function StorySection({
  number,
  title,
  children,
}: {
  number: string;
  title: string;
  children: ReactNode;
}) {
  return (
    <section className="grid grid-cols-1 lg:grid-cols-12">
      <div className="px-4 pt-8 sm:px-6 lg:col-span-3 lg:py-16">
        <div className="space-y-2 lg:sticky lg:top-32">
          <span className="font-mono text-xs font-bold text-text-secondary">{number}</span>
          <h2 className="font-display text-2xl font-medium tracking-wide text-text-primary sm:text-3xl">{title}</h2>
        </div>
      </div>
      <div aria-hidden className="hidden border-x border-dashed border-border-primary lg:col-span-1 lg:block" />
      <div className="px-4 py-8 sm:px-6 lg:col-span-8 lg:py-16">{children}</div>
    </section>
  );
}

function Prose({ children }: { children: ReactNode }) {
  return <div className="space-y-6 text-base leading-8 text-text-secondary">{children}</div>;
}

export function ProjectDetail({
  project,
  prev,
  next,
}: {
  project: DetailProject;
  prev: NeighborProject | null;
  next: NeighborProject | null;
}) {
  const reducedMotion = useReducedMotion();
  const [shareOpen, setShareOpen] = useState(false);
  const [copied, setCopied] = useState<"url" | "markdown" | null>(null);
  const shareRef = useRef<HTMLDivElement>(null);
  const paragraphs = (project.content || project.description || "")
    .split(/\n\s*\n|\n/)
    .map((value) => value.trim())
    .filter(Boolean);
  const galleryImages = (project.gallery || []).filter((url) => url && url !== project.image_url);
  const upNext = next ?? prev;
  const canonicalUrl = `${siteMetadata.siteUrl}/projects/${project.slug}`;
  const reveal = {
    initial: reducedMotion ? false : { opacity: 0, y: 18 },
    whileInView: { opacity: 1, y: 0 },
    viewport: { once: true, margin: "-60px" },
    transition: { duration: 0.55, ease: "easeOut" as const },
  };

  useEffect(() => {
    if (!shareOpen) return;
    const close = (event: MouseEvent) => {
      if (!shareRef.current?.contains(event.target as Node)) setShareOpen(false);
    };
    const escape = (event: KeyboardEvent) => {
      if (event.key === "Escape") setShareOpen(false);
    };
    document.addEventListener("mousedown", close);
    document.addEventListener("keydown", escape);
    return () => {
      document.removeEventListener("mousedown", close);
      document.removeEventListener("keydown", escape);
    };
  }, [shareOpen]);

  const markdown = `# ${project.title}\n\n${project.tagline || project.description}\n\n- Type: ${project.category}\n- Role: ${project.role}\n- Built: ${project.year || "—"}\n- Tech: ${project.tech.join(", ")}\n\n${project.content || project.description}`;

  const copyText = async (text: string, kind: "url" | "markdown") => {
    try {
      await navigator.clipboard.writeText(text);
    } catch {
      // Clipboard can be unavailable on insecure local origins.
      const textarea = document.createElement("textarea");
      textarea.value = text;
      textarea.style.position = "fixed";
      textarea.style.opacity = "0";
      document.body.appendChild(textarea);
      textarea.select();
      document.execCommand("copy");
      textarea.remove();
    }
    setCopied(kind);
    window.setTimeout(() => setCopied(null), 1800);
  };

  const viewMarkdown = () => {
    const blob = new Blob([markdown], { type: "text/markdown" });
    const url = URL.createObjectURL(blob);
    window.open(url, "_blank", "noopener,noreferrer");
    window.setTimeout(() => URL.revokeObjectURL(url), 30_000);
    setShareOpen(false);
  };

  return (
    <div className="-mx-2 -mt-16 bg-bg-primary sm:-mx-3 sm:-mt-20 lg:mx-[15px]">
      <div className="relative overflow-hidden">
        {project.image_url && (
          <div aria-hidden className="pointer-events-none absolute inset-x-0 top-0 h-80 overflow-hidden [mask-image:linear-gradient(to_bottom,black_15%,transparent_100%)]">
            <Image
              src={optimizeImageUrl(project.image_url, 1600)}
              alt=""
              fill
              priority
              sizes="100vw"
              className="scale-105 object-cover opacity-[0.08] grayscale contrast-125 dark:opacity-[0.1]"
            />
            <div className="absolute inset-0 bg-bg-primary/65" />
          </div>
        )}

        <motion.header {...reveal} className="relative px-4 pb-7 pt-56 sm:px-6">
          <nav aria-label="Breadcrumb">
            <ol className="flex min-w-0 items-center gap-1.5 text-xs text-text-secondary">
              <li><Link href="/" className="transition-colors hover:text-text-primary">Home</Link></li>
              <li aria-hidden><Chevron /></li>
              <li><Link href="/projects" className="transition-colors hover:text-text-primary">Projects</Link></li>
              <li aria-hidden><Chevron /></li>
              <li aria-current="page" className="truncate text-text-secondary">{project.title}</li>
            </ol>
          </nav>

          <h1 className="mt-5 break-words font-display text-4xl font-normal leading-10 text-text-primary">
            {project.title}
          </h1>
          <div className="mt-5 flex flex-col items-end gap-4 sm:flex-row sm:items-end sm:justify-between">
            <p className="max-w-2xl text-base leading-6 text-text-secondary md:text-lg md:leading-7">{project.tagline || project.description}</p>
            <div ref={shareRef} className="relative shrink-0">
              <button
                type="button"
                onClick={() => setShareOpen((open) => !open)}
                aria-haspopup="menu"
                aria-expanded={shareOpen}
                aria-controls="project-share-menu"
                className="group inline-flex min-h-11 items-center gap-2 text-sm font-medium text-blue-600 transition-colors hover:text-blue-700 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-blue-500 dark:text-blue-400 dark:hover:text-blue-300"
              >
                <LinkIcon />
                Copy URL
                <svg aria-hidden viewBox="0 0 12 12" className={`ml-1 size-3 transition-transform ${shareOpen ? "rotate-180" : ""}`} fill="none">
                  <path d="m2 7 4-4 4 4" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" />
                </svg>
              </button>

              {shareOpen && (
                <motion.div
                  id="project-share-menu"
                  role="menu"
                  initial={reducedMotion ? false : { opacity: 0, y: -4, scale: 0.98 }}
                  animate={{ opacity: 1, y: 0, scale: 1 }}
                  transition={{ duration: 0.16, ease: "easeOut" }}
                  className="absolute right-0 top-full z-30 w-[292px] max-w-[calc(100vw-2rem)] overflow-hidden rounded-[22px] border border-border-primary bg-bg-primary p-2 shadow-2xl"
                >
                  <button role="menuitem" onClick={() => copyText(canonicalUrl, "url")} className="flex min-h-10 w-full items-center gap-4 rounded-xl px-2.5 text-left text-base font-medium text-text-primary transition-colors hover:bg-text-primary/5 focus:bg-text-primary/5 focus:outline-none">
                    <MenuIcon type="link" /> {copied === "url" ? "URL copied" : "Copy URL"}
                  </button>
                  <button role="menuitem" onClick={() => copyText(markdown, "markdown")} className="flex min-h-10 w-full items-center gap-4 rounded-xl px-2.5 text-left text-base font-medium text-text-primary transition-colors hover:bg-text-primary/5 focus:bg-text-primary/5 focus:outline-none">
                    <MenuIcon type="copy" /> {copied === "markdown" ? "Markdown copied" : "Copy as Markdown"}
                  </button>
                  <button role="menuitem" onClick={viewMarkdown} className="flex min-h-10 w-full items-center gap-4 rounded-xl px-2.5 text-left text-base font-medium text-text-primary transition-colors hover:bg-text-primary/5 focus:bg-text-primary/5 focus:outline-none">
                    <MenuIcon type="markdown" /> View as Markdown
                  </button>
                  <a role="menuitem" href={`https://chatgpt.com/?q=${encodeURIComponent(`Review this project case study: ${canonicalUrl}`)}`} target="_blank" rel="noreferrer" className="flex min-h-10 items-center gap-4 rounded-xl px-2.5 text-base font-medium text-text-primary transition-colors hover:bg-text-primary/5 focus:bg-text-primary/5 focus:outline-none">
                    <MenuIcon type="chatgpt" /> <span className="flex-1">Open in ChatGPT</span><span aria-hidden className="text-text-secondary">↗</span>
                  </a>
                  <a role="menuitem" href="https://claude.ai/new" target="_blank" rel="noreferrer" className="flex min-h-10 items-center gap-4 rounded-xl px-2.5 text-base font-medium text-text-primary transition-colors hover:bg-text-primary/5 focus:bg-text-primary/5 focus:outline-none">
                    <MenuIcon type="claude" /> <span className="flex-1">Open in Claude</span><span aria-hidden className="text-text-secondary">↗</span>
                  </a>
                </motion.div>
              )}
            </div>
          </div>
        </motion.header>

        <motion.div {...reveal} className="relative mt-8 border-y border-border-primary">
          <div className="grid grid-cols-1 lg:grid-cols-2">
            <div className="grid grid-cols-2 gap-x-8 gap-y-7 px-4 py-[30px] sm:px-6">
              <Fact label="Type">{project.category}</Fact>
              <Fact label="Role">{project.role}</Fact>
              <Fact label="Built">{project.year || "—"}</Fact>
              <Fact label="Updated">{project.updated || project.year || "—"}</Fact>
              <Fact label="Visit">
                {project.live_url ? (
                  <a href={project.live_url} target="_blank" rel="noreferrer" className="group inline-flex items-center gap-1.5 text-blue-600 hover:text-blue-700 dark:text-blue-400 dark:hover:text-blue-300">
                    Live site <ExternalArrow />
                  </a>
                ) : <span className="text-text-secondary">Not public</span>}
              </Fact>
              <Fact label="Source">
                {project.github_url ? (
                  <a href={project.github_url} target="_blank" rel="noreferrer" className="group inline-flex items-center gap-1.5 text-blue-600 hover:text-blue-700 dark:text-blue-400 dark:hover:text-blue-300">
                    GitHub <ExternalArrow />
                  </a>
                ) : <span className="text-text-secondary">Private</span>}
              </Fact>
            </div>

            <div className="border-t border-border-primary px-4 py-[30px] sm:px-6 lg:border-l lg:border-t-0">
              <p className="mb-3 font-mono text-[10px] uppercase tracking-wider text-text-secondary">Tech Stack</p>
              <div className="flex flex-wrap gap-2">
                {project.tech.map((tech) => (
                  <span key={tech} className="rounded-md bg-text-primary/5 px-2.5 py-[5px] font-mono text-[11px] uppercase tracking-wide text-text-secondary dark:bg-white/5">
                    {tech}
                  </span>
                ))}
              </div>
            </div>
          </div>
        </motion.div>
      </div>

      <article>
        <StorySection number="01" title="Why I Built This">
          <Prose>
            {(paragraphs.length ? paragraphs : [project.description]).slice(0, 2).map((paragraph, index) => <p key={index}>{paragraph}</p>)}
          </Prose>
        </StorySection>

        {project.image_url && (
          <>
            <SectionRule />
            <motion.figure {...reveal} className="relative aspect-video overflow-hidden rounded-2xl border border-border-primary bg-bg-primary">
              <Image src={optimizeImageUrl(project.image_url, 1600)} alt={`${project.title} interface`} fill priority sizes="100vw" className="object-cover" />
            </motion.figure>
          </>
        )}

        <SectionRule />
        <StorySection number="02" title="How It Works">
          <Prose>
            {project.features.map((feature, index) => (
              <p key={index}><strong className="font-medium text-text-primary">{String(index + 1).padStart(2, "0")}.</strong> {feature}</p>
            ))}
          </Prose>
        </StorySection>

        <SectionRule />
        <StorySection number="03" title="Key Decisions">
          <Prose>
            <p>The project combines {project.tech.slice(0, 4).join(", ") || "a focused modern stack"} to keep the experience reliable, maintainable, and fast.</p>
            <p>{project.description}</p>
          </Prose>
        </StorySection>

        {galleryImages.length > 0 && (
          <>
            <SectionRule />
            <StorySection number="04" title="Gallery">
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                {galleryImages.map((src, index) => (
                  <div key={src} className="relative aspect-video overflow-hidden rounded-2xl border border-border-primary">
                    <Image src={optimizeImageUrl(src, 1000)} alt={`${project.title} screenshot ${index + 2}`} fill sizes="(max-width: 640px) 100vw, 50vw" className="object-cover" />
                  </div>
                ))}
              </div>
            </StorySection>
          </>
        )}
        <div className="border-t border-border-primary" />
      </article>

      {upNext && (
        <Link href={`/projects/${upNext.slug}`} className="group flex flex-col items-center px-4 py-16 text-center sm:px-6 md:py-20">
          <div className="flex w-full max-w-xl items-center gap-4 text-text-secondary">
            <span className="h-px flex-1 bg-border-primary" />
            <span aria-hidden className="font-display text-2xl">⌁</span>
            <p className="font-mono text-[10px] uppercase tracking-[0.25em]">Up Next</p>
            <span aria-hidden className="font-display text-2xl">⌁</span>
            <span className="h-px flex-1 bg-border-primary" />
          </div>
          <h2 className="mt-8 max-w-3xl font-display text-4xl font-medium text-text-primary transition-colors group-hover:text-text-secondary md:text-5xl">{upNext.title}</h2>
          {upNext.tagline && <p className="mt-4 max-w-xl text-sm leading-relaxed text-text-secondary">{upNext.tagline}</p>}
          <div className="mt-7 flex items-center gap-3">
            <span className="font-mono text-[10px] uppercase tracking-widest text-text-secondary">{upNext.category}</span>
            <span className="flex size-9 items-center justify-center rounded-full border border-dashed border-border-primary transition-colors group-hover:border-neutral-400/70 group-active:border-neutral-400/70 dark:group-hover:border-white/25 dark:group-active:border-white/25">↗</span>
          </div>
        </Link>
      )}

      <div className="mt-8">
        <CtaSection />
      </div>
    </div>
  );
}
