import { NextResponse } from "next/server";
import { getPublicSupabase } from "@/app/lib/supabase/safe";
import { checkRateLimit } from "@/app/lib/rate-limit";

interface SearchResult {
  title: string;
  type: "blog" | "project";
  link: string;
  summary?: string;
}

const MAX_BODY_BYTES = 2048;
const MAX_QUERY_LENGTH = 100;
const RESULTS_PER_TYPE = 5;

function escapeLikePattern(value: string) {
  return value.replace(/[\\%_]/g, "\\$&");
}

function uniqueByLink(results: SearchResult[]) {
  return [...new Map(results.map((result) => [result.link, result])).values()];
}

async function keywordSearch(query: string): Promise<SearchResult[]> {
  const supabase = getPublicSupabase();
  if (!supabase) throw new Error("Search database is unavailable");

  const pattern = `%${escapeLikePattern(query)}%`;
  const [postTitles, postSummaries, projectTitles, projectDescriptions] =
    await Promise.all([
      supabase
        .from("blog_posts")
        .select("title, slug, summary")
        .eq("status", "published")
        .ilike("title", pattern)
        .limit(RESULTS_PER_TYPE),
      supabase
        .from("blog_posts")
        .select("title, slug, summary")
        .eq("status", "published")
        .ilike("summary", pattern)
        .limit(RESULTS_PER_TYPE),
      supabase
        .from("projects")
        .select("title, slug, description")
        .eq("status", "published")
        .ilike("title", pattern)
        .limit(RESULTS_PER_TYPE),
      supabase
        .from("projects")
        .select("title, slug, description")
        .eq("status", "published")
        .ilike("description", pattern)
        .limit(RESULTS_PER_TYPE),
    ]);

  if (postTitles.error && postSummaries.error) {
    throw new Error("Blog search failed");
  }
  if (projectTitles.error && projectDescriptions.error) {
    throw new Error("Project search failed");
  }

  const posts = uniqueByLink(
    [...(postTitles.data ?? []), ...(postSummaries.data ?? [])]
      .filter((post) => post?.slug)
      .map((post) => ({
        title: post.title ?? "Untitled post",
        type: "blog" as const,
        link: `/blog/${post.slug}`,
        summary: post.summary ?? undefined,
      })),
  ).slice(0, RESULTS_PER_TYPE);

  const projects = uniqueByLink(
    [...(projectTitles.data ?? []), ...(projectDescriptions.data ?? [])]
      .filter((project) => project?.slug)
      .map((project) => ({
        title: project.title ?? "Untitled project",
        type: "project" as const,
        link: `/projects/${project.slug}`,
        summary: project.description ?? undefined,
      })),
  ).slice(0, RESULTS_PER_TYPE);

  return [...projects, ...posts];
}

export async function POST(request: Request) {
  const forwarded =
    request.headers.get("x-vercel-forwarded-for") ??
    request.headers.get("x-forwarded-for") ??
    "client";
  const ip = forwarded.split(",")[0].trim();
  const rateLimit = checkRateLimit(`search-${ip}`, {
    maxRequests: 60,
    windowMs: 60 * 1000,
  });

  if (!rateLimit.success) {
    return NextResponse.json(
      { error: "Too many search requests. Please wait a moment." },
      { status: 429, headers: { "Retry-After": "60" } },
    );
  }

  try {
    const rawBody = await request.text();
    if (new TextEncoder().encode(rawBody).length > MAX_BODY_BYTES) {
      return NextResponse.json({ error: "Request body is too large" }, { status: 413 });
    }

    const body: unknown = JSON.parse(rawBody);
    if (
      !body ||
      typeof body !== "object" ||
      Array.isArray(body) ||
      Object.keys(body).some((key) => key !== "query")
    ) {
      return NextResponse.json({ error: "Invalid request body" }, { status: 400 });
    }

    const query = (body as { query?: unknown }).query;
    if (typeof query !== "string" || query.trim().length < 2) {
      return NextResponse.json(
        { error: "Query must contain at least 2 characters" },
        { status: 400 },
      );
    }

    const trimmed = query.trim();
    if (trimmed.length > MAX_QUERY_LENGTH) {
      return NextResponse.json(
        { error: `Query must not exceed ${MAX_QUERY_LENGTH} characters` },
        { status: 400 },
      );
    }

    const results = await keywordSearch(trimmed);
    return NextResponse.json({ results, mode: "keyword" });
  } catch (error) {
    if (error instanceof SyntaxError) {
      return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
    }
    console.error("Search failed:", error instanceof Error ? error.message : error);
    return NextResponse.json({ error: "Search is unavailable" }, { status: 503 });
  }
}
