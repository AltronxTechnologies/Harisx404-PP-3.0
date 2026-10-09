/* LOCKED PAGE — audited & production-approved. Do not change layout,
   typography, spacing, or behavior without explicit owner approval. */
import type { Metadata } from "next";
import { Suspense } from "react";
import { siteMetadata } from "./data/siteMetadata";
import {
  formatDate,
} from "./lib/utils";
import {
  fetchCachedProjects,
  fetchCachedTestimonials,
} from "./lib/public-page-data";
import {
  fetchBlogIndexPosts,
  fetchBlogReactionSummaries,
  type BlogIndexPost,
} from "./blog/data";
import {
  fallbackProjects,
  fallbackPosts,
  type HomeProject,
} from "./data/fallback-home";
import { withProjectPreview } from "./data/project-preview-fixtures";
import { getSupabaseEnv } from "./lib/supabase/safe";
import { fetchCredentialCollection } from "./credentials/data";
import { summarizeCredentials } from "./credentials/summary";
import {
  GitHubActivityBentoServer,
  GitHubActivityBentoSkeleton,
} from "./components/github/GitHubActivityBentoServer";
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

export const revalidate = 60;

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

export default async function Home() {
  const hasConnectedContent = process.env.NODE_ENV !== "development" || Boolean(getSupabaseEnv());
  const [dbProjects, dbPosts, dbTestimonials, credentials] =
    await Promise.all([
      fetchCachedProjects(),
      fetchBlogIndexPosts().catch((): BlogIndexPost[] => []),
      fetchCachedTestimonials(),
      fetchCredentialCollection().catch(() => []),
    ]);
  const credentialSummary = summarizeCredentials(credentials);

  /* Homepage case studies are explicitly selected and ordered in Admin. */
  const featuredDb = dbProjects.filter((p: any) => p.featured);
  const homeDb = featuredDb.map((project: any) => withProjectPreview(project));
  const projects: HomeProject[] = (
    dbProjects.length > 0
      ? homeDb.map((p: any) => ({
          title: p.title,
          slug: p.slug,
          tagline: (p.tagline || p.short_description || p.description || "").slice(0, 160),
          description: (p.tagline || p.short_description || p.description || "").slice(0, 160),
          tech: Array.isArray(p.tech_stack) ? p.tech_stack : [],
          year: p.year || p.created_at?.slice(0, 4) || "",
          category: (p.category as HomeProject["category"]) || "Web App",
          image_url: p.cover_image_url || "",
          images: [p.cover_image_url, ...(Array.isArray(p.gallery) ? p.gallery : [])]
            .filter(Boolean)
            .filter((v: string, i: number, a: string[]) => a.indexOf(v) === i),
          tags: Array.isArray(p.tags) ? p.tags.slice(0, 3) : [],
          features: Array.isArray(p.features) ? p.features : [],
        }))
      : hasConnectedContent ? [] : fallbackProjects.slice(0, 3)
  );

  const reactionSummaries = await fetchBlogReactionSummaries(
    dbPosts.map((post) => post.slug),
  );
  const featuredPost = dbPosts.reduce<BlogIndexPost | undefined>(
    (best, post) =>
      !best ||
      (reactionSummaries[post.slug]?.total || 0) >
        (reactionSummaries[best.slug]?.total || 0)
        ? post
        : best,
    undefined,
  );
  const selectedPosts = featuredPost
    ? [featuredPost, ...dbPosts.filter((post) => post.slug !== featuredPost.slug)].slice(0, 3)
    : [];
  const posts: WritingPost[] =
    selectedPosts.length > 0
      ? selectedPosts.map((post, index) => ({
          title: post.title,
          slug: post.slug,
          href: `/blog/${post.slug}`,
          summary: post.summary,
          publishedAt: post.publishedAt,
          readingTime: post.readingTime,
          imageName: post.imageName || "",
          badge: index === 0 ? "Featured" : "Latest",
          reactionSummary: reactionSummaries[post.slug],
        }))
       : (hasConnectedContent ? [] : fallbackPosts.slice(0, 3)).map((post, index) => ({
          ...post,
          badge: index === 0 ? "Featured" : "Latest",
        }));

  const formattedDates = posts.map((post) => formatDate(post.publishedAt));

  const latestProject = featuredDb[0];

  const latestLaunch = latestProject
      ? {
          name: latestProject.title as string,
          href: `/projects/${latestProject.slug}`,
        }
    : hasConnectedContent
      ? { name: dbProjects.length ? "Explore all projects" : "Case studies coming soon", href: "/projects", label: "Projects", subline: dbProjects.length ? "Browse the full collection" : "Work in progress" }
      : null;

  // Live stats for the status strip under the hero. Reuses the data
  // already fetched above; falls back to static copy when offline.
  const latestPost = posts[0];
  // Bucket every project into one of the three domains shown in the hero.
  const sourceProjects = dbProjects.length > 0 ? dbProjects : hasConnectedContent ? [] : fallbackProjects;
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
    // Classify primarily by the curated Project Domain/Category selected in Admin,
    // with fallback to title/tags for legacy unclassified entries.
    const cat = String(p.category ?? "").trim().toLowerCase();
    let bucket: "web" | "security" | "ai" = "web";
    if (cat === "cybersecurity" || cat.includes("security") || cat.includes("cyber")) {
      bucket = "security";
    } else if (cat === "ai / ml" || cat === "ai" || cat.includes("machine learning") || cat.includes("ai &")) {
      bucket = "ai";
    } else if (cat === "web development" || cat.includes("web") || cat.includes("saas")) {
      bucket = "web";
    } else {
      const tags = Array.isArray(p.tags) ? p.tags.join(" ") : "";
      const hay = `${p.title ?? ""} ${tags}`.toLowerCase();
      if (/cyber|security|nids|intrusion|packet|sniff|pentest|forensic/.test(hay))
        bucket = "security";
      else if (/\bai\b|machine.?learning|\bml\b|gpt|llm|neural/.test(hay))
        bucket = "ai";
      else
        bucket = "web";
    }
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
    latestPostLabel: hasConnectedContent && !latestPost ? "Blog" : undefined,
    latestPostTitle: latestPost?.title ?? (hasConnectedContent ? "Articles coming soon" : undefined),
    latestPostMeta: latestPost
      ? `${latestPost.readingTime} · ${formatDate(latestPost.publishedAt)}`
      : undefined,
    latestPostHref: latestPost?.href ?? (latestPost ? `/blog/${latestPost.slug}` : undefined),
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
        <div className="mt-16 space-y-28 md:mt-24">
          <HomeBento
            projectTech={projectTech}
            githubCard={
              <Suspense fallback={<GitHubActivityBentoSkeleton />}>
                <GitHubActivityBentoServer />
              </Suspense>
            }
          />
          {projects.length > 0 && <CaseStudies projects={projects} />}
          <Writings posts={posts} formattedDates={formattedDates} />
          <AboutTeaser />
          <Testimonials items={dbTestimonials} />
          <MySiteGrid credentialSummary={credentialSummary} />
          <HomeFaq />
          <CtaSection />
        </div>
      </div>
    </>
  );
}
