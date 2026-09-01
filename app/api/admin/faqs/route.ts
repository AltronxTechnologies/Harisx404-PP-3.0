import { NextResponse } from "next/server";
import { revalidatePath } from "next/cache";
import createSupabaseServerClient from "@/app/lib/supabase/server";

// Best-effort ISR invalidation — must never fail the mutation itself.
function revalidateFaqPaths() {
  try {
    revalidatePath("/");
  } catch (e) {
    console.error("Revalidation failed:", e);
  }
}

export async function GET() {
  try {
    const supabase = await createSupabaseServerClient();

    const { data, error } = await supabase
      .from("faqs")
      .select("*")
      .order("display_order", { ascending: true })
      .order("created_at", { ascending: true });

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

    const { data: faq, error } = await supabase
      .from("faqs")
      .insert([data])
      .select()
      .single();

    if (error) throw error;
    revalidateFaqPaths();
    return NextResponse.json({ data: faq });
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

    if (!id) return NextResponse.json({ error: "Missing FAQ ID" }, { status: 400 });

    const { data: faq, error } = await supabase
      .from("faqs")
      .update(updateData)
      .eq("id", id)
      .select()
      .single();

    if (error) throw error;
    revalidateFaqPaths();
    return NextResponse.json({ data: faq });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}

/**
 * PATCH — whole-section switch. The live site_settings table is a single
 * row with named columns, so this flips its show_faq_section boolean.
 */
export async function PATCH(request: Request) {
  try {
    const supabase = await createSupabaseServerClient();
    const { data: { session } } = await supabase.auth.getSession();
    if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const { show_faq_section } = await request.json();
    if (typeof show_faq_section !== "boolean") {
      return NextResponse.json({ error: "show_faq_section must be a boolean" }, { status: 400 });
    }

    const { error } = await supabase
      .from("site_settings")
      .update({ show_faq_section })
      .not("id", "is", null);

    if (error) throw error;
    revalidateFaqPaths();
    return NextResponse.json({ success: true });
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

    if (!id) return NextResponse.json({ error: "Missing FAQ ID" }, { status: 400 });

    const { error } = await supabase
      .from("faqs")
      .delete()
      .eq("id", id);

    if (error) throw error;
    revalidateFaqPaths();
    return NextResponse.json({ success: true });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
