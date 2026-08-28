import { NextResponse } from "next/server";
import { revalidatePath } from "next/cache";
import createSupabaseServerClient, { createSupabaseAdminClient } from "@/app/lib/supabase/server";

// Best-effort ISR invalidation — must never fail the mutation itself.
function revalidateExperiencePaths() {
  try {
    revalidatePath("/about");
  } catch (e) {
    console.error("Revalidation failed:", e);
  }
}


export async function GET(request: Request) {
  try {
    const supabase = await createSupabaseServerClient();
    const { searchParams } = new URL(request.url);
    const limit = parseInt(searchParams.get("limit") || "50");

    const { data, error } = await supabase
      .from("certifications")
      .select("*")
      .order("display_order", { ascending: true })
      .limit(limit);

    if (error) throw error;
    return NextResponse.json({ data });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const supabase = await createSupabaseServerClient();
    const { data: { session } } = await supabase.auth.getSession();
    if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    // RLS on this table only allows public SELECT; admin mutations must use
    // the service-role client (session + middleware already gate access).
    const db = await createSupabaseAdminClient();

    const data = await request.json();

    const { data: entry, error } = await db
      .from("certifications")
      .insert([data])
      .select()
      .single();

    if (error) throw error;
    revalidateExperiencePaths();
    return NextResponse.json({ data: entry });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}

export async function PUT(request: Request) {
  try {
    const supabase = await createSupabaseServerClient();
    const { data: { session } } = await supabase.auth.getSession();
    if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    // RLS on this table only allows public SELECT; admin mutations must use
    // the service-role client (session + middleware already gate access).
    const db = await createSupabaseAdminClient();

    const data = await request.json();
    const { id, ...updateData } = data;

    if (!id) return NextResponse.json({ error: "Missing certification ID" }, { status: 400 });

    const { data: entry, error } = await db
      .from("certifications")
      .update(updateData)
      .eq("id", id)
      .select()
      .single();

    if (error) throw error;
    revalidateExperiencePaths();
    return NextResponse.json({ data: entry });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}

export async function DELETE(request: Request) {
  try {
    const supabase = await createSupabaseServerClient();
    const { data: { session } } = await supabase.auth.getSession();
    if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    // RLS on this table only allows public SELECT; admin mutations must use
    // the service-role client (session + middleware already gate access).
    const db = await createSupabaseAdminClient();

    const { searchParams } = new URL(request.url);
    const id = searchParams.get("id");

    if (!id) return NextResponse.json({ error: "Missing certification ID" }, { status: 400 });

    const { error } = await db
      .from("certifications")
      .delete()
      .eq("id", id);

    if (error) throw error;
    revalidateExperiencePaths();
    return NextResponse.json({ success: true });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
