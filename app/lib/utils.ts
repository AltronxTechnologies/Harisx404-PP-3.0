export interface Blog {
  title: string;
  slug: string;
  slugAsParams: string;
  summary: string;
  content: string;
  code: string;
  publishedAt: string;
  imageName: string;
  categories: string[];
  featured?: boolean;
  draft: boolean;
  headings: any[];
  audioFile?: string;
  canonicalUrl?: string;
  readingTimeMinutes?: number;
}

export interface Changelog {
  title: string;
  publishedAt: string;
  slug: string;
  code: string;
  imageName?: string;
  draft?: boolean;
}

export const changelogItems: Changelog[] = [
  { title: "Table of Contents", publishedAt: "2023-01-01", slug: "table-of-contents", code: "Mock content" },
  { title: "Stats Page", publishedAt: "2022-12-15", slug: "stats-page", code: "Mock content" }
];

import { notFound } from "next/navigation";
import { ClassValue, clsx } from "clsx";
import { twMerge } from "tailwind-merge";
import { createClient } from "@supabase/supabase-js";
import { getPublicSupabase } from "@/app/lib/supabase/safe";
import { extractHeadingsFromMdx } from "@/app/lib/toc-utils";

const supabase = getPublicSupabase();

export const formatDate = (date: string) => {
  if (!date.includes("T")) {
    date = `${date}T00:00:00`;
  }
  const targetDate = new Date(date);
  if (Number.isNaN(targetDate.getTime())) return "Date unavailable";

  const elapsedDays = Math.max(
    0,
    Math.floor((Date.now() - targetDate.getTime()) / 86_400_000),
  );
  const formattedDate =
    elapsedDays >= 365
      ? `${Math.floor(elapsedDays / 365)}y ago`
      : elapsedDays >= 30
        ? `${Math.floor(elapsedDays / 30)}mo ago`
        : elapsedDays > 0
          ? `${elapsedDays}d ago`
          : "Today";

  const fullDate = targetDate.toLocaleString("en-US", {
    month: "long",
    day: "numeric",
    year: "numeric",
    timeZone: "UTC",
  });

  return `${fullDate} (${formattedDate})`;
};

export const getTimeOfDayGreeting = () => {
  const now = new Date();
  const hours = now.getHours();

  if (hours < 12) {
    return "Good morning!";
  } else if (hours < 17) {
    return "Good afternoon!";
  } else {
    return "Good evening!";
  }
};

export const cx = (...classes: any[]) => classes.filter(Boolean).join(" ");

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export async function fetchAndSortChangelogEntrees(): Promise<Changelog[]> {
  if (!supabase) return [];
  const { data, error } = await supabase
    .from('changelogs')
    .select('*')
    .eq('status', 'published')
    .order('published_at', { ascending: false });

  if (error || !data) {
    console.warn("Supabase unavailable, using fallback content.");
    return [];
  }
  
  return data.map(post => ({
    title: post.title,
    slug: post.slug,
    content: post.content,
    code: post.content,
    publishedAt: post.published_at || new Date().toISOString(),
    imageName: post.image_url || '',
    draft: false
  }));
}

export async function fetchAndSortBlogPosts(): Promise<Blog[]> {
  if (!supabase) return [];
  try {
    const { data, error } = await supabase
      .from('blog_posts')
      .select(`
        id, title, slug, summary, content, published_at, cover_image_url, status, featured, canonical_url, reading_time_minutes,
        blog_post_tags (
          tags ( name, slug )
        )
      `)
      .eq('status', 'published')
      .lte('published_at', new Date().toISOString())
      .order('published_at', { ascending: false });

    if (error || !data) {
      console.warn("Supabase unavailable, using fallback content.");
      return [];
    }

    return data.map(post => {
      const categories = post.blog_post_tags?.map((bpt: any) => bpt.tags?.name).filter(Boolean) || [];
      return {
        title: post.title,
        slug: post.slug,
        slugAsParams: post.slug,
        summary: post.summary,
        content: post.content,
        code: post.content, // Pass raw content so next-mdx-remote can render it
        publishedAt: post.published_at || new Date().toISOString(),
        imageName: post.cover_image_url || '',
        categories: categories as string[],
        featured: post.featured === true,
        canonicalUrl: post.canonical_url || undefined,
        readingTimeMinutes: post.reading_time_minutes || undefined,
        draft: false,
        headings: extractHeadingsFromMdx(post.content)
      } as any;
    });
  } catch (error) {
    return [];
  }
}

export async function getBlogPostBySlug(slug: string): Promise<Blog | null> {
  if (!supabase) return null;
  const { data, error } = await supabase
    .from('blog_posts')
    .select(`
      id, title, slug, summary, content, published_at, cover_image_url, status, canonical_url, reading_time_minutes,
      blog_post_tags (
        tags ( name, slug )
      )
    `)
    .eq('slug', slug)
    .eq('status', 'published')
    .lte('published_at', new Date().toISOString())
    .single();

  if (error || !data) {
    return null;
  }

  const categories = data.blog_post_tags?.map((bpt: any) => bpt.tags?.name).filter(Boolean) || [];
  return {
    title: data.title,
    slug: data.slug,
    slugAsParams: data.slug,
    summary: data.summary,
    content: data.content,
    code: data.content, // Pass raw content so next-mdx-remote can render it
    publishedAt: data.published_at || new Date().toISOString(),
    imageName: data.cover_image_url || '',
    categories: categories as string[],
    canonicalUrl: data.canonical_url || undefined,
    readingTimeMinutes: data.reading_time_minutes || undefined,
    draft: false,
    headings: extractHeadingsFromMdx(data.content)
  } as any;
}

export async function getRelatedBlogPosts(
  currentPost: Blog,
  maxResults: number = 3,
): Promise<Blog[]> {
  if (!supabase) return [];
  try {
    // 1. Try to fetch the embedding for the current post
    const { data: postData } = await supabase
      .from('blog_posts')
      .select('content_embedding')
      .eq('slug', currentPost.slug)
      .eq('status', 'published')
      .lte('published_at', new Date().toISOString())
      .single();

    if (postData && postData.content_embedding) {
      // 2. Perform semantic search using the embedding
      const { data: searchResults, error } = await supabase.rpc('search_blog_posts', {
        query_embedding: postData.content_embedding,
        similarity_threshold: 0.1, // low threshold to ensure we get *some* related posts
        match_count: maxResults,
        exclude_slug: currentPost.slug
      });

      if (!error && searchResults && searchResults.length > 0) {
        // We only get basic metadata back from the RPC, so let's fetch the full post data
        // for these slugs to match the Blog interface
        const slugs = searchResults.map((s: any) => s.slug);
        const { data: fullPosts } = await supabase
          .from('blog_posts')
          .select(`
            id, title, slug, summary, content, published_at, cover_image_url, status, canonical_url, reading_time_minutes,
            blog_post_tags (
              tags ( name, slug )
            )
          `)
          .in('slug', slugs)
          .eq('status', 'published')
          .lte('published_at', new Date().toISOString());

        if (fullPosts) {
          // Map to Blog interface and preserve semantic order
          const relatedPosts = slugs.map((slug: string) => {
            const fp = fullPosts.find(p => p.slug === slug);
            if (!fp) return null;
            const categories = fp.blog_post_tags?.map((bpt: any) => bpt.tags?.name).filter(Boolean) || [];
            return {
              title: fp.title,
              slug: fp.slug,
              slugAsParams: fp.slug,
              summary: fp.summary,
              content: fp.content,
              code: fp.content,
              publishedAt: fp.published_at || new Date().toISOString(),
              imageName: fp.cover_image_url || '',
              categories: categories as string[],
              canonicalUrl: fp.canonical_url || undefined,
              readingTimeMinutes: fp.reading_time_minutes || undefined,
              draft: false,
              headings: extractHeadingsFromMdx(fp.content)
            } as any;
          }).filter(Boolean);
          
          // Fallback if we didn't get enough results from vector search
          if (relatedPosts.length >= maxResults) {
             return relatedPosts.slice(0, maxResults);
          }
        }
      }
    }
  } catch (err) {
    console.warn("Semantic search failed or pgvector not set up. Falling back to category matching.", err);
  }

  // FALLBACK: Traditional Category-based matching
  const allPosts = (await fetchAndSortBlogPosts()).filter(
    (post) => post.slug !== currentPost.slug,
  );

  const sameCategories = allPosts.filter((post) =>
    post.categories.some((category) =>
      currentPost.categories.includes(category),
    ),
  );

  const sortedByRelevance = sameCategories.sort((a, b) => {
    const aMatches = a.categories.filter((cat) =>
      currentPost.categories.includes(cat),
    ).length;
    const bMatches = b.categories.filter((cat) =>
      currentPost.categories.includes(cat),
    ).length;
    return bMatches - aMatches;
  });

  if (sortedByRelevance.length >= maxResults) {
    return sortedByRelevance.slice(0, maxResults);
  }

  const remainingPosts = allPosts.filter(
    (post) => !sortedByRelevance.some((related) => related.slug === post.slug),
  );

  return [...sortedByRelevance, ...remainingPosts].slice(0, maxResults);
}

export async function fetchAndSortChangelogPosts(): Promise<Changelog[]> {
  return fetchAndSortChangelogEntrees();
}

export function extractUniqueBlogCategories(posts: Blog[]): Set<string> {
  const categories = new Set<string>();
  posts.forEach((post) => {
    post.categories.forEach((category) => categories.add(category));
  });
  return categories;
}

export async function fetchProjects() {
  if (!supabase) return [];
  /* Server-side reads use the service key when present so the
     project_tags / project_images joins aren't blanked by RLS (those
     join tables have no public SELECT policy). The key is never exposed:
     without the NEXT_PUBLIC_ prefix it simply doesn't exist in client
     bundles, and this branch falls back to the anon client there. */
  const serviceKey =
    typeof window === "undefined" ? process.env.SUPABASE_SERVICE_ROLE_KEY : undefined;
  const db =
    serviceKey && process.env.NEXT_PUBLIC_SUPABASE_URL
      ? createClient(process.env.NEXT_PUBLIC_SUPABASE_URL, serviceKey)
      : supabase;
  const { data, error } = await db
    .from('projects')
    .select('*, project_tags ( tags ( name, slug ) ), project_images ( display_order, media ( secure_url ) )')
      .eq('status', 'published')
      .order('display_order', { ascending: true })
      .order('created_at', { ascending: true });

  if (error || !data) {
    console.warn("Supabase unavailable, using fallback content.");
    return [];
  }
  // Flatten the tag join into a simple string[] so consumers (e.g. the
  // homepage StatusRow domain classifier) can read `project.tags` directly.
  // Gallery images flatten the same way: `project.gallery` is a sorted
  // string[] of extra screenshot URLs (cover image not included).
  return data.map((p: any) => {
    const tags = p.project_tags?.map((pt: any) => pt.tags?.name).filter(Boolean) || [];
    const gallery = (p.project_images || [])
      .slice()
      .sort((a: any, b: any) => (a.display_order ?? 0) - (b.display_order ?? 0))
      .map((pi: any) => pi.media?.secure_url)
      .filter(Boolean);
    const { project_tags: _ignored, project_images: _ignored2, ...rest } = p;
    return { ...rest, tags, gallery };
  });
}

export async function getProjectBySlug(slug: string) {
  if (!supabase) return null;
  /* Same hardening as fetchProjects: service key server-side so the
     tags/gallery joins aren't blanked by RLS, and a published-only filter
     so draft projects can never leak through a guessed URL. */
  const serviceKey =
    typeof window === "undefined" ? process.env.SUPABASE_SERVICE_ROLE_KEY : undefined;
  const db =
    serviceKey && process.env.NEXT_PUBLIC_SUPABASE_URL
      ? createClient(process.env.NEXT_PUBLIC_SUPABASE_URL, serviceKey)
      : supabase;
  const { data, error } = await db
    .from('projects')
    .select('*, project_tags ( tags ( name, slug ) ), project_images ( display_order, media ( secure_url ) )')
    .eq('slug', slug)
    .eq('status', 'published')
    .single();

  if (error || !data) {
    return null;
  }
  // Flatten joins exactly like fetchProjects: tags -> string[],
  // gallery -> sorted string[] of screenshot URLs.
  const p: any = data;
  const tags = p.project_tags?.map((pt: any) => pt.tags?.name).filter(Boolean) || [];
  const gallery = (p.project_images || [])
    .slice()
    .sort((a: any, b: any) => (a.display_order ?? 0) - (b.display_order ?? 0))
    .map((pi: any) => pi.media?.secure_url)
    .filter(Boolean);
  const { project_tags: _ignored, project_images: _ignored2, ...rest } = p;
  return { ...rest, tags, gallery };
}

export async function fetchTestimonials(): Promise<import("@/app/data/fallback-home").Testimonial[]> {
  if (!supabase) return [];
  try {
    const { data, error } = await supabase
      .from('testimonials')
      .select('*')
      .eq('status', 'published')
      .order('display_order', { ascending: true });

    if (error || !data) return [];
    return data.map((row: any) => ({
      quote_headline: row.headline ?? "",
      quote: row.quote ?? "",
      name: row.name ?? "",
      role: row.role ?? "",
      avatar_url: row.avatar_url ?? null,
    }));
  } catch {
    return [];
  }
}

// ---------------------------------------------------------------------------
// Education & Certifications (about page) — null-safe fetchers.
// New tables may not exist yet in the live DB; every failure path returns []
// so callers fall back to local placeholder data.
// ---------------------------------------------------------------------------

export type CertificationRow = {
  title: string;
  issuer: string;
  issue_date: string;
  credential_url: string | null;
};

export async function fetchCertifications(): Promise<CertificationRow[]> {
  if (!supabase) return [];
  try {
    const { data, error } = await supabase
      .from('certifications')
      .select('*')
      .eq('status', 'published')
      .order('display_order', { ascending: true });

    if (error || !data) return [];
    return data.map((row: any): CertificationRow => ({
      title: row.title ?? "",
      issuer: row.issuer ?? "",
      issue_date: row.issue_date ?? "",
      credential_url: row.credential_url ?? null,
    }));
  } catch {
    return [];
  }
}

/**
 * Published experience entries for the about-page timeline, mapped from the
 * `experience` table to the LinkedIn-parity shape in app/lib/resume/types.ts.
 * Returns [] when Supabase is unconfigured, empty, or errors — callers fall
 * back to the static resume data.
 */
export async function fetchExperiences(): Promise<
  import("./resume/types").Experience[]
> {
  if (!supabase) return [];
  try {
    const { data, error } = await supabase
      .from("experience")
      .select("*")
      .eq("status", "published")
      .order("display_order", { ascending: true });

    if (error || !data) return [];
    return data.map((row: any) => {
      const highlights = Array.isArray(row.highlights)
        ? row.highlights
            .filter((h: any) => h && typeof h === "object" && (h.text || h.lead))
            .map((h: any) => ({
              lead: typeof h.lead === "string" ? h.lead : "",
              text: typeof h.text === "string" ? h.text : "",
            }))
        : [];
      // Legacy rows: parse "Bold lead: rest" out of plain bullets.
      const legacyBullets = Array.isArray(row.bullets)
        ? row.bullets
            .filter((b: any) => typeof b === "string" && b.trim())
            .map((b: string) => {
              const colon = b.indexOf(":");
              if (colon > 0 && colon < 60) {
                return { lead: b.slice(0, colon + 1), text: b.slice(colon + 1).trim() };
              }
              return { lead: "", text: b };
            })
        : [];
      return {
        id: row.id,
        jobTitle: row.role ?? "",
        organization: row.company ?? "",
        logoUrl: row.logo_url ?? undefined,
        location: row.location ?? "",
        locationType: row.location_type ?? "",
        // Empty until the LinkedIn-parity migration adds the column; the
        // timeline hides the employment-type line when blank.
        employmentType: row.employment_type ?? "",
        startMonth: row.start_month ?? undefined,
        startYear: row.start_year ?? undefined,
        endMonth: row.end_month ?? undefined,
        endYear: row.end_year ?? undefined,
        current: row.is_current ?? false,
        legacyPeriod:
          Array.from(
            new Set([row.start_date, row.end_date].filter(Boolean)),
          ).join(" — ") || undefined,
        summary: row.summary ?? undefined,
        highlights: highlights.length > 0 ? highlights : legacyBullets,
      };
    });
  } catch {
    return [];
  }
}
