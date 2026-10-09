import { NextResponse } from "next/server";
import { revalidatePath, revalidateTag } from "next/cache";
import { z } from "zod";
import createSupabaseServerClient, { createSupabaseAdminClient } from "@/app/lib/supabase/server";

const featuredPayloadSchema = z.object({
  id: z.string().uuid(),
  featured: z.boolean().default(true),
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
    return NextResponse.json({ error: "Admin access is not configured" }, { status: 500 });
  }
  if (user.email?.toLowerCase() !== adminEmail) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  return null;
}

export async function POST(request: Request) {
  try {
    const denied = await authorizeAdmin();
    if (denied) return denied;

    const body = await request.json();
    const { id, featured } = featuredPayloadSchema.parse(body);

    const admin = await createSupabaseAdminClient();

    // Verify the post exists
    const { data: post, error: postError } = await admin
      .from("blog_posts")
      .select("id, title, slug, status")
      .eq("id", id)
      .single();

    if (postError || !post) {
      return NextResponse.json({ error: "Blog post not found" }, { status: 404 });
    }

    if (featured) {
      // 1. Unfeature all other posts so only 1 post is featured site-wide
      const { error: unfeatureError } = await admin
        .from("blog_posts")
        .update({ featured: false })
        .neq("id", id);
      if (unfeatureError) throw unfeatureError;

      // 2. Set target post as featured
      const { data: updated, error: updateError } = await admin
        .from("blog_posts")
        .update({ featured: true })
        .eq("id", id)
        .select("id, title, slug, featured")
        .single();
      if (updateError) throw updateError;

      revalidatePath("/");
      revalidatePath("/blog");
      revalidatePath("/admin/blogs");
      if (post.slug) revalidatePath(`/blog/${post.slug}`);
      try {
        revalidateTag("blog");
      } catch {}

      return NextResponse.json({
        success: true,
        message: `"${post.title}" is now the featured post.`,
        post: updated,
      });
    } else {
      // Unfeature this post
      const { data: updated, error: updateError } = await admin
        .from("blog_posts")
        .update({ featured: false })
        .eq("id", id)
        .select("id, title, slug, featured")
        .single();
      if (updateError) throw updateError;

      revalidatePath("/");
      revalidatePath("/blog");
      revalidatePath("/admin/blogs");
      if (post.slug) revalidatePath(`/blog/${post.slug}`);
      try {
        revalidateTag("blog");
      } catch {}

      return NextResponse.json({
        success: true,
        message: `"${post.title}" is no longer featured.`,
        post: updated,
      });
    }
  } catch (error) {
    console.error("Featured toggle failed:", error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Failed to update featured post" },
      { status: 500 }
    );
  }
}
