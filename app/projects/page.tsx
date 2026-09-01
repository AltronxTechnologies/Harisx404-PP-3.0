/* ────────────────────────────────────────────────────────────────────
   LOCKED PAGE — audited & production-approved (like Home and About).
   Do not change layout, typography, spacing, card geometry, or theme
   behavior here or in ProjectsIndex/CaseStudyCard (projects variant)
   without explicit owner approval.
   ──────────────────────────────────────────────────────────────────── */
import type { Metadata } from "next";
import { fetchProjects } from "@/app/lib/utils";
import {
  fallbackProjects,
  type HomeProject,
} from "@/app/data/fallback-home";
import { ProjectsIndex } from "./ProjectsIndex";
import { CtaSection } from "@/app/components/home/CtaSection";
import { siteMetadata } from "app/data/siteMetadata";

export const revalidate = 3600;

export const metadata: Metadata = {
  title: "Projects",
  description:
    "A curated collection of case studies — web apps, mobile apps, and experiments built by Muhammad Haris.",
};

export default async function ProjectsPage() {
  const dbProjects = await fetchProjects();

  // Newest first — most recent start_date (or created_at) at the top,
  // so a freshly added project always leads the page.
  const sorted = [...dbProjects].sort((a: any, b: any) => {
    const ta = new Date(a.start_date || a.created_at || 0).getTime();
    const tb = new Date(b.start_date || b.created_at || 0).getTime();
    return tb - ta;
  });

  const projects: HomeProject[] =
    sorted.length > 0
      ? sorted.map((p: any) => ({
          title: p.title,
          slug: p.slug,
          tagline: p.short_description || p.tagline || p.description || "",
          description: p.description || "",
          tech: Array.isArray(p.tech_stack) ? p.tech_stack : [],
          // Quarter label like "Q2 2026" — identical to the homepage cards.
          year: (() => {
            const d = p.start_date || p.created_at;
            if (!d) return "";
            const dt = new Date(d);
            return `Q${Math.floor(dt.getMonth() / 3) + 1} ${dt.getFullYear()}`;
          })(),
          category: (p.category as HomeProject["category"]) || "Web App",
          image_url: p.cover_image_url || "",
          images: [p.cover_image_url, ...(Array.isArray(p.gallery) ? p.gallery : [])]
            .filter(Boolean)
            .filter((v: string, i: number, a: string[]) => a.indexOf(v) === i),
          tags: Array.isArray(p.tags) ? p.tags.slice(0, 3) : [],
          features: Array.isArray(p.features) ? p.features : [],
        }))
      : fallbackProjects;

  /* JSON-LD: ItemList of case studies for rich search results. */
  const itemListJsonLd = {
    "@context": "https://schema.org",
    "@type": "ItemList",
    name: "Projects by Muhammad Haris",
    itemListElement: projects.map((p, i) => ({
      "@type": "ListItem",
      position: i + 1,
      url: `${siteMetadata.siteUrl}/projects/${p.slug}`,
      name: p.title,
    })),
  };

  // SITE STANDARD (locked): every page except home uses mt-14 (56px)
  // as its page top margin. Home keeps its own hero spacing.
  return (
    <div className="mt-14 bg-bg-primary">
      <div className="px-2 sm:px-4">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(itemListJsonLd) }}
      />
      {/* -mt-8 cancels the frame's internal py-8 top padding so the kicker
          sits at exactly mt-14 (56px) on screen — same as the About page.
          The whole drawing-sheet block (grid, compass, crop marks) shifts
          together, so the frame design is unchanged. */}
      <div className="relative -mt-8 px-4 text-center xl:px-0">
        {/* ── "Drawn to scale" — the header as a live drawing sheet ──────
            Layer 1: blueprint grid (24px minor / 120px major). Minor grid
            is quieter in light mode so it reads as architectural vellum,
            not graph paper. Radial mask focuses it behind the heading. */}
        <div
          aria-hidden
          className="pointer-events-none absolute -inset-x-4 bottom-[-72px] top-[-128px] sm:-inset-x-7 xl:-inset-x-3 [background-image:linear-gradient(to_right,rgba(100,106,124,0.09)_1px,transparent_1px),linear-gradient(to_bottom,rgba(100,106,124,0.09)_1px,transparent_1px),linear-gradient(to_right,rgba(100,106,124,0.22)_1px,transparent_1px),linear-gradient(to_bottom,rgba(100,106,124,0.22)_1px,transparent_1px)] [background-size:24px_24px,24px_24px,120px_120px,120px_120px] [mask-image:radial-gradient(ellipse_95%_110%_at_50%_0%,black_35%,transparent_92%)] dark:[background-image:linear-gradient(to_right,rgba(255,255,255,0.07)_1px,transparent_1px),linear-gradient(to_bottom,rgba(255,255,255,0.07)_1px,transparent_1px),linear-gradient(to_right,rgba(255,255,255,0.14)_1px,transparent_1px),linear-gradient(to_bottom,rgba(255,255,255,0.14)_1px,transparent_1px)] sm:top-[-144px] md:top-[-176px]"
        />
        {/* Layer 2 (dark only): a neutral atmospheric lift behind the
            heading — depth without neon. Invisible in light mode. */}
        <div
          aria-hidden
          className="pointer-events-none absolute -inset-x-2 bottom-[-72px] top-[-128px] hidden bg-[radial-gradient(ellipse_55%_45%_at_50%_18%,rgba(148,163,184,0.07),transparent_70%)] dark:block sm:-inset-x-3 lg:inset-x-0"
        />
        {/* Layer 3: construction geometry — a single faint compass circle,
            deliberately off-axis behind the heading (every real drawing
            starts with construction lines). Hidden on phones where it
            would crowd the type. */}
        <div
          aria-hidden
          className="pointer-events-none absolute -top-20 left-1/2 hidden size-[380px] -translate-x-[72%] rounded-full border border-[rgba(100,106,124,0.40)] [mask-image:linear-gradient(to_bottom,black,transparent_85%)] dark:border-white/[0.12] sm:block md:size-[440px]"
        />
        <div className="relative mx-auto max-w-3xl px-6 py-8 sm:px-10">
          {/* Drafting crop marks — corner brackets framing the header. */}
          <span
            aria-hidden
            className="pointer-events-none absolute left-0 top-0 size-4 border-l border-t border-[rgba(100,106,124,0.55)] dark:border-text-tertiary/40"
          />
          <span
            aria-hidden
            className="pointer-events-none absolute right-0 top-0 size-4 border-r border-t border-[rgba(100,106,124,0.55)] dark:border-text-tertiary/40"
          />
          <span
            aria-hidden
            className="pointer-events-none absolute bottom-0 left-0 size-4 border-b border-l border-[rgba(100,106,124,0.55)] dark:border-text-tertiary/40"
          />
          <span
            aria-hidden
            className="pointer-events-none absolute bottom-0 right-0 size-4 border-b border-r border-[rgba(100,106,124,0.55)] dark:border-text-tertiary/40"
          />

          <p className="font-mono text-xs font-medium uppercase tracking-[0.35em] text-text-secondary">
            Selected Projects
          </p>
          <h1 className="heading-glow mt-4 font-display text-4xl font-medium leading-[1.05] text-text-primary md:text-[56px]">
            Things I&apos;ve{" "}
            <span className="text-gradient-animated font-display italic">
              built
            </span>
          </h1>
          <p className="mx-auto mt-4 max-w-xl text-sm leading-relaxed text-text-secondary">
            A collection of work across full-stack web, cybersecurity, and
            AI/ML — every project here was designed, built, and shipped to
            solve a real problem.
          </p>
        </div>
      </div>

      <ProjectsIndex projects={projects} />
      </div>

      {/* Same closing CTA as Home and About — browse the work, get in touch.
          Lives outside the px-2/sm:px-4 wrapper so CtaSection's own negative
          margins line up exactly like they do on the homepage and about. */}
      <div className="mt-28">
        <CtaSection />
      </div>
    </div>
  );
}
