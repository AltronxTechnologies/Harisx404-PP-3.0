import "server-only";

import { revalidatePath, revalidateTag } from "next/cache";
import { createSupabaseAdminClient } from "@/app/lib/supabase/server";

export async function changeFeaturedBlogPost(id: string, featured: boolean) {
  const db = await createSupabaseAdminClient();
  const { data, error } = await db.rpc("set_featured_blog_post", { p_id: id, p_featured: featured });
  if (error) {
    if (["PGRST202", "42883"].includes(error.code)) {
      return { success: false as const, status: 503, error: "Featured selection needs the reviewed database migration." };
    }
    if (error.message.includes("BLOG_FEATURED_NOT_FOUND")) {
      return { success: false as const, status: 404, error: "Blog post not found. Reload the list." };
    }
    if (error.message.includes("BLOG_FEATURED_INVALID")) {
      return { success: false as const, status: 400, error: "Choose a published article whose publication date has passed." };
    }
    return { success: false as const, status: 503, error: "Featured selection could not be confirmed. Refresh before retrying." };
  }
  const post = data?.post as { id?: string; title?: string; slug?: string; featured?: boolean } | undefined;
  if (post?.id !== id || post.featured !== featured || !post.slug) {
    return { success: false as const, status: 503, error: "Featured selection could not be confirmed. Refresh before retrying." };
  }

  try {
    revalidateTag("blog-index");
    revalidateTag("blog");
    revalidatePath("/");
    revalidatePath("/blog");
    revalidatePath("/admin/blogs");
    for (const slug of new Set([post.slug, ...(Array.isArray(data.previous_slugs) ? data.previous_slugs : [])])) {
      if (typeof slug === "string") revalidatePath(`/blog/${slug}`);
    }
  } catch {
    return { success: true as const, post, warning: "Selection saved, but public pages may show the previous article until their cache refreshes." };
  }
  return { success: true as const, post };
}
