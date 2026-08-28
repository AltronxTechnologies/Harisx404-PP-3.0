import { NextResponse } from "next/server";
import { revalidatePath } from "next/cache";
import createSupabaseServerClient from "@/app/lib/supabase/server";
import { syncTags } from "@/app/lib/tag-sync";

// Best-effort ISR invalidation — must never fail the mutation itself.
function revalidateProjectPaths(slug?: string | null) {
  try {
    revalidatePath("/");
    revalidatePath("/projects");
    if (slug) revalidatePath(`/projects/${slug}`);
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

    const projectData = {
      title: data.title,
      slug: data.slug,
      description: data.description,
      content: data.content,
      status: data.status,
      cover_image_url: data.cover_image_url || null,
      live_url: data.live_url || null,
      github_url: data.github_url || null,
      start_date: data.start_date || null,
      end_date: data.end_date || null,
      featured: data.featured,
      tagline: data.tagline || null,
      category: data.category || null,
      year: data.year || null,
      tech_stack: Array.isArray(data.tech_stack) ? data.tech_stack : null,
      features: Array.isArray(data.features) ? data.features : null,
    };

    const { data: insertedData, error } = await supabase
      .from("projects")
      .insert(projectData)
      .select()
      .single();

    if (error) {
      console.error("Insert error:", error);
      return NextResponse.json({ error: error.message }, { status: 400 });
    }

    await syncTags({
      joinTable: "project_tags",
      entityColumn: "project_id",
      entityId: insertedData.id,
      tags: data.tags,
    });

    revalidateProjectPaths(insertedData?.slug);

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
      return NextResponse.json({ error: "Missing project ID" }, { status: 400 });
    }

    const projectData = {
      title: updateData.title,
      slug: updateData.slug,
      description: updateData.description,
      content: updateData.content,
      status: updateData.status,
      cover_image_url: updateData.cover_image_url || null,
      live_url: updateData.live_url || null,
      github_url: updateData.github_url || null,
      start_date: updateData.start_date || null,
      end_date: updateData.end_date || null,
      featured: updateData.featured,
      tagline: updateData.tagline || null,
      category: updateData.category || null,
      year: updateData.year || null,
      tech_stack: Array.isArray(updateData.tech_stack) ? updateData.tech_stack : null,
      features: Array.isArray(updateData.features) ? updateData.features : null,
    };

    const { data: updatedData, error } = await supabase
      .from("projects")
      .update(projectData)
      .eq("id", id)
      .select()
      .single();

    if (error) {
      console.error("Update error:", error);
      return NextResponse.json({ error: error.message }, { status: 400 });
    }

    await syncTags({
      joinTable: "project_tags",
      entityColumn: "project_id",
      entityId: id,
      tags: updateData.tags,
    });

    revalidateProjectPaths(updatedData?.slug);

    return NextResponse.json(updatedData);
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}

export async function DELETE(request: Request) {
  try {
    const supabase = await createSupabaseServerClient();
    
    // Check auth
    const { data: { session } } = await supabase.auth.getSession();
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const id = searchParams.get("id");

    if (!id) {
      return NextResponse.json({ error: "Missing project ID" }, { status: 400 });
    }

    const { error } = await supabase
      .from("projects")
      .delete()
      .eq("id", id);

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 400 });
    }

    revalidateProjectPaths();

    return NextResponse.json({ success: true });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
