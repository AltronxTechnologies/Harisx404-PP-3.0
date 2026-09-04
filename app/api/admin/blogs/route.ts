import { NextResponse } from "next/server";
import { revalidatePath, revalidateTag } from "next/cache";
import createSupabaseServerClient from "@/app/lib/supabase/server";
import { syncTags } from "@/app/lib/tag-sync";

// Best-effort ISR invalidation — must never fail the mutation itself.
function revalidateBlogPaths(slug?: string | null) {
  try {
    revalidateTag("blog-index");
    revalidatePath("/");
    revalidatePath("/blog");
    if (slug) revalidatePath(`/blog/${slug}`);
    revalidatePath("/rss.xml");
    revalidatePath("/sitemap.xml");
  } catch (e) {
    console.error("Revalidation failed:", e);
  }
}

export async function POST(request: Request) {
  try {
    const supabase = await createSupabaseServerClient();
    
    // Check auth
    const { data: { session } } = await supabase.auth.getSession();
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const data = await request.json();

    // Prepare data for insertion
    const postData = {
      title: data.title,
      slug: data.slug,
      summary: data.summary,
      content: data.content,
      status: data.status,
      cover_image_url: data.cover_image_url || null,
      cover_image_id: data.cover_image_id || null,
      canonical_url: data.canonical_url || null,
      published_at: data.published_at || (data.status === "published" ? new Date().toISOString() : null),
    };

    const { data: insertedData, error } = await supabase
      .from("blog_posts")
      .insert(postData)
      .select()
      .single();

    if (error) {
      console.error("Insert error:", error);
      return NextResponse.json({ error: error.message }, { status: 400 });
    }

    // Process Tags (service-role sync — session writes are blocked by RLS)
    await syncTags({
      joinTable: "blog_post_tags",
      entityColumn: "blog_post_id",
      entityId: insertedData.id,
      tags: data.tags,
    });

    revalidateBlogPaths(insertedData?.slug);

    return NextResponse.json(insertedData);
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}

export async function PUT(request: Request) {
  try {
    const supabase = await createSupabaseServerClient();
    
    // Check auth
    const { data: { session } } = await supabase.auth.getSession();
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const data = await request.json();
    const { id, ...updateData } = data;

    if (!id) {
      return NextResponse.json({ error: "Missing post ID" }, { status: 400 });
    }

    const { data: existingPost } = await supabase
      .from("blog_posts")
      .select("slug, published_at")
      .eq("id", id)
      .single();

    // Prepare data for update
    const postData = {
      title: updateData.title,
      slug: updateData.slug,
      summary: updateData.summary,
      content: updateData.content,
      status: updateData.status,
      cover_image_url: updateData.cover_image_url || null,
      cover_image_id: updateData.cover_image_id || null,
      canonical_url: updateData.canonical_url || null,
      published_at: updateData.published_at || (updateData.status === "published" && !updateData.published_at ? new Date().toISOString() : null),
    };

    // Keep existing published_at if not explicitly changed but already published
    if (updateData.status === "published" && !updateData.published_at) {
      if (existingPost?.published_at) {
        postData.published_at = existingPost.published_at;
      }
    }

    const { data: updatedData, error } = await supabase
      .from("blog_posts")
      .update(postData)
      .eq("id", id)
      .select()
      .single();

    if (error) {
      console.error("Update error:", error);
      return NextResponse.json({ error: error.message }, { status: 400 });
    }

    // Process Tags (replace all; service-role sync — session writes are blocked by RLS)
    await syncTags({
      joinTable: "blog_post_tags",
      entityColumn: "blog_post_id",
      entityId: id,
      tags: updateData.tags,
    });

    revalidateBlogPaths(existingPost?.slug);
    if (updatedData?.slug !== existingPost?.slug) {
      revalidateBlogPaths(updatedData?.slug);
    }

    return NextResponse.json(updatedData);
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
