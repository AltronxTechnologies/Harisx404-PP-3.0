import { NextResponse } from "next/server";
import { z } from "zod";
import { requireAdmin } from "@/app/lib/admin-auth";
import { createSupabaseAdminClient } from "@/app/lib/supabase/server";

export async function GET(request: Request) {
  const auth = await requireAdmin();
  if (auth.response) return auth.response;

  const postId = new URL(request.url).searchParams.get("postId");
  if (postId !== null && !z.string().uuid().safeParse(postId).success) {
    return NextResponse.json({ error: "Invalid post ID" }, { status: 400 });
  }

  try {
    const db = await createSupabaseAdminClient();
    // Probe the relation even without a postId, so an uninstalled migration is visible.
    const probe = await db.from("blog_post_media").select("media_id").limit(0);
    if (probe.error) {
      if (["42P01", "PGRST205"].includes(probe.error.code)) {
        return NextResponse.json({ error: "Apply migration 2026_blog_post_media.sql to use Blog images." }, { status: 503 });
      }
      throw probe.error;
    }

    if (!postId) return NextResponse.json({ data: [], available: true });

    const { data, error } = await db.from("blog_post_media")
      .select("media:media_id(id, url, secure_url, alt_text)")
      .eq("blog_post_id", postId)
      .order("display_order", { ascending: true });
    if (error) {
      if (["42P01", "PGRST200", "PGRST205"].includes(error.code)) {
        return NextResponse.json({ error: "Apply migration 2026_blog_post_media.sql and reload the database schema to use Blog images." }, { status: 503 });
      }
      throw error;
    }

    return NextResponse.json({ data: data?.map((row) => row.media) ?? [], available: true });
  } catch {
    return NextResponse.json({ error: "Blog images could not be loaded." }, { status: 500 });
  }
}
