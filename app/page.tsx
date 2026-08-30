/* LOCKED PAGE — audited & production-approved. Do not change layout,
   typography, spacing, or behavior without explicit owner approval. */
import type { Metadata } from "next";
import { siteMetadata } from "./data/siteMetadata";
import {
  fetchProjects,
  fetchAndSortBlogPosts,
  fetchTestimonials,
  formatDate,
} from "./lib/utils";
import {
  fallbackProjects,
  fallbackPosts,
  type HomeProject,
} from "./data/fallback-home";
import { getServerStats } from "./lib/stats/server-stats";
import { getBuildTimeStats } from "./lib/stats/build-time-stats";
import { HomeHero } from "./components/home/HomeHero";
import { StatusRow } from "./components/home/StatusRow";
import { HomeBento } from "./components/home/HomeBento";
import { CaseStudies } from "./components/home/CaseStudies";
import { Writings, type WritingPost } from "./components/home/Writings";
import { AboutTeaser } from "./components/home/AboutTeaser";
import { Testimonials } from "./components/home/Testimonials";
import { MySiteGrid } from "./components/home/MySiteGrid";
import { CtaSection } from "./components/home/CtaSection";
import { HomeFaq } from "./components/home/HomeFaq";

export const revalidate = 3600;

export const metadata: Metadata = {
  title: `${siteMetadata.title} — Full-Stack Developer`,
  description: siteMetadata.description,
  openGraph: {
    title: siteMetadata.title,
    description: siteMetadata.description,
    url: siteMetadata.siteUrl,
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: siteMetadata.title,
    description: siteMetadata.description,
  },
};

const personJsonLd = {
  "@context": "https://schema.org",
  "@type": "Person",
  name: siteMetadata.author,
  url: siteMetadata.siteUrl,
  image: siteMetadata.avatarImage,
  sameAs: [siteMetadata.github, siteMetadata.linkedin, siteMetadata.twitter],
  jobTitle: "Full-Stack Developer",
  description: siteMetadata.description,
  knowsAbout: [
    "JavaScript",
    "TypeScript",
    "React",
    "Next.js",
    "Node.js",
    "Cybersecurity",
    "AI",
  ],
};

function estimateReadingTime(content: string | undefined): string {
  const words = (content || "").trim().split(/\s+/).filter(Boolean).length;
  return `${Math.max(1, Math.round(words / 200))} min read`;
}

export default async function Home() {
  const [dbProjects, dbPosts, dbTestimonials, serverStats, buildStats] =
    await Promise.all([
      fetchProjects(),
      fetchAndSortBlogPosts(),
      fetchTestimonials(),
      getServerStats().catch(() => null),
      getBuildTimeStats().catch(() => null),
    ]);

  /* Live site-wide numbers for the bento — every value is counted from
     the database (projects, blog_posts, messages, testimonials, views). */
  const siteStats = {
    projects: dbProjects.length > 0 ? dbProjects.length : fallbackProjects.length,
    posts: buildStats?.totalArticles ?? (dbPosts.length > 0 ? dbPosts.length : null),
    notes: serverStats?.communityWallMessages ?? null,
    testimonials: dbTestimonials.length > 0 ? dbTestimonials.length : null,
    views: serverStats?.totalViews ?? null,
  };

  /* Homepage case studies are owner-curated from the admin panel: any
     project with the "Featured Project" toggle on shows here (up to 6,
     in display order). If nothing is featured yet, fall back to the
     first three published projects. */
  const featuredDb = dbProjects.filter((p: any) => p.featured);
  const homeDb = (featuredDb.length > 0 ? featuredDb : dbProjects).slice(
    0,
    featuredDb.length > 0 ? 6 : 3
  );
  const projects: HomeProject[] = (
    dbProjects.length > 0
      ? homeDb.map((p: any) => ({
          title: p.title,
          slug: p.slug,
          tagline: p.short_description || p.tagline || p.description || "",
          description: p.description || "",
          tech: Array.isArray(p.tech_stack) ? p.tech_stack : [],
          // Quarter label like "Q2 2026" — uses start_date when set in
          // admin, otherwise falls back to the row's created_at.
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
      : fallbackProjects.slice(0, 3)
  );

  const posts: WritingPost[] =
    dbPosts.length > 0
      ? dbPosts.slice(0, 3).map((post) => ({
          title: post.title,
          slug: post.slug,
          summary: post.summary,
          publishedAt: post.publishedAt,
          readingTime: estimateReadingTime(post.content),
          imageName: post.imageName || "",
        }))
      : fallbackPosts.slice(0, 3);

  const formattedDates = posts.map((post) => formatDate(post.publishedAt));

  // Latest project drives the hero "New launch" block. Recency follows the
  // same date the case studies use: start_date, falling back to created_at.
  const latestProject =
    dbProjects.length > 0
      ? [...dbProjects].sort(
          (a: any, b: any) =>
            new Date(b.start_date || b.created_at || 0).getTime() -
            new Date(a.start_date || a.created_at || 0).getTime()
        )[0]
      : null;

  const latestLaunch = latestProject
    ? {
        name: latestProject.title as string,
        href: `/projects/${latestProject.slug}`,
      }
    : null;

  // Live stats for the status strip under the hero. Reuses the data
  // already fetched above; falls back to static copy when offline.
  const latestPost = posts[0];
  // Bucket every project into one of the three domains shown in the hero.
  const sourceProjects = dbProjects.length > 0 ? dbProjects : fallbackProjects;
  const domainCounts = { web: 0, cyber: 0, ai: 0 };
  /* Tech pulled from project rows, bucketed by the same domain rules —
     the bento's tech-stack marquee merges these in (deduped) so the
     stack grows automatically as new projects are added. */
  const projectTech = {
    web: [] as string[],
    security: [] as string[],
    ai: [] as string[],
  };
  for (const p of sourceProjects as any[]) {
    // Classify by category + title + tags (tech stacks mention AI/security
    // tools too often to be a reliable signal for the project's domain).
    const tags = Array.isArray(p.tags) ? p.tags.join(" ") : "";
    const hay = `${p.category ?? ""} ${p.title ?? ""} ${tags}`.toLowerCase();
    let bucket: "web" | "security" | "ai" = "web";
    if (/cyber|security|nids|intrusion|packet|sniff|pentest|forensic/.test(hay))
      bucket = "security";
    else if (/\bai\b|machine.?learning|\bml\b|gpt|llm|neural/.test(hay))
      bucket = "ai";
    if (bucket === "security") domainCounts.cyber++;
    else if (bucket === "ai") domainCounts.ai++;
    else domainCounts.web++;
    const tech = Array.isArray(p.tech_stack)
      ? p.tech_stack
      : Array.isArray(p.tech)
      ? p.tech
      : [];
    for (const t of tech)
      if (typeof t === "string" && t.trim()) projectTech[bucket].push(t.trim());
  }
  const statusData = {
    projectCount: sourceProjects.length,
    domainCounts,
    latestPostTitle: latestPost?.title,
    latestPostMeta: latestPost
      ? `${latestPost.readingTime} · ${formatDate(latestPost.publishedAt)}`
      : undefined,
    latestPostHref: latestPost ? `/blog/${latestPost.slug}` : undefined,
  };

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(personJsonLd) }}
      />
      <div className="bg-bg-primary">
        <HomeHero latestLaunch={latestLaunch} />
        <StatusRow data={statusData} />
        <div className="mt-16 space-y-32 md:mt-24">
          <HomeBento site={siteStats} projectTech={projectTech} />
          <CaseStudies projects={projects} />
          <Writings posts={posts} formattedDates={formattedDates} />
          <AboutTeaser />
          <Testimonials items={dbTestimonials} />
          <MySiteGrid />
          <HomeFaq />
          <CtaSection />
        </div>
      </div>
    </>
  );
}
