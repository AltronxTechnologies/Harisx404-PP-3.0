import { revalidatePath, revalidateTag } from "next/cache";
import { NextResponse } from "next/server";
import { z } from "zod";
import createSupabaseServerClient, { createSupabaseAdminClient } from "@/app/lib/supabase/server";
import { saveBlogPostWithTags } from "@/app/lib/tag-sync";
import { isAllowedBlogImageUrl } from "@/app/components/blog/blogImage";
import { estimateReadingMinutes } from "@/app/lib/reading-time";
import { blogCanonicalUrl, defaultBlogSummary, isValidBlogDate, normalizeBlogSlug } from "@/app/lib/blog-defaults";
import { blogImageUrls } from "@/app/lib/admin/blog-image-urls";
import { deleteManagedMedia } from "@/app/lib/admin/delete-media";
import { siteMetadata } from "@/app/data/siteMetadata";
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
    z.string().max(64).refine((value) => {
      if (/^\d{4}-\d{2}-\d{2}$/.test(value)) return isValidBlogDate(value);
      return /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}(?:\.\d{1,6})?(?:Z|[+-]\d{2}:\d{2})$/.test(value)
        && isValidBlogDate(value.slice(0, 10)) && !Number.isNaN(Date.parse(value));
    }, "Choose a valid calendar date or ISO timestamp with timezone"),
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
    image_ids: z.array(z.string().uuid()).max(40).refine((ids) => new Set(ids).size === ids.length, "Choose different images").optional(),
    canonical_url: optionalCanonicalUrl,
    published_at: optionalDate,
    tags: tagsSchema.optional().default([]),
    related_blog_post_ids: z.array(z.string().uuid()).max(3).refine((ids) => new Set(ids).size === ids.length, "Choose different posts").optional().default([]),
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

async function resolveBlogImages(data: z.infer<typeof blogSchema>, existingId?: string) {
  const admin = await createSupabaseAdminClient();
  const probe = await admin.from("blog_post_media").select("media_id").limit(0);
  if (probe.error) {
    if (["42P01", "PGRST205"].includes(probe.error.code)) return data.image_ids
      ? { ids: undefined, error: NextResponse.json({ error: "Apply migration 2026_blog_post_media.sql before saving Blog images." }, { status: 503 }) }
      : { ids: undefined, error: null };
    throw probe.error;
  }
  const ids = new Set(data.image_ids);
  if (!data.image_ids && existingId) {
    const { data: associated, error } = await admin.from("blog_post_media").select("media_id").eq("blog_post_id", existingId).order("display_order");
    if (error) throw error;
    for (const image of associated ?? []) ids.add(image.media_id);
  }
  if (data.cover_image_id) ids.add(data.cover_image_id);
  const urls = [...new Set([...blogImageUrls(data.content), data.cover_image_url || ""].filter(Boolean))];
  if (urls.length > 100) return { ids: undefined, error: NextResponse.json({ error: "Use at most 100 article image URLs." }, { status: 400 }) };
  if (urls.length) {
    const [secure, legacy] = await Promise.all([
      admin.from("media").select("id").in("secure_url", urls),
      admin.from("media").select("id").in("url", urls),
    ]);
    if (secure.error || legacy.error) throw secure.error || legacy.error;
    for (const image of [...(secure.data ?? []), ...(legacy.data ?? [])]) ids.add(image.id);
  }
  if (ids.size > 20) {
    const existingIds: string[] = [];
    if (existingId) {
      const { data: existing, error } = await admin.from("blog_post_media").select("media_id").eq("blog_post_id", existingId);
      if (error) throw error;
      for (const item of existing ?? []) existingIds.push(item.media_id);
    }
    if (existingIds.length === ids.size && existingIds.every((mediaId) => ids.has(mediaId))) return { ids: undefined, error: null };
    return { ids: undefined, error: NextResponse.json({ error: "Choose no more than 20 Blog images. An unchanged legacy collection can still be saved." }, { status: 400 }) };
  }
  return { ids: [...ids], error: null };
}

async function validateRelatedPosts(ids: string[], currentId?: string) {
  if (currentId && ids.includes(currentId)) return NextResponse.json({ error: "A post cannot link to itself." }, { status: 400 });
  const admin = await createSupabaseAdminClient();
  // Do not let the old RPC silently ignore selections before the additive migration.
  const { error: schemaError } = await admin.from("blog_posts").select("related_blog_post_ids").limit(1);
  if (schemaError) {
    if (["42703", "PGRST204"].includes(schemaError.code) && schemaError.message.includes("related_blog_post_ids")) {
      if (!ids.length) return null;
      return NextResponse.json({ error: "Apply migration 2026_blog_related_selections.sql before saving Blog posts." }, { status: 503 });
    }
    throw schemaError;
  }
  if (!ids.length) return null;
  const { data, error } = await admin.from("blog_posts").select("id").in("id", ids)
    .eq("status", "published").lte("published_at", new Date().toISOString());
  if (error) throw error;
  return data?.length === ids.length ? null : NextResponse.json({ error: "Choose only live published posts that still exist." }, { status: 400 });
}

async function referringBlogSlugs(id: string) {
  const admin = await createSupabaseAdminClient();
  const { data, error } = await admin.from("blog_posts").select("slug").contains("related_blog_post_ids", [id]);
  if (error) {
    console.error("Could not revalidate related Blog pages:", error);
    return [];
  }
  return data?.map((post) => post.slug) ?? [];
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

  const message = error instanceof Error
    ? error.message
    : typeof error === "object" && error !== null && "message" in error && typeof (error as any).message === "string"
      ? (error as any).message
      : "Unable to save blog post";
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
    return NextResponse.json({ error: "This slug belongs to an existing post. Edit the existing article from the Blog list, or choose a distinct slug." }, { status: 409 });
  }
  if (message.includes("BLOG_RELATED_INVALID")) {
    return NextResponse.json({ error: message.replace(/^.*BLOG_RELATED_INVALID: /, "Invalid related posts: ") }, { status: 400 });
  }
  if (message.includes("BLOG_MEDIA_INVALID")) {
    return NextResponse.json({ error: "A selected Blog image is missing or invalid. Reload the form and try again." }, { status: 400 });
  }
  const code = error && typeof error === "object" && "code" in error ? error.code : null;
  if (code === "PGRST202") {
    return NextResponse.json({ error: "The Blog database update is required for this action." }, { status: 503 });
  }
  if (["42703", "PGRST204"].includes(String(code)) && message.includes("related_blog_post_ids")) {
    return NextResponse.json({ error: "Apply migration 2026_blog_related_selections.sql before saving related posts." }, { status: 503 });
  }
  if (code === "23514" && message.includes("related_blog_post_ids")) {
    return NextResponse.json({ error: "Invalid related posts." }, { status: 400 });
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
    if (data.tags.length > 10) return NextResponse.json({ error: "Choose no more than 10 tags." }, { status: 400 });
    if (data.status === "published" && !data.cover_image_url) return NextResponse.json({ error: "Choose a cover image before publishing." }, { status: 400 });
    validateBlogMdx(data.content);
    const coverError = await validateCoverMedia(data.cover_image_id, data.cover_image_url);
    if (coverError) return coverError;
    const relatedError = await validateRelatedPosts(data.related_blog_post_ids);
    if (relatedError) return relatedError;
    const images = await resolveBlogImages(data);
    if (images.error) return images.error;
    const { tags, image_ids: _imageIds, ...post } = data;
    const result = await saveBlogPostWithTags({
      post: {
        ...post,
        ...(images.ids ? { image_ids: images.ids } : {}),
        canonical_url: post.canonical_url || blogCanonicalUrl(post.slug, siteMetadata.siteUrl),
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
    const relatedError = await validateRelatedPosts(data.related_blog_post_ids, data.id);
    if (relatedError) return relatedError;
    const images = await resolveBlogImages(data, data.id);
    if (images.error) return images.error;
    const { id, updated_at, tags, image_ids: _imageIds, ...post } = data;
    const admin = await createSupabaseAdminClient();
    const { data: current, error: lookupError } = await admin
      .from("blog_posts")
      .select("status, slug, canonical_url, cover_image_url, blog_post_tags(tags(name))")
      .eq("id", id)
      .maybeSingle();
    if (lookupError) throw lookupError;
    if (!current) return NextResponse.json({ error: "Blog post not found" }, { status: 404 });
    if (current.status === "archived") {
      return NextResponse.json({ error: "Restore this post before editing it." }, { status: 409 });
    }
    if (data.status === "published" && !data.cover_image_url && !(current.status === "published" && !current.cover_image_url)) return NextResponse.json({ error: "Choose a cover image before publishing." }, { status: 400 });
    if (data.tags.length > 10) {
      const names = current.blog_post_tags?.map((item: any) => item.tags?.name).filter((value: unknown): value is string => typeof value === "string") ?? [];
      if (names.length !== data.tags.length || !data.tags.every((tag) => names.includes(tag.name))) return NextResponse.json({ error: "Choose no more than 10 tags. Unchanged legacy tags can still be saved." }, { status: 400 });
    }
    const canonicalUrl = !post.canonical_url || post.canonical_url === blogCanonicalUrl(current.slug, siteMetadata.siteUrl)
      ? blogCanonicalUrl(post.slug, siteMetadata.siteUrl)
      : post.canonical_url;
    const result = await saveBlogPostWithTags({
      id,
      expectedUpdatedAt: updated_at,
      post: { ...post, ...(images.ids ? { image_ids: images.ids } : {}), canonical_url: canonicalUrl, reading_time_minutes: estimateReadingMinutes(post.content) },
      tags,
    });

    const referringSlugs = await referringBlogSlugs(id);
    revalidateBlogPaths(result.old_slug);
    if (result.post.slug !== result.old_slug) revalidateBlogPaths(result.post.slug);
    for (const slug of referringSlugs) revalidateBlogPaths(slug);
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
    for (const slug of await referringBlogSlugs(id)) revalidateBlogPaths(slug);
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
      .select("slug, content, cover_image_id, og_image_id, cover_image_url")
      .eq("id", id)
      .maybeSingle();
    if (lookupError) throw lookupError;
    if (!post) return NextResponse.json({ error: "Blog post not found" }, { status: 404 });
    if (confirm_slug !== post.slug) {
      return NextResponse.json({ error: "Type the exact post slug to confirm permanent deletion." }, { status: 400 });
    }

    // Snapshot only tracked library IDs; the RPC still decides whether this post can be deleted.
    const candidates = new Set<string>();
    if (post.cover_image_id) candidates.add(post.cover_image_id);
    if (post.og_image_id) candidates.add(post.og_image_id);
    const { data: attached, error: associationError } = await admin.from("blog_post_media")
      .select("media_id").eq("blog_post_id", id);
    if (associationError && !["42P01", "PGRST205"].includes(associationError.code)) throw associationError;
    for (const image of attached ?? []) candidates.add(image.media_id);
    const urls = [...new Set([...blogImageUrls(post.content ?? ""), post.cover_image_url].filter((url): url is string => Boolean(url)))];
    for (let offset = 0; offset < urls.length; offset += 100) {
      const chunk = urls.slice(offset, offset + 100);
      const [secure, legacy] = await Promise.all([
        admin.from("media").select("id").in("secure_url", chunk),
        admin.from("media").select("id").in("url", chunk),
      ]);
      if (secure.error || legacy.error) throw secure.error || legacy.error;
      for (const image of [...(secure.data ?? []), ...(legacy.data ?? [])]) candidates.add(image.id);
    }

    const referringSlugs = await referringBlogSlugs(id);
    const { data, error } = await admin.rpc("delete_archived_blog_post", {
      p_id: id,
      p_expected_updated_at: updated_at,
    });
    if (error) throw error;
    if (!data || data.deleted_slug !== post.slug || !Array.isArray(data.aliases)) {
      throw new Error("Blog deletion returned an invalid response");
    }
    revalidateBlogPaths(data.deleted_slug);
    for (const slug of referringSlugs) revalidateBlogPaths(slug);
    for (const alias of data.aliases) {
      if (typeof alias === "string") revalidateBlogPaths(alias);
    }
    await admin.from("blog_slug_history").delete().eq("slug", data.deleted_slug).is("post_id", null);
    let failedCount = 0;
    let retainedCount = 0;
    for (const mediaId of candidates) {
      try {
        const { data: asset, error: assetError } = await admin.from("media").select("folder").eq("id", mediaId).maybeSingle();
        if (assetError) { failedCount++; continue; }
        if (!asset || asset.folder !== `portfolio/blog/${id}`) { retainedCount++; continue; }
        const result = await deleteManagedMedia(admin, mediaId);
        if (result.kind === "error") failedCount++;
      } catch {
        failedCount++;
      }
    }
    return NextResponse.json(failedCount || retainedCount
      ? { deleted: true, cleanup_warning: { failed_count: failedCount, retained_count: retainedCount, message: "Post deleted. Some images remain in the Media Library for review." } }
      : { deleted: true });
  } catch (error) {
    return errorResponse(error, "Unable to permanently delete post.");
  }
}
