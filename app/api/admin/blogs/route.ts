import { revalidatePath, revalidateTag } from "next/cache";
import { NextResponse } from "next/server";
import { z } from "zod";
import createSupabaseServerClient from "@/app/lib/supabase/server";
import { saveBlogPostWithTags } from "@/app/lib/tag-sync";
import { isAllowedBlogImageUrl } from "@/app/components/blog/blogImage";
import { estimateReadingMinutes } from "@/app/lib/reading-time";

const normalizeSlug = (value: string) =>
  value
    .trim()
    .toLowerCase()
    .normalize("NFKD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");

const normalizeTagSlug = (value: string) =>
  value
    .trim()
    .normalize("NFKC")
    .toLowerCase()
    .replace(/[^\p{L}\p{N}]+/gu, "-")
    .replace(/^-+|-+$/g, "");

const optionalText = (max: number) =>
  z
    .union([z.string().max(max), z.null()])
    .optional()
    .transform((value) => (value?.trim() ? value.trim() : null));

const optionalUrl = z
  .union([z.string().trim().max(2048).url(), z.literal(""), z.null()])
  .optional()
  .transform((value) => value || null);

const optionalCoverUrl = z
  .union([
    z.string().trim().max(2048).refine(
      (value) =>
        (value.startsWith("/blog/") && !value.startsWith("//")) ||
        isAllowedBlogImageUrl(value),
      "Cover image must use HTTPS from an approved image host",
    ),
    z.literal(""),
    z.null(),
  ])
  .optional()
  .transform((value) => value || null);

const tagsSchema = z
  .array(z.string().trim().min(1).max(50))
  .max(25)
  .refine((tags) => tags.every((tag) => Boolean(normalizeTagSlug(tag))), {
    message: "Each tag must contain a letter or number",
  })
  .transform((tags) => {
    const seen = new Set<string>();
    return tags.flatMap((tag) => {
      const slug = normalizeTagSlug(tag);
      if (seen.has(slug)) return [];
      seen.add(slug);
      return [{ name: tag, slug }];
    });
  });

const optionalDate = z
  .union([
    z.string().max(64).refine((value) => !Number.isNaN(Date.parse(value)), "Invalid publish date"),
    z.literal(""),
    z.null(),
  ])
  .optional()
  .transform((value) => (value ? new Date(value).toISOString() : null));

const blogSchema = z
  .object({
    title: z.string().trim().min(1, "Title is required").max(200),
    slug: z
      .string()
      .max(300)
      .transform(normalizeSlug)
      .pipe(z.string().min(1, "Slug is required").max(200)),
    summary: optionalText(1000),
    content: z
      .string()
      .max(1_000_000)
      .transform((value) => value.replace(/\r\n?/g, "\n").trim())
      .pipe(z.string().min(1, "Content is required")),
    status: z.enum(["draft", "published"]),
    cover_image_url: optionalCoverUrl,
    cover_image_id: z
      .union([z.string().uuid(), z.literal(""), z.null()])
      .optional()
      .transform((value) => value || null),
    canonical_url: optionalUrl,
    published_at: optionalDate,
    tags: tagsSchema.optional().default([]),
  })
  .strict();

const updateSchema = blogSchema.extend({
  id: z.string().uuid(),
  updated_at: z.string().datetime({ offset: true }),
});

async function authorizeAdmin() {
  const supabase = await createSupabaseServerClient();
  const {
    data: { user },
    error,
  } = await supabase.auth.getUser();

  if (error || !user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const adminEmail = process.env.ADMIN_EMAIL?.trim().toLowerCase();
  if (!adminEmail) {
    console.error("Blog admin API is disabled because ADMIN_EMAIL is not configured");
    return NextResponse.json({ error: "Admin access is not configured" }, { status: 500 });
  }
  if (user.email?.toLowerCase() !== adminEmail) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  return null;
}

// Best-effort ISR invalidation must never fail a completed mutation.
function revalidateBlogPaths(slug?: string | null) {
  try {
    revalidateTag("blog-index");
    revalidateTag("blog-reactions");
    revalidatePath("/");
    revalidatePath("/blog");
    if (slug) revalidatePath(`/blog/${slug}`);
    revalidatePath("/rss.xml");
    revalidatePath("/sitemap.xml");
  } catch (error) {
    console.error("Revalidation failed:", error);
  }
}

function errorResponse(error: unknown) {
  if (error instanceof SyntaxError) {
    return NextResponse.json({ error: "Request body must be valid JSON" }, { status: 400 });
  }
  if (error instanceof z.ZodError) {
    return NextResponse.json(
      { error: "Invalid blog post data", issues: error.flatten() },
      { status: 400 },
    );
  }

  const message = error instanceof Error ? error.message : "Unable to save blog post";
  if (message.includes("BLOG_POST_CONFLICT")) {
    return NextResponse.json(
      { error: "This post was changed elsewhere. Reload the page before saving again." },
      { status: 409 },
    );
  }
  if (message.includes("BLOG_POST_NOT_FOUND")) {
    return NextResponse.json({ error: "Blog post not found" }, { status: 404 });
  }

  console.error("Blog save failed:", error);
  return NextResponse.json({ error: message }, { status: 500 });
}

export async function POST(request: Request) {
  try {
    const authorizationError = await authorizeAdmin();
    if (authorizationError) return authorizationError;

    const data = blogSchema.parse(await request.json());
    const { tags, ...post } = data;
    const result = await saveBlogPostWithTags({
      post: { ...post, reading_time_minutes: estimateReadingMinutes(post.content) },
      tags,
    });

    revalidateBlogPaths(result.post.slug);
    return NextResponse.json(result.post);
  } catch (error) {
    return errorResponse(error);
  }
}

export async function PUT(request: Request) {
  try {
    const authorizationError = await authorizeAdmin();
    if (authorizationError) return authorizationError;

    const data = updateSchema.parse(await request.json());
    const { id, updated_at, tags, ...post } = data;
    const result = await saveBlogPostWithTags({
      id,
      expectedUpdatedAt: updated_at,
      post: { ...post, reading_time_minutes: estimateReadingMinutes(post.content) },
      tags,
    });

    revalidateBlogPaths(result.old_slug);
    if (result.post.slug !== result.old_slug) revalidateBlogPaths(result.post.slug);
    return NextResponse.json(result.post);
  } catch (error) {
    return errorResponse(error);
  }
}
