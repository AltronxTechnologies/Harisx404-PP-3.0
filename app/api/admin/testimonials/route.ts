import { NextResponse } from "next/server";
import { revalidatePath, revalidateTag } from "next/cache";
import { createSupabaseAdminClient } from "@/app/lib/supabase/server";
import { requireAdmin } from "@/app/lib/admin-auth";

// Best-effort ISR invalidation — must never fail the mutation itself.
function revalidateTestimonialPaths() {
  try {
    revalidateTag("testimonials");
    revalidatePath("/");
  } catch (e) {
    console.error("Revalidation failed:", e);
  }
}

// Whitelist of writable columns — raw request JSON is never passed to the
// database directly (prevents mass assignment of unexpected columns).
const WRITABLE_COLUMNS = [
  "headline",
  "quote",
  "name",
  "role",
  "avatar_url",
  "display_order",
  "status",
  "email",
  "source",
] as const;

function pickWritable(data: Record<string, unknown>) {
  const row: Record<string, unknown> = {};
  for (const key of WRITABLE_COLUMNS) {
    if (key in data) row[key] = data[key];
  }
  return row;
}

export async function GET(request: Request) {
  try {
    const auth = await requireAdmin();
    // The rows include the private submitter email column — admin only.
    if (auth.response) return auth.response;
    // Service-role client for the actual DB ops: RLS only exposes
    // status='published' rows to the session client, so reading/approving/
    // rejecting/deleting pending submissions requires bypassing RLS
    // (safe here — the admin gate above already ran).
    const db = await createSupabaseAdminClient();

    const { searchParams } = new URL(request.url);
    const parsed = parseInt(searchParams.get("limit") || "50", 10);
    const limit = Number.isFinite(parsed) ? Math.min(Math.max(parsed, 1), 200) : 50;

    const { data, error } = await db
      .from("testimonials")
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
    const auth = await requireAdmin();
    if (auth.response) return auth.response;
    // Service-role client for the actual DB ops: RLS only exposes
    // status='published' rows to the session client, so reading/approving/
    // rejecting/deleting pending submissions requires bypassing RLS
    // (safe here — the admin gate above already ran).
    const db = await createSupabaseAdminClient();

    const data = await request.json();

    const { data: testimonial, error } = await db
      .from("testimonials")
      .insert([pickWritable(data)])
      .select()
      .single();

    if (error) throw error;
    revalidateTestimonialPaths();
    return NextResponse.json({ data: testimonial });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}

export async function PUT(request: Request) {
  try {
    const auth = await requireAdmin();
    if (auth.response) return auth.response;
    // Service-role client for the actual DB ops: RLS only exposes
    // status='published' rows to the session client, so reading/approving/
    // rejecting/deleting pending submissions requires bypassing RLS
    // (safe here — the admin gate above already ran).
    const db = await createSupabaseAdminClient();

    const data = await request.json();
    const { id } = data;

    if (!id) return NextResponse.json({ error: "Missing testimonial ID" }, { status: 400 });

    const { data: testimonial, error } = await db
      .from("testimonials")
      .update(pickWritable(data))
      .eq("id", id)
      .select()
      .single();

    if (error) throw error;
    revalidateTestimonialPaths();
    return NextResponse.json({ data: testimonial });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}

export async function DELETE(request: Request) {
  try {
    const auth = await requireAdmin();
    if (auth.response) return auth.response;
    // Service-role client for the actual DB ops: RLS only exposes
    // status='published' rows to the session client, so reading/approving/
    // rejecting/deleting pending submissions requires bypassing RLS
    // (safe here — the admin gate above already ran).
    const db = await createSupabaseAdminClient();

    const { searchParams } = new URL(request.url);
    const id = searchParams.get("id");

    if (!id) return NextResponse.json({ error: "Missing testimonial ID" }, { status: 400 });

    const { data: deleted, error } = await db
      .from("testimonials")
      .delete()
      .eq("id", id)
      .select("id")
      .maybeSingle();

    if (error) throw error;
    if (!deleted) return NextResponse.json({ error: "Testimonial not found. Refresh the list before retrying." }, { status: 404 });
    revalidateTestimonialPaths();
    return NextResponse.json({ success: true });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
