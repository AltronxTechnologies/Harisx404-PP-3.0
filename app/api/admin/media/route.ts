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

export async function DELETE(request: Request) {
  const auth = await requireAdmin();
  if (auth.response) return auth.response;

  const id = new URL(request.url).searchParams.get("id");
  if (!z.string().uuid().safeParse(id).success) {
    return NextResponse.json({ error: "Invalid image ID" }, { status: 400 });
  }
  if (!process.env.CLOUDINARY_CLOUD_NAME || !process.env.CLOUDINARY_API_KEY || !process.env.CLOUDINARY_API_SECRET) {
    return NextResponse.json({ error: "Image deletion is not configured" }, { status: 503 });
  }

  try {
    const db = await createSupabaseAdminClient();
    const { data: item, error: lookupError } = await db.from("media").select("*").eq("id", id).maybeSingle();
    if (lookupError) throw lookupError;
    if (!item) return NextResponse.json({ error: "Image not found" }, { status: 404 });

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

    const { data: removed, error: deleteError } = await db.from("media").delete().eq("id", id).select("id").maybeSingle();
    if (deleteError) throw deleteError;
    if (!removed) return NextResponse.json({ error: "Image changed before deletion. Reload and try again." }, { status: 409 });

    try {
      const result = await cloudinary.uploader.destroy(item.public_id, { resource_type: "image", invalidate: true });
      if (result.result !== "ok" && result.result !== "not found") throw new Error("Cloudinary removal was not confirmed");
    } catch {
      const { error: restoreError } = await db.from("media").insert(item);
      if (restoreError) return NextResponse.json({ error: "Image removal failed and its library record could not be restored. Contact the administrator." }, { status: 500 });
      return NextResponse.json({ error: "Cloudinary could not remove this image. Its library record was restored." }, { status: 502 });
    }

    return NextResponse.json({ success: true });
  } catch {
    return NextResponse.json({ error: "Image could not be deleted. No Cloudinary deletion was attempted." }, { status: 500 });
  }
}
