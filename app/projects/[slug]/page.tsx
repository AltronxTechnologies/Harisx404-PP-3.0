import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { fetchProjects, getProjectBySlug } from "@/app/lib/utils";
import { fallbackProjects } from "@/app/data/fallback-home";
import { siteMetadata } from "@/app/data/siteMetadata";
import {
  ProjectDetail,
  type DetailProject,
  type NeighborProject,
} from "./ProjectDetail";

export const revalidate = 3600;
export const dynamicParams = true;

export async function generateStaticParams() {
  try {
    const projects = await fetchProjects();
    return (projects ?? []).map((p: { slug: string }) => ({ slug: p.slug }));
  } catch {
    return [];
  }
}

interface ProjectPageProps {
  params: Promise<{ slug: string }>;
}

function genericFeatures(title: string): string[] {
  return [
    `Thoughtful, accessible UI with full dark and light theme support across every screen of ${title}.`,
    "Type-safe end-to-end architecture with defensive data handling and graceful fallbacks.",
    "Performance-first build: optimized images, minimal client JavaScript, and fast route transitions.",
  ];
}

function formatQuarter(value: unknown): string {
  if (!value) return "";
  const date = new Date(String(value));
  if (Number.isNaN(date.getTime())) return String(value);
  return `Q${Math.floor(date.getMonth() / 3) + 1} ${date.getFullYear()}`;
}

function mapDbProject(p: any): DetailProject {
  return {
    title: p.title,
    slug: p.slug,
    tagline: p.short_description || p.tagline || "",
    description: p.description || "",
    content: p.content || "",
    tech: Array.isArray((p as any).tech_stack) ? (p as any).tech_stack : [],
    year: (p as any).year ?? formatQuarter(p.start_date || p.created_at),
    updated: formatQuarter(p.updated_at),
    role: (p as any).role || "Full-stack Developer",
    category: (p as any).category ?? "Web App",
    image_url: p.cover_image_url || (p as any).image_url || "",
    live_url: (p as any).live_url ?? "",
    github_url: (p as any).github_url ?? "",
    features:
      Array.isArray((p as any).features) && (p as any).features.length > 0
        ? (p as any).features
        : genericFeatures(p.title),
    tags: Array.isArray((p as any).tags) ? (p as any).tags : [],
    /* Extra screenshots (sorted); the cover is filtered out client-side so
       the gallery never repeats the hero image. */
    gallery: Array.isArray((p as any).gallery) ? (p as any).gallery : [],
  };
}

async function resolveProject(slug: string): Promise<{
  project: DetailProject;
  list: NeighborProject[];
} | null> {
  const dbProject = await getProjectBySlug(slug);
  const dbProjects = await fetchProjects();

  if (dbProject) {
    const list = (dbProjects.length > 0 ? dbProjects : [dbProject]).map(
      (p: any) => ({
        title: p.title,
        slug: p.slug,
        category: (p as any).category ?? "Web App",
        tagline: p.short_description || p.tagline || p.description || "",
      }),
    );
    return { project: mapDbProject(dbProject), list };
  }

  const fb = fallbackProjects.find((p) => p.slug === slug);
  if (!fb) return null;

  return {
    project: {
      title: fb.title,
      slug: fb.slug,
      tagline: fb.tagline,
      description: fb.description,
      content: fb.description,
      tech: fb.tech,
      year: fb.year,
      updated: fb.year,
      role: "Full-stack Developer",
      category: fb.category,
      image_url: fb.image_url,
      live_url: "",
      github_url: "",
      features: genericFeatures(fb.title),
      tags: (fb as any).tags ?? [],
      gallery: [],
    },
    list: fallbackProjects.map((p) => ({
      title: p.title,
      slug: p.slug,
      category: p.category,
      tagline: p.tagline,
    })),
  };
}

export default async function ProjectDetailPage({ params }: ProjectPageProps) {
  const { slug } = await params;
  const resolved = await resolveProject(slug);
  if (!resolved) notFound();

  const { project, list } = resolved;
  const idx = list.findIndex((p) => p.slug === project.slug);
  const prev = idx > 0 ? list[idx - 1] : null;
  const next = idx >= 0 && idx < list.length - 1 ? list[idx + 1] : null;

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify({
            "@context": "https://schema.org",
            "@type": "CreativeWork",
            name: project.title,
            ...(project.image_url ? { image: project.image_url } : {}),
            description: project.tagline || project.description,
            /* Canonical page URL — the live demo URL (when present) goes in
               sameAs instead of overloading `url`. */
            url: `${siteMetadata.siteUrl}/projects/${project.slug}`,
            ...(project.live_url ? { sameAs: [project.live_url] } : {}),
          }),
        }}
      />
      <ProjectDetail project={project} prev={prev} next={next} />
    </>
  );
}

export async function generateMetadata({
  params,
}: ProjectPageProps): Promise<Metadata> {
  const { slug } = await params;
  const resolved = await resolveProject(slug);

  if (!resolved) {
    return { title: "Project Not Found" };
  }

  const { project } = resolved;
  const description = project.tagline || project.description;
  const ogImage =
    project.image_url ||
    `/api/og?title=${encodeURIComponent(project.title)}${description ? `&summary=${encodeURIComponent(description)}` : ""}`;

  return {
    title: project.title,
    description,
    openGraph: {
      title: project.title,
      description,
      type: "website",
      images: [
        {
          url: ogImage,
          width: 1200,
          height: 630,
          alt: project.title,
        },
      ],
    },
    twitter: {
      card: "summary_large_image",
      title: project.title,
      description,
      images: [ogImage],
    },
  };
}
