import "server-only";

import fs from "fs";
import path from "path";
import matter from "gray-matter";
import readingDuration from "reading-duration";
import { cache } from "react";
import { getPublicSupabase } from "@/app/lib/supabase/safe";
import { createSupabaseAdminClient } from "@/app/lib/supabase/server";

export type ReactionType = "like" | "heart" | "celebrate" | "insightful";

export type ReactionSummary = {
  total: number;
  top: Array<{ type: ReactionType; count: number }>;
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

export const fetchBlogIndexPosts = cache(async (): Promise<BlogIndexPost[]> => {
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
      return !(Number.isFinite(minutes) && minutes > 0) && !localMetadata.has(post.slug);
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

      return {
        slug: post.slug,
        title: post.title,
        summary: post.summary || "",
        publishedAt: post.published_at,
        readingTime:
          Number.isFinite(minutes) && minutes > 0
            ? `${minutes} min read`
            : local || contentBySlug.has(post.slug)
              ? readingDuration(local?.content || contentBySlug.get(post.slug) || "", {
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
});

export async function fetchBlogReactionSummaries(slugs: string[]) {
  const summaries: Record<string, ReactionSummary> = {};
  if (slugs.length === 0 || !process.env.SUPABASE_SERVICE_ROLE_KEY) return summaries;

  try {
    const supabase = await createSupabaseAdminClient();
    const { data, error } = await supabase
      .from("article_reactions")
      .select("article_slug, reaction_type, count")
      .in("article_slug", slugs);
    if (error) return summaries;

    const validTypes: ReactionType[] = ["like", "heart", "celebrate", "insightful"];
    data?.forEach((row) => {
      if (!validTypes.includes(row.reaction_type as ReactionType)) return;
      const count = Math.max(0, Number(row.count) || 0);
      if (count === 0) return;
      const summary = summaries[row.article_slug] || { total: 0, top: [] };
      summary.total += count;
      summary.top.push({ type: row.reaction_type as ReactionType, count });
      summaries[row.article_slug] = summary;
    });

    Object.values(summaries).forEach((summary) => {
      summary.top.sort(
        (a, b) =>
          b.count - a.count || validTypes.indexOf(a.type) - validTypes.indexOf(b.type),
      );
      summary.top = summary.top.slice(0, 3);
    });
  } catch {
    return {};
  }

  return summaries;
}
