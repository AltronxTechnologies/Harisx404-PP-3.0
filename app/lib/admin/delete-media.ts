import "server-only";

import { v2 as cloudinary } from "cloudinary";
import { createSupabaseAdminClient } from "@/app/lib/supabase/server";

type Db = Awaited<ReturnType<typeof createSupabaseAdminClient>>;
type DeletionResult =
  | { kind: "deleted" }
  | { kind: "in_use"; status: 409; error: string }
  | { kind: "error"; status: number; error: string };

cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

export async function deleteManagedMedia(db: Db, id: string, detachPostId?: string | null): Promise<DeletionResult> {
  if (!process.env.CLOUDINARY_CLOUD_NAME || !process.env.CLOUDINARY_API_KEY || !process.env.CLOUDINARY_API_SECRET) {
    return { kind: "error", status: 503, error: "Image deletion is not configured" };
  }

  try {
    const { data: item, error: lookupError } = await db.from("media").select("*").eq("id", id).maybeSingle();
    if (lookupError) throw lookupError;
    if (!item) return { kind: "error", status: 404, error: "Image not found" };
    if (!item.public_id) return { kind: "error", status: 409, error: "Image has no managed Cloudinary asset ID." };

    const associations = await db.from("blog_post_media")
      .select("blog_post_id, media_id, display_order")
      .eq("media_id", id);
    if (associations.error && ["42P01", "PGRST205"].includes(associations.error.code)) {
      return { kind: "error", status: 503, error: "Blog image attachments are unavailable; image deletion was not attempted." };
    }
    if (associations.error) throw associations.error;
    const attached = associations.data ?? [];
    if (attached.length && (!detachPostId || attached.length !== 1 || attached[0].blog_post_id !== detachPostId)) {
      return { kind: "in_use", status: 409, error: "This image is attached to a Blog post. Remove other attachments before deleting it." };
    }
    if (detachPostId && attached.length !== 1) {
      return { kind: "error", status: 409, error: "This image is not attached only to the specified Blog post." };
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
      if (count > 0) return { kind: "in_use", status: 409, error: "This image is in use by a Blog or Project. Remove that use before deleting it." };
    }

    for (const url of new Set([item.secure_url, item.url].filter((value): value is string => Boolean(value)))) {
      for (const table of ["blog_posts", "projects"] as const) {
        const cover = await db.from(table).select("id", { count: "exact", head: true }).eq("cover_image_url", url);
        if (cover.error || cover.count === null) throw cover.error || new Error("Cover check unavailable");
        if (cover.count > 0) return { kind: "in_use", status: 409, error: "This image is in use by a Blog or Project. Remove that use before deleting it." };

        const escaped = url.replace(/[\\%_]/g, "\\$&");
        const content = await db.from(table).select("id", { count: "exact", head: true }).ilike("content", `%${escaped}%`);
        if (content.error || content.count === null) throw content.error || new Error("Content check unavailable");
        if (content.count > 0) return { kind: "in_use", status: 409, error: "This image is in use by a Blog or Project. Remove that use before deleting it." };
      }
    }

    const marker = item.public_id.replace(/[\\%_]/g, "\\$&");
    for (const table of ["blog_posts", "projects"] as const) {
      for (const column of ["cover_image_url", "content"] as const) {
        const { count, error } = await db.from(table).select("id", { count: "exact", head: true }).ilike(column, `%${marker}%`);
        if (error || count === null) throw error || new Error("Cloudinary reference check unavailable");
        if (count > 0) return { kind: "in_use", status: 409, error: "This image is in use by a Blog or Project. Remove that use before deleting it." };
      }
    }

    const adminImageColumns = [
      ["testimonials", ["avatar_url"]],
      ["experience", ["logo_url"]],
      ["certifications", ["issuer_logo_url", "badge_image_url"]],
    ] as const;
    const urls = new Set([item.secure_url, item.url].filter((value): value is string => Boolean(value)));
    for (const [table, columns] of adminImageColumns) {
      // These tables currently store URLs, but also protect an ID link if a deployment has added one.
      const linked = await db.from(table).select("id", { count: "exact", head: true }).eq("media_id", id);
      if (linked.error?.code !== "42703" && (linked.error || linked.count === null)) throw linked.error || new Error("Admin image reference check unavailable");
      if (linked.count && linked.count > 0) return { kind: "in_use", status: 409, error: "This image is in use by Admin content. Remove that use before deleting it." };

      for (const column of columns) {
        for (const url of urls) {
          const reference = await db.from(table).select("id", { count: "exact", head: true }).eq(column, url);
          // Experience and certification image fields were added in later migrations.
          if (reference.error?.code === "42703" && table !== "testimonials") break;
          if (reference.error || reference.count === null) throw reference.error || new Error("Admin image reference check unavailable");
          if (reference.count > 0) return { kind: "in_use", status: 409, error: "This image is in use by Admin content. Remove that use before deleting it." };
        }
        const reference = await db.from(table).select("id", { count: "exact", head: true }).ilike(column, `%${marker}%`);
        if (reference.error?.code === "42703" && table !== "testimonials") continue;
        if (reference.error || reference.count === null) throw reference.error || new Error("Admin image reference check unavailable");
        if (reference.count > 0) return { kind: "in_use", status: 409, error: "This image is in use by Admin content. Remove that use before deleting it." };
      }
    }

    let association: (typeof attached)[number] | undefined;
    if (detachPostId) {
      const { data: detached, error } = await db.from("blog_post_media").delete()
        .eq("media_id", id).eq("blog_post_id", detachPostId)
        .select("blog_post_id, media_id, display_order").maybeSingle();
      if (error) throw error;
      if (!detached) return { kind: "error", status: 409, error: "Image attachment changed before deletion. Reload and try again." };
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
      if (!await restoreAttachment()) return { kind: "error", status: 500, error: "Image deletion failed and its Blog attachment could not be restored. Contact the administrator." };
      return { kind: "error", status: 409, error: "Image changed before deletion. Reload and try again." };
    }

    try {
      const result = await cloudinary.uploader.destroy(item.public_id, { resource_type: "image", invalidate: true });
      if (result.result !== "ok" && result.result !== "not found") throw new Error("Cloudinary removal was not confirmed");
    } catch {
      try {
        const { error: restoreError } = await db.from("media").insert(item);
        if (restoreError) return { kind: "error", status: 500, error: "Image removal failed and its library record could not be restored. Contact the administrator." };
      } catch {
        return { kind: "error", status: 500, error: "Image removal failed and its library record could not be restored. Contact the administrator." };
      }
      if (!await restoreAttachment()) return { kind: "error", status: 500, error: "Image removal failed and its Blog attachment could not be restored. Contact the administrator." };
      return { kind: "error", status: 502, error: "Cloudinary could not remove this image. Its library record was restored." };
    }

    return { kind: "deleted" };
  } catch {
    return { kind: "error", status: 500, error: "Image could not be deleted. No Cloudinary deletion was attempted." };
  }
}
