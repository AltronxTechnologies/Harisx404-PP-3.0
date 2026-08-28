import { NextResponse } from "next/server";
import { revalidatePath } from "next/cache";
import createSupabaseServerClient, { createSupabaseAdminClient } from "@/app/lib/supabase/server";

// Best-effort ISR invalidation — must never fail the mutation itself.
function revalidateTestimonialPaths() {
  try {
    revalidatePath("/");
  } catch (e) {
    console.error("Revalidation failed:", e);
  }
}

/**
 * Admin gate for every handler in this route:
 * - auth.getUser() verifies the JWT server-side (getSession() does not)
 * - the ADMIN_EMAIL allowlist matches the middleware rule for /admin pages,
 *   so a random authenticated Supabase user can never hit these endpoints.
 */
async function requireAdmin(
  supabase: Awaited<ReturnType<typeof createSupabaseServerClient>>,
) {
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return false;
  const adminEmail = process.env.ADMIN_EMAIL;
  if (adminEmail && user.email !== adminEmail) return false;
  return true;
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
    const supabase = await createSupabaseServerClient();
    // The rows include the private submitter email column — admin only.
    if (!(await requireAdmin(supabase))) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
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
    const supabase = await createSupabaseServerClient();
    if (!(await requireAdmin(supabase))) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
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
    const supabase = await createSupabaseServerClient();
    if (!(await requireAdmin(supabase))) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
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
    const supabase = await createSupabaseServerClient();
    if (!(await requireAdmin(supabase))) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    // Service-role client for the actual DB ops: RLS only exposes
    // status='published' rows to the session client, so reading/approving/
    // rejecting/deleting pending submissions requires bypassing RLS
    // (safe here — the admin gate above already ran).
    const db = await createSupabaseAdminClient();

    const { searchParams } = new URL(request.url);
    const id = searchParams.get("id");

    if (!id) return NextResponse.json({ error: "Missing testimonial ID" }, { status: 400 });

    const { error } = await db
      .from("testimonials")
      .delete()
      .eq("id", id);

    if (error) throw error;
    revalidateTestimonialPaths();
    return NextResponse.json({ success: true });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
