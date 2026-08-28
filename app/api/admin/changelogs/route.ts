import { NextResponse } from "next/server";
import { revalidatePath } from "next/cache";
import createSupabaseServerClient from "@/app/lib/supabase/server";

// Best-effort ISR invalidation — must never fail the mutation itself.
function revalidateChangelogPaths() {
  try {
    revalidatePath("/changelog");
    revalidatePath("/");
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
      .from("changelogs")
      .select("*")
      .order("published_at", { ascending: false })
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

    const data = await request.json();

    const { data: changelog, error } = await supabase
      .from("changelogs")
      .insert([data])
      .select()
      .single();

    if (error) throw error;
    revalidateChangelogPaths();
    return NextResponse.json({ data: changelog });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}

export async function PUT(request: Request) {
  try {
    const supabase = await createSupabaseServerClient();
    const { data: { session } } = await supabase.auth.getSession();
    if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const data = await request.json();
    const { id, ...updateData } = data;

    if (!id) return NextResponse.json({ error: "Missing changelog ID" }, { status: 400 });

    const { data: changelog, error } = await supabase
      .from("changelogs")
      .update(updateData)
      .eq("id", id)
      .select()
      .single();

    if (error) throw error;
    revalidateChangelogPaths();
    return NextResponse.json({ data: changelog });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}

export async function DELETE(request: Request) {
  try {
    const supabase = await createSupabaseServerClient();
    const { data: { session } } = await supabase.auth.getSession();
    if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const { searchParams } = new URL(request.url);
    const id = searchParams.get("id");

    if (!id) return NextResponse.json({ error: "Missing changelog ID" }, { status: 400 });

    const { error } = await supabase
      .from("changelogs")
      .delete()
      .eq("id", id);

    if (error) throw error;
    revalidateChangelogPaths();
    return NextResponse.json({ success: true });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
