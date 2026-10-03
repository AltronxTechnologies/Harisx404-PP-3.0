import { NextResponse } from "next/server";
import { revalidatePath } from "next/cache";
import { requireAdmin } from "@/app/lib/admin-auth";
import { createSupabaseAdminClient } from "@/app/lib/supabase/server";
import { z } from "zod";

const faqSchema = z.object({
  question: z.string().trim().min(1).max(200),
  answer: z.string().trim().min(1).max(1000),
  display_order: z.number().int(),
  is_visible: z.boolean(),
}).strict();
const updateSchema = faqSchema.partial().extend({ id: z.string().uuid() }).strict()
  .refine((value) => Object.keys(value).length > 1, "Provide at least one change");

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
    const auth = await requireAdmin();
    if (auth.response) return auth.response;
    const supabase = await createSupabaseAdminClient();

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
    const auth = await requireAdmin();
    if (auth.response) return auth.response;
    const supabase = await createSupabaseAdminClient();

    const parsed = faqSchema.safeParse(await request.json().catch(() => null));
    if (!parsed.success) return NextResponse.json({ error: "Invalid FAQ fields" }, { status: 400 });

    const { data: faq, error } = await supabase
      .from("faqs")
      .insert([parsed.data])
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
    const auth = await requireAdmin();
    if (auth.response) return auth.response;
    const supabase = await createSupabaseAdminClient();

    const parsed = updateSchema.safeParse(await request.json().catch(() => null));
    if (!parsed.success) return NextResponse.json({ error: "Invalid FAQ fields or missing ID" }, { status: 400 });
    const { id, ...updateData } = parsed.data;

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
    const auth = await requireAdmin();
    if (auth.response) return auth.response;
    const supabase = await createSupabaseAdminClient();

    const parsed = z.object({ show_faq_section: z.boolean() }).strict().safeParse(await request.json().catch(() => null));
    if (!parsed.success) {
      return NextResponse.json({ error: "show_faq_section must be a boolean" }, { status: 400 });
    }

    const { error } = await supabase
      .from("site_settings")
      .update(parsed.data)
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
    const auth = await requireAdmin();
    if (auth.response) return auth.response;
    const supabase = await createSupabaseAdminClient();

    const { searchParams } = new URL(request.url);
    const id = searchParams.get("id");

    if (!id || !z.string().uuid().safeParse(id).success) return NextResponse.json({ error: "Invalid FAQ ID" }, { status: 400 });

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
