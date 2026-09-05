import "server-only";

import fs from "fs";
import path from "path";
import matter from "gray-matter";
import readingDuration from "reading-duration";
import { unstable_cache } from "next/cache";
import { getPublicSupabase } from "@/app/lib/supabase/safe";
import { createSupabaseAdminClient } from "@/app/lib/supabase/server";

export type ReactionType = "like" | "heart" | "celebrate" | "insightful";

export type ReactionSummary = {
  total: number;
  counts: Record<ReactionType, number>;
};

type ReactionRow = {
  article_slug: string;
  reaction_type: string;
  count: number;
};

export type BlogIndexPost = {
  slug: string;
  title: string;
  summary: string;
  publishedAt: string;
  readingTime: string;
  imageName: string;
  categories: string[];
  featured: boolean;
};

type LocalMetadata = {
  slug: string;
  title: string;
  summary: string;
  content: string;
  publishedAt: string;
  categories: string[];
  draft: boolean;
  imageName: string;
};

let localMetadataCache: Map<string, LocalMetadata> | null = null;

function getLocalMetadata() {
  if (localMetadataCache) return localMetadataCache;

  const directory = path.join(process.cwd(), "content", "blog");
  localMetadataCache = new Map();
  if (!fs.existsSync(directory)) return localMetadataCache;

  for (const file of fs.readdirSync(directory)) {
    if (!file.endsWith(".mdx")) continue;
    const slug = file.slice(0, -4);
    const { data, content } = matter(fs.readFileSync(path.join(directory, file), "utf8"));
    localMetadataCache.set(slug, {
      slug,
      title: typeof data.title === "string" ? data.title : slug,
      summary: typeof data.summary === "string" ? data.summary : "",
      content,
      publishedAt:
        typeof data.publishedAt === "string"
          ? data.publishedAt
          : new Date(0).toISOString(),
      categories: Array.isArray(data.categories)
        ? data.categories.filter((value): value is string => typeof value === "string")
        : [],
      draft: data.draft === true,
      imageName: typeof data.imageName === "string" ? data.imageName : "",
    });
  }

  return localMetadataCache;
}

function localImagePath(imageName: string) {
  if (!imageName) return "";
  if (imageName.startsWith("//")) return "";
  if ((imageName.startsWith("/") && !imageName.startsWith("//")) || /^https?:\/\//i.test(imageName)) return imageName;
  return `/blog/${imageName}`;
}

function buildCardDescription(summary: string, content = "") {
  if (summary.trim().length >= 220 || !content) return summary.trim();

  const prose = content
    .split(/\n\s*\n/)
    .map((paragraph) => paragraph.trim())
    .filter(
      (paragraph) =>
        paragraph.length > 35 &&
        !/^(import|export|#|<|\!\[|```|---|\*\*[^*]+\*\*$)/.test(paragraph),
    )
    .map((paragraph) =>
      paragraph
        .replace(/\[([^\]]+)\]\([^)]+\)/g, "$1")
        .replace(/[*_`>#]/g, "")
        .replace(/\s+/g, " ")
        .trim(),
    )
    .filter(Boolean)
    .slice(0, 2)
    .join(" ");

  return prose.length > summary.trim().length ? prose.slice(0, 360) : summary.trim();
}

const loadBlogIndexPosts = async (): Promise<BlogIndexPost[]> => {
  const supabase = getPublicSupabase();
  if (!supabase) throw new Error("Blog data is unavailable: Supabase is not configured.");

  const { data, error } = await supabase
    .from("blog_posts")
    .select(`
      title, slug, summary, published_at, cover_image_url,
      reading_time_minutes, featured,
      blog_post_tags ( tags ( name, slug ) )
    `)
    .eq("status", "published")
    .lte("published_at", new Date().toISOString())
    .order("published_at", { ascending: false });

  if (error) {
    throw new Error(`Unable to load published articles: ${error.message}`);
  }

  const localMetadata = getLocalMetadata();
  const missingContentSlugs = (data || [])
    .filter((post) => {
      const minutes = Number(post.reading_time_minutes);
      return (
        !localMetadata.has(post.slug) &&
        (!(Number.isFinite(minutes) && minutes > 0) ||
          (post.summary || "").trim().length < 220)
      );
    })
    .map((post) => post.slug);
  const contentBySlug = new Map<string, string>();
  if (missingContentSlugs.length > 0) {
    const { data: contentRows, error: contentError } = await supabase
      .from("blog_posts")
      .select("slug, content")
      .in("slug", missingContentSlugs);
    if (contentError) {
      console.error("Unable to calculate reading time for new Blog posts.", contentError.message);
    } else {
      contentRows?.forEach((row) => contentBySlug.set(row.slug, row.content || ""));
    }
  }

  return (data || [])
    .filter((post) => !localMetadata.get(post.slug)?.draft)
    .map((post) => {
      const local = localMetadata.get(post.slug);
      const joinedCategories =
        post.blog_post_tags
          ?.map((item: any) => item.tags?.name)
          .filter((value: unknown): value is string => typeof value === "string") || [];
      const categories = joinedCategories.length > 0
        ? joinedCategories
        : local?.categories || [];
      const minutes = Number(post.reading_time_minutes);
      const sourceContent = local?.content || contentBySlug.get(post.slug) || "";

      return {
        slug: post.slug,
        title: post.title,
        summary: buildCardDescription(post.summary || "", sourceContent),
        publishedAt: post.published_at,
        readingTime:
          Number.isFinite(minutes) && minutes > 0
            ? `${minutes} min read`
            : local || contentBySlug.has(post.slug)
              ? readingDuration(sourceContent, {
                wordsPerMinute: 200,
                emoji: false,
                })
              : "Article",
        imageName: localImagePath(post.cover_image_url || local?.imageName || ""),
        categories: categories
          .map((category) => category.trim())
          .filter(Boolean)
          .filter(
            (category, index, values) =>
              values.findIndex(
                (candidate) => candidate.toLowerCase() === category.toLowerCase(),
              ) === index,
          ),
        featured: post.featured === true,
      };
    });
};

export const fetchBlogIndexPosts = unstable_cache(
  loadBlogIndexPosts,
  ["blog-index-posts"],
  { revalidate: 3600, tags: ["blog-index"] },
);

const fetchReactionRows = unstable_cache(
  async (): Promise<ReactionRow[]> => {
    if (!process.env.SUPABASE_SERVICE_ROLE_KEY) return [];
    try {
      const supabase = await createSupabaseAdminClient();
      const { data, error } = await supabase
        .from("article_reactions")
        .select("article_slug, reaction_type, count");
      return error ? [] : data || [];
    } catch {
      return [];
    }
  },
  ["blog-reaction-summaries"],
  { revalidate: 30, tags: ["blog-reactions"] },
);

export async function fetchBlogReactionSummaries(slugs: string[]) {
  const summaries: Record<string, ReactionSummary> = {};
  if (slugs.length === 0) return summaries;
  const visibleSlugs = new Set(slugs);
  const data = await fetchReactionRows();
  const validTypes: ReactionType[] = ["like", "heart", "celebrate", "insightful"];
  data.forEach((row) => {
      if (!visibleSlugs.has(row.article_slug)) return;
      if (!validTypes.includes(row.reaction_type as ReactionType)) return;
      const count = Math.max(0, Number(row.count) || 0);
      if (count === 0) return;
      const summary = summaries[row.article_slug] || {
        total: 0,
        counts: { like: 0, heart: 0, celebrate: 0, insightful: 0 },
      };
      summary.total += count;
      summary.counts[row.reaction_type as ReactionType] = count;
      summaries[row.article_slug] = summary;
  });

  return summaries;
}
