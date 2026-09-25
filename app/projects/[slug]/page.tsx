import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { fetchProjects, getProjectBySlug } from "@/app/lib/utils";
import { fallbackProjects } from "@/app/data/fallback-home";
import { withProjectPreview } from "@/app/data/project-preview-fixtures";
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

function mapDbProject(p: any): DetailProject {
  return {
    title: p.title,
    slug: p.slug,
    tagline: (p.tagline || p.short_description || p.description || "").slice(0, 160),
    description: p.description || "",
    content: p.content || "",
    tech: Array.isArray(p.tech_stack) ? p.tech_stack : [],
    year: p.year || "",
    stage: p.project_stage === "in_progress" || p.project_stage === "completed" ? p.project_stage : "",
    latestUpdate: p.latest_update_label || "",
    isPreview: p.isPreview || false,
    sections: p.case_study_sections || {},
    category: p.category || "Project",
    image_url: p.cover_image_url || (p as any).image_url || "",
    live_url: (p as any).live_url ?? "",
    github_url: (p as any).github_url ?? "",
    sourceNote: p.source_note || "",
    features: Array.isArray(p.features) ? p.features.filter(Boolean) : [],
    tags: Array.isArray((p as any).tags) ? (p as any).tags : [],
    /* Extra screenshots (sorted); the cover is filtered out client-side so
       the gallery never repeats the hero image. */
    gallery: Array.isArray(p.galleryDetails) ? p.galleryDetails : [],
  };
}

async function resolveProject(slug: string): Promise<{
  project: DetailProject;
  canonicalProject: DetailProject;
  list: NeighborProject[];
} | null> {
  const dbProject = await getProjectBySlug(slug);
  const dbProjects = await fetchProjects().catch(() => []);

  if (dbProject) {
    const list = (dbProjects.length > 0 ? dbProjects : [dbProject]).map(
      (raw: any) => {
        const p = withProjectPreview(raw);
        return {
          title: p.title,
          slug: p.slug,
          category: p.category || "Project",
          tagline: (p.tagline || p.short_description || p.description || "").slice(0, 160),
          tags: Array.isArray(p.tags) ? p.tags : [],
          tech: Array.isArray(p.tech_stack) ? p.tech_stack : [],
        };
      },
    );
    return { project: mapDbProject(withProjectPreview(dbProject)), canonicalProject: mapDbProject(dbProject), list };
  }

  if (process.env.NODE_ENV === "production" || dbProjects.length > 0) return null;
  const fb = fallbackProjects.find((p) => p.slug === slug);
  if (!fb) return null;

  const fallbackProject: DetailProject = {
      title: fb.title,
      slug: fb.slug,
      tagline: fb.tagline,
      description: fb.description,
      content: "",
      tech: fb.tech,
      year: fb.year,
      stage: "",
      latestUpdate: "",
      isPreview: false,
      sections: {},
      category: fb.category,
      image_url: fb.image_url,
      live_url: "",
      github_url: "",
      sourceNote: "",
      features: fb.features || [],
      tags: (fb as any).tags ?? [],
      gallery: [],
  };
  return {
    project: fallbackProject,
    canonicalProject: fallbackProject,
    list: fallbackProjects.map((p) => ({
      title: p.title,
      slug: p.slug,
      category: p.category,
      tagline: p.tagline,
      tags: p.tags || [],
      tech: p.tech,
    })),
  };
}

export default async function ProjectDetailPage({ params }: ProjectPageProps) {
  const { slug } = await params;
  const resolved = await resolveProject(slug);
  if (!resolved) notFound();

  const { project, canonicalProject, list } = resolved;
  const tokens = (values: string[]) => new Set(values.map((value) => value.toLowerCase().trim()));
  const tags = tokens(project.tags);
  const tech = tokens(project.tech);
  const related = list.filter((item) => item.slug !== project.slug).map((item) => {
    const sharedTags = item.tags.filter((tag) => tags.has(tag.toLowerCase().trim())).length;
    const sharedTech = item.tech.filter((name) => tech.has(name.toLowerCase().trim())).length;
    const sameSpecificType = item.category.toLowerCase() === project.category.toLowerCase()
      && !["web app", "mobile app", "other", "project"].includes(project.category.toLowerCase());
    return { item, score: sharedTags * 4 + sharedTech * 2 + Number(sameSpecificType) };
  }).filter(({ score }) => score > 0)
    .sort((a, b) => b.score - a.score || a.item.slug.localeCompare(b.item.slug))
    .slice(0, 2).map(({ item }) => item);

  return (
    <>
      {project.isPreview && <meta name="robots" content="noindex,nofollow" />}
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify({
            "@context": "https://schema.org",
            "@type": "CreativeWork",
            name: canonicalProject.title,
            ...(canonicalProject.image_url ? { image: canonicalProject.image_url } : {}),
            description: canonicalProject.tagline || canonicalProject.description,
            /* Canonical page URL — the live demo URL (when present) goes in
               sameAs instead of overloading `url`. */
            url: `${siteMetadata.siteUrl}/projects/${canonicalProject.slug}`,
            ...(canonicalProject.live_url ? { sameAs: [canonicalProject.live_url] } : {}),
          }).replace(/</g, "\\u003c"),
        }}
      />
      <ProjectDetail project={project} related={related} />
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

  const { canonicalProject: project } = resolved;
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
