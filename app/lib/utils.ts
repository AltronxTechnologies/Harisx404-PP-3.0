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
  relatedBlogPostIds?: string[];
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
  if (!supabase) throw new Error("Blog data is unavailable");
  const now = new Date().toISOString();
  let { data, error } = await supabase.from('blog_posts').select(`
    id, title, slug, summary, content, published_at, cover_image_url, status, canonical_url, reading_time_minutes, related_blog_post_ids,
    blog_post_tags ( tags ( name, slug ) )
  `).eq('slug', slug).eq('status', 'published').lte('published_at', now).single();
  if (error && ['42703', 'PGRST204'].includes(error.code) && error.message.includes('related_blog_post_ids')) {
    const fallback = await supabase.from('blog_posts').select(`
      id, title, slug, summary, content, published_at, cover_image_url, status, canonical_url, reading_time_minutes,
      blog_post_tags ( tags ( name, slug ) )
    `).eq('slug', slug).eq('status', 'published').lte('published_at', now).single();
    data = fallback.data as typeof data;
    error = fallback.error;
  }

  if (error && error.code !== "PGRST116") {
    throw new Error("Unable to load Blog article");
  }
  if (!data) {
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
    relatedBlogPostIds: data.related_blog_post_ids ?? [],
    draft: false,
    headings: extractHeadingsFromMdx(data.content)
  } as any;
}

export async function getRelatedBlogPosts(
  currentPost: Blog,
): Promise<Array<{ title: string; slug: string; summary: string; imageName: string }>> {
  const ids = currentPost.relatedBlogPostIds ?? [];
  if (!supabase || !ids.length) return [];
  try {
    const { data, error } = await supabase.from('blog_posts')
      .select('id, title, slug, summary, cover_image_url')
      .in('id', ids)
      .eq('status', 'published')
      .lte('published_at', new Date().toISOString());
    if (error) throw error;
    return ids.flatMap((id) => {
      const post = data?.find((item) => item.id === id);
      return post && post.slug !== currentPost.slug
        ? [{ title: post.title, slug: post.slug, summary: post.summary ?? '', imageName: post.cover_image_url ?? '' }]
        : [];
    });
  } catch {
    console.warn('Optional related Blog posts could not be loaded.');
    return [];
  }
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
  const selectProjects = (withAlt: boolean) => db
    .from('projects')
    .select(withAlt
      ? '*, project_tags ( tags ( name, slug ) ), project_images ( display_order, caption, alt_text, media ( secure_url, url, alt_text ) )'
      : '*, project_tags ( tags ( name, slug ) ), project_images ( display_order, caption, media ( secure_url, url, alt_text ) )')
      .eq('status', 'published')
      .order('display_order', { ascending: true })
      .order('created_at', { ascending: true });
  let { data, error } = await selectProjects(true);
  if (error && ['42703', 'PGRST200', 'PGRST204'].includes(error.code) && /alt_text/.test(error.message)) {
    ({ data, error } = await selectProjects(false));
  }

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
    const galleryDetails = (p.project_images || [])
      .slice()
      .sort((a: any, b: any) => (a.display_order ?? 0) - (b.display_order ?? 0))
      .map((pi: any) => ({ src: pi.media?.secure_url || pi.media?.url, caption: pi.caption || "", alt: pi.alt_text || pi.caption || "" }))
      .filter((image: { src?: string }) => Boolean(image.src));
    const { project_tags: _ignored, project_images: _ignored2, ...rest } = p;
    return { ...rest, tags, gallery: galleryDetails.map((image: { src: string }) => image.src), galleryDetails };
  });
}

export async function getProjectBySlug(slug: string) {
  if (!supabase) {
    if (process.env.NODE_ENV === "production") throw new Error("Project database is not configured");
    return null;
  }
  /* Same hardening as fetchProjects: service key server-side so the
     tags/gallery joins aren't blanked by RLS, and a published-only filter
     so draft projects can never leak through a guessed URL. */
  const serviceKey =
    typeof window === "undefined" ? process.env.SUPABASE_SERVICE_ROLE_KEY : undefined;
  const db =
    serviceKey && process.env.NEXT_PUBLIC_SUPABASE_URL
      ? createClient(process.env.NEXT_PUBLIC_SUPABASE_URL, serviceKey)
      : supabase;
  const selectProject = (withAlt: boolean) => db
    .from('projects')
    .select(withAlt
      ? '*, project_tags ( tags ( name, slug ) ), project_images ( display_order, caption, alt_text, media ( secure_url, url, alt_text ) )'
      : '*, project_tags ( tags ( name, slug ) ), project_images ( display_order, caption, media ( secure_url, url, alt_text ) )')
    .eq('slug', slug)
    .eq('status', 'published')
    .maybeSingle();
  let { data, error } = await selectProject(true);
  if (error && ['42703', 'PGRST200', 'PGRST204'].includes(error.code) && /alt_text/.test(error.message)) {
    ({ data, error } = await selectProject(false));
  }

  if (error) throw new Error(`Project lookup failed: ${error.message}`);
  if (!data) return null;
  // Flatten joins exactly like fetchProjects: tags -> string[],
  // gallery -> sorted string[] of screenshot URLs.
  const p: any = data;
  const tags = p.project_tags?.map((pt: any) => pt.tags?.name).filter(Boolean) || [];
  const galleryDetails = (p.project_images || [])
    .slice()
    .sort((a: any, b: any) => (a.display_order ?? 0) - (b.display_order ?? 0))
    .map((pi: any) => ({ src: pi.media?.secure_url || pi.media?.url, caption: pi.caption || "", alt: pi.alt_text || pi.caption || "" }))
    .filter((image: { src?: string }) => Boolean(image.src));
  const { project_tags: _ignored, project_images: _ignored2, ...rest } = p;
  return { ...rest, tags, gallery: galleryDetails.map((image: { src: string }) => image.src), galleryDetails };
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
  id: string;
  title: string;
  issuer: string;
  issue_date: string;
  credential_url: string | null;
  issuer_logo_url: string | null;
  badge_image_url: string | null;
  credential_id: string | null;
  expiration_date: string | null;
  does_not_expire: boolean;
  description: string;
  skills: string[];
  category: "Web Development" | "Cybersecurity" | "AI / ML" | "Cloud" | "Other";
  is_demo: boolean;
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
      id: row.id,
      title: row.title ?? "",
      issuer: row.issuer ?? "",
      issue_date: row.issue_date ?? "",
      credential_url: row.credential_url ?? null,
      issuer_logo_url: row.issuer_logo_url ?? null,
      badge_image_url: row.badge_image_url ?? null,
      credential_id: row.credential_id ?? null,
      expiration_date: row.expiration_date ?? null,
      does_not_expire: row.does_not_expire !== false,
      description: row.description ?? "",
      skills: Array.isArray(row.skills) ? row.skills.filter((value: unknown): value is string => typeof value === "string") : [],
      category: row.category || "Other",
      is_demo: row.is_demo === true,
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
