import { revalidatePath, revalidateTag } from "next/cache";
import { NextResponse } from "next/server";
import { z } from "zod";
import createSupabaseServerClient, { createSupabaseAdminClient } from "@/app/lib/supabase/server";
import { saveBlogPostWithTags } from "@/app/lib/tag-sync";
import { isAllowedBlogImageUrl } from "@/app/components/blog/blogImage";
import { estimateReadingMinutes } from "@/app/lib/reading-time";
import { defaultBlogSummary, normalizeBlogSlug } from "@/app/lib/blog-defaults";
import { BlogMdxValidationError, validateBlogMdx } from "@/app/lib/blog-mdx-policy.mjs";

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

const optionalCanonicalUrl = z
  .union([z.string().trim().max(2048).url().refine((value) => {
    if (!value) return true;
    try {
      const url = new URL(value);
      return ["http:", "https:"].includes(url.protocol) && !url.username && !url.password;
    } catch {
      return false;
    }
  }, "Canonical URL must be an HTTP(S) URL without credentials"), z.literal(""), z.null()])
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
      if (seen.has(tag)) return [];
      seen.add(tag);
      return [{ name: tag, slug: normalizeTagSlug(tag) }];
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
      .transform(normalizeBlogSlug)
      .pipe(z.string().min(1, "Slug is required").max(200)),
    summary: optionalText(1000),
    content: z
      .string()
      .max(1_000_000)
      .refine((value) => value.trim().length > 0, "Content is required"),
    status: z.enum(["draft", "published"]),
    cover_image_url: optionalCoverUrl,
    cover_image_id: z
      .union([z.string().uuid(), z.literal(""), z.null()])
      .optional()
      .transform((value) => value || null),
    canonical_url: optionalCanonicalUrl,
    published_at: optionalDate,
    tags: tagsSchema.optional().default([]),
  })
  .strict();

const updateSchema = blogSchema.extend({
  id: z.string().uuid(),
  updated_at: z.string().datetime({ offset: true }),
});

const archiveSchema = z.object({
  id: z.string().uuid(),
  updated_at: z.string().datetime({ offset: true }),
  action: z.enum(["archive", "restore"]),
}).strict();

const deleteSchema = z.object({
  id: z.string().uuid(),
  updated_at: z.string().datetime({ offset: true }),
  confirm_slug: z.string().min(1),
}).strict();

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

async function validateCoverMedia(coverId: string | null, coverUrl: string | null) {
  if (!coverId) return null;
  const admin = await createSupabaseAdminClient();
  const { data: media, error } = await admin
    .from("media")
    .select("url, secure_url")
    .eq("id", coverId)
    .maybeSingle();
  if (error) throw error;
  if (!media || (coverUrl !== media.secure_url && coverUrl !== media.url)) {
    return NextResponse.json({ error: "Choose a matching cover image from the media library." }, { status: 400 });
  }
  return null;
}

// Best-effort ISR invalidation must never fail a completed mutation.
function revalidateBlogPaths(slug?: string | null) {
  try {
    revalidateTag("blog-index");
    revalidateTag("blog-reactions");
    revalidateTag("server-stats");
    revalidatePath("/");
    revalidatePath("/blog");
    revalidatePath("/admin/blogs");
    if (slug) revalidatePath(`/blog/${slug}`);
    revalidatePath("/rss.xml");
    revalidatePath("/sitemap.xml");
  } catch (error) {
    console.error("Revalidation failed:", error);
  }
}

function errorResponse(error: unknown, fallback = "Unable to save blog post. Please try again.") {
  if (error instanceof BlogMdxValidationError) {
    return NextResponse.json({ error: error.message }, { status: 400 });
  }
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
  if (message.includes("BLOG_SLUG_RESERVED")) {
    return NextResponse.json({ error: "This slug belongs to a previously published post. Choose another slug." }, { status: 409 });
  }
  const code = error && typeof error === "object" && "code" in error ? error.code : null;
  if (code === "PGRST202") {
    return NextResponse.json({ error: "The Blog database update is required for this action." }, { status: 503 });
  }
  if (code === "23505") {
    return NextResponse.json({ error: "A blog post or tag with that name already exists." }, { status: 409 });
  }
  if (code === "23503") {
    return NextResponse.json({ error: "The selected cover image is no longer available." }, { status: 400 });
  }

  console.error("Blog operation failed:", error);
  return NextResponse.json({ error: fallback }, { status: 500 });
}

export async function POST(request: Request) {
  try {
    const authorizationError = await authorizeAdmin();
    if (authorizationError) return authorizationError;

    const data = blogSchema.parse(await request.json());
    validateBlogMdx(data.content);
    const coverError = await validateCoverMedia(data.cover_image_id, data.cover_image_url);
    if (coverError) return coverError;
    const { tags, ...post } = data;
    const result = await saveBlogPostWithTags({
      post: {
        ...post,
        summary: post.summary ?? defaultBlogSummary(post.content, post.title),
        reading_time_minutes: estimateReadingMinutes(post.content),
      },
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
    validateBlogMdx(data.content);
    const coverError = await validateCoverMedia(data.cover_image_id, data.cover_image_url);
    if (coverError) return coverError;
    const { id, updated_at, tags, ...post } = data;
    const admin = await createSupabaseAdminClient();
    const { data: current, error: lookupError } = await admin
      .from("blog_posts")
      .select("status")
      .eq("id", id)
      .maybeSingle();
    if (lookupError) throw lookupError;
    if (!current) return NextResponse.json({ error: "Blog post not found" }, { status: 404 });
    if (current.status === "archived") {
      return NextResponse.json({ error: "Restore this post before editing it." }, { status: 409 });
    }
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

export async function PATCH(request: Request) {
  try {
    const authorizationError = await authorizeAdmin();
    if (authorizationError) return authorizationError;

    const { id, updated_at, action } = archiveSchema.parse(await request.json());
    const admin = await createSupabaseAdminClient();
    const { data, error } = await admin.rpc("transition_blog_post", {
      p_id: id,
      p_expected_updated_at: updated_at,
      p_action: action,
    });
    let post = data;
    if (error?.code === "PGRST202") {
      // Keep existing archive/restore usable until the additive workflow SQL is installed.
      const nextStatus = action === "archive" ? "archived" : "draft";
      const nextUpdatedAt = new Date(Math.max(Date.now(), Date.parse(updated_at) + 1)).toISOString();
      const mutation = admin.from("blog_posts")
        .update({ status: nextStatus, updated_at: nextUpdatedAt })
        .eq("id", id)
        .eq("updated_at", updated_at);
      const { data: previous, error: updateError } = await (action === "archive"
        ? mutation.in("status", ["draft", "published"])
        : mutation.eq("status", "archived"))
        .select("id, slug, status, updated_at")
        .maybeSingle();
      if (updateError) throw updateError;
      if (!previous) {
        const { data: existing, error: lookupError } = await admin.from("blog_posts")
          .select("id").eq("id", id).maybeSingle();
        if (lookupError) throw lookupError;
        return NextResponse.json({ error: existing ? "This post was changed elsewhere. Reload and try again." : "Blog post not found" }, { status: existing ? 409 : 404 });
      }
      post = previous;
    } else if (error) {
      throw error;
    }
    if (!post?.slug || !post.updated_at) throw new Error("Blog transition returned an invalid response");

    revalidateBlogPaths(post.slug);
    return NextResponse.json(post);
  } catch (error) {
    return errorResponse(error, "Unable to archive or restore post.");
  }
}

export async function DELETE(request: Request) {
  try {
    const authorizationError = await authorizeAdmin();
    if (authorizationError) return authorizationError;

    const { id, updated_at, confirm_slug } = deleteSchema.parse(await request.json());
    const admin = await createSupabaseAdminClient();
    const { data: post, error: lookupError } = await admin
      .from("blog_posts")
      .select("slug")
      .eq("id", id)
      .maybeSingle();
    if (lookupError) throw lookupError;
    if (!post) return NextResponse.json({ error: "Blog post not found" }, { status: 404 });
    if (confirm_slug !== post.slug) {
      return NextResponse.json({ error: "Type the exact post slug to confirm permanent deletion." }, { status: 400 });
    }

    const { data, error } = await admin.rpc("delete_archived_blog_post", {
      p_id: id,
      p_expected_updated_at: updated_at,
    });
    if (error) throw error;
    if (!data || data.deleted_slug !== post.slug || !Array.isArray(data.aliases)) {
      throw new Error("Blog deletion returned an invalid response");
    }
    revalidateBlogPaths(data.deleted_slug);
    for (const alias of data.aliases) {
      if (typeof alias === "string") revalidateBlogPaths(alias);
    }
    return NextResponse.json({ deleted: true });
  } catch (error) {
    return errorResponse(error, "Unable to permanently delete post.");
  }
}
