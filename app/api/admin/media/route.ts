import { NextResponse } from "next/server";
import { v2 as cloudinary } from "cloudinary";
import { z } from "zod";
import { requireAdmin } from "@/app/lib/admin-auth";
import { createSupabaseAdminClient } from "@/app/lib/supabase/server";

cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

export async function GET(request: Request) {
  try {
    const auth = await requireAdmin();
    if (auth.response) return auth.response;
    const supabase = auth.client;

    const { searchParams } = new URL(request.url);
    const requestedLimit = Number(searchParams.get("limit") ?? 50);
    const requestedOffset = Number(searchParams.get("offset") ?? 0);
    if (!Number.isSafeInteger(requestedLimit) || requestedLimit < 1 || !Number.isSafeInteger(requestedOffset) || requestedOffset < 0) {
      return NextResponse.json({ error: "Invalid pagination" }, { status: 400 });
    }
    const limit = Math.min(requestedLimit, 100);
    const offset = requestedOffset;

    const { data, error, count } = await supabase
      .from("media")
      .select("*", { count: "exact" })
      .order("created_at", { ascending: false })
      .range(offset, offset + limit - 1);

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 400 });
    }

    return NextResponse.json({ data, count });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}

export async function PATCH(request: Request) {
  const auth = await requireAdmin();
  if (auth.response) return auth.response;
  const parsed = z.object({ id: z.string().uuid(), alt_text: z.string().trim().min(1).max(160) }).strict().safeParse(await request.json().catch(() => null));
  if (!parsed.success) return NextResponse.json({ error: "Enter an image description of 1 to 160 characters." }, { status: 400 });
  const db = await createSupabaseAdminClient();
  const { data, error } = await db.from("media").update({ alt_text: parsed.data.alt_text }).eq("id", parsed.data.id).select("id, alt_text").maybeSingle();
  if (error) return NextResponse.json({ error: "Image description could not be updated." }, { status: 500 });
  if (!data) return NextResponse.json({ error: "Image not found." }, { status: 404 });
  return NextResponse.json({ data });
}

export async function DELETE(request: Request) {
  const auth = await requireAdmin();
  if (auth.response) return auth.response;

  const params = new URL(request.url).searchParams;
  const id = params.get("id");
  const detachPostId = params.get("detach_blog_post_id");
  if (!z.string().uuid().safeParse(id).success) {
    return NextResponse.json({ error: "Invalid image ID" }, { status: 400 });
  }
  if (detachPostId !== null && !z.string().uuid().safeParse(detachPostId).success) {
    return NextResponse.json({ error: "Invalid Blog post ID" }, { status: 400 });
  }
  if (!process.env.CLOUDINARY_CLOUD_NAME || !process.env.CLOUDINARY_API_KEY || !process.env.CLOUDINARY_API_SECRET) {
    return NextResponse.json({ error: "Image deletion is not configured" }, { status: 503 });
  }

  try {
    const db = await createSupabaseAdminClient();
    const { data: item, error: lookupError } = await db.from("media").select("*").eq("id", id).maybeSingle();
    if (lookupError) throw lookupError;
    if (!item) return NextResponse.json({ error: "Image not found" }, { status: 404 });

    const associations = await db.from("blog_post_media")
      .select("blog_post_id, media_id, display_order")
      .eq("media_id", id);
    const migrationMissing = associations.error && ["42P01", "PGRST205"].includes(associations.error.code);
    if (migrationMissing && detachPostId) {
      return NextResponse.json({ error: "Apply migration 2026_blog_post_media.sql before detaching Blog images." }, { status: 503 });
    }
    if (associations.error && !migrationMissing) throw associations.error;
    const attached = migrationMissing ? [] : associations.data ?? [];
    if (attached.length && (!detachPostId || attached.length !== 1 || attached[0].blog_post_id !== detachPostId)) {
      return NextResponse.json({ error: "This image is attached to a Blog post. Remove other attachments before deleting it." }, { status: 409 });
    }
    if (detachPostId && attached.length !== 1) {
      return NextResponse.json({ error: "This image is not attached only to the specified Blog post." }, { status: 409 });
    }

    const references = [
      ["blog_posts", "cover_image_id"],
      ["blog_posts", "og_image_id"],
      ["projects", "cover_image_id"],
      ["project_images", "media_id"],
    ] as const;
    for (const [table, column] of references) {
      const { count, error } = await db.from(table).select("id", { count: "exact", head: true }).eq(column, id);
      if (error || count === null) throw error || new Error("Reference check unavailable");
      if (count > 0) return NextResponse.json({ error: "This image is in use by a Blog or Project. Remove that use before deleting it." }, { status: 409 });
    }

    for (const url of new Set([item.secure_url, item.url].filter((value): value is string => Boolean(value)))) {
      for (const table of ["blog_posts", "projects"] as const) {
        const cover = await db.from(table).select("id", { count: "exact", head: true }).eq("cover_image_url", url);
        if (cover.error || cover.count === null) throw cover.error || new Error("Cover check unavailable");
        if (cover.count > 0) return NextResponse.json({ error: "This image is in use by a Blog or Project. Remove that use before deleting it." }, { status: 409 });

        const escaped = url.replace(/[\\%_]/g, "\\$&");
        const content = await db.from(table).select("id", { count: "exact", head: true }).ilike("content", `%${escaped}%`);
        if (content.error || content.count === null) throw content.error || new Error("Content check unavailable");
        if (content.count > 0) return NextResponse.json({ error: "This image is in use by a Blog or Project. Remove that use before deleting it." }, { status: 409 });
      }
    }

    if (item.public_id) {
      const marker = item.public_id.replace(/[\\%_]/g, "\\$&");
      for (const table of ["blog_posts", "projects"] as const) {
        for (const column of ["cover_image_url", "content"] as const) {
          const { count, error } = await db.from(table).select("id", { count: "exact", head: true }).ilike(column, `%${marker}%`);
          if (error || count === null) throw error || new Error("Cloudinary reference check unavailable");
          if (count > 0) return NextResponse.json({ error: "This image is in use by a Blog or Project. Remove that use before deleting it." }, { status: 409 });
        }
      }
    }

    let association: (typeof attached)[number] | undefined;
    if (detachPostId) {
      const { data: detached, error } = await db.from("blog_post_media").delete()
        .eq("media_id", id).eq("blog_post_id", detachPostId)
        .select("blog_post_id, media_id, display_order").maybeSingle();
      if (error) throw error;
      if (!detached) return NextResponse.json({ error: "Image attachment changed before deletion. Reload and try again." }, { status: 409 });
      association = detached;
    }

    const restoreAttachment = async () => {
      if (!association) return true;
      try {
        const { error } = await db.from("blog_post_media").insert(association);
        return !error;
      } catch {
        return false;
      }
    };

    let removed;
    let deleteError;
    try {
      ({ data: removed, error: deleteError } = await db.from("media").delete().eq("id", id).select("id").maybeSingle());
    } catch (error) {
      deleteError = error;
    }
    if (deleteError || !removed) {
      if (!await restoreAttachment()) return NextResponse.json({ error: "Image deletion failed and its Blog attachment could not be restored. Contact the administrator." }, { status: 500 });
      return NextResponse.json({ error: "Image changed before deletion. Reload and try again." }, { status: 409 });
    }

    try {
      const result = await cloudinary.uploader.destroy(item.public_id, { resource_type: "image", invalidate: true });
      if (result.result !== "ok" && result.result !== "not found") throw new Error("Cloudinary removal was not confirmed");
    } catch {
      try {
        const { error: restoreError } = await db.from("media").insert(item);
        if (restoreError) return NextResponse.json({ error: "Image removal failed and its library record could not be restored. Contact the administrator." }, { status: 500 });
      } catch {
        return NextResponse.json({ error: "Image removal failed and its library record could not be restored. Contact the administrator." }, { status: 500 });
      }
      if (!await restoreAttachment()) return NextResponse.json({ error: "Image removal failed and its Blog attachment could not be restored. Contact the administrator." }, { status: 500 });
      return NextResponse.json({ error: "Cloudinary could not remove this image. Its library record was restored." }, { status: 502 });
    }

    return NextResponse.json({ success: true });
  } catch {
    return NextResponse.json({ error: "Image could not be deleted. No Cloudinary deletion was attempted." }, { status: 500 });
  }
}
