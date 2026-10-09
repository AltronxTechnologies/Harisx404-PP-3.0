"use server";

import { revalidatePath, revalidateTag } from "next/cache";
import { createSupabaseAdminClient } from "@/app/lib/supabase/server";
import { requireAdmin } from "@/app/lib/admin-auth";

export async function setFeaturedBlogPost(id: string, featured = true) {
  const auth = await requireAdmin();
  if (auth.response) {
    throw new Error(auth.response.status === 401 ? "Unauthorized" : "Forbidden");
  }

  const admin = await createSupabaseAdminClient();

  if (featured) {
    // 1. Unfeature all other blog posts so only one post is featured across the entire site
    const { error: unfeatureError } = await admin
      .from("blog_posts")
      .update({ featured: false })
      .neq("id", id);
    if (unfeatureError) throw unfeatureError;

    // 2. Feature the target post
    const { data: updated, error: featureError } = await admin
      .from("blog_posts")
      .update({ featured: true })
      .eq("id", id)
      .select("id, title, slug, featured")
      .single();
    if (featureError) throw featureError;

    revalidatePath("/");
    revalidatePath("/blog");
    revalidatePath("/admin/blogs");
    if (updated?.slug) revalidatePath(`/blog/${updated.slug}`);
    try {
      revalidateTag("blog");
    } catch {}

    return { success: true, post: updated };
  } else {
    // Unfeature this post (no post featured)
    const { data: updated, error: unfeatureError } = await admin
      .from("blog_posts")
      .update({ featured: false })
      .eq("id", id)
      .select("id, title, slug, featured")
      .single();
    if (unfeatureError) throw unfeatureError;

    revalidatePath("/");
    revalidatePath("/blog");
    revalidatePath("/admin/blogs");
    if (updated?.slug) revalidatePath(`/blog/${updated.slug}`);
    try {
      revalidateTag("blog");
    } catch {}

    return { success: true, post: updated };
  }
}
