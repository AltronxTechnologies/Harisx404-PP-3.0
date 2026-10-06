import { NextResponse } from "next/server";
import { revalidatePath, revalidateTag } from "next/cache";
import { z } from "zod";
import { createSupabaseAdminClient } from "@/app/lib/supabase/server";
import { requireAdmin } from "@/app/lib/admin-auth";

const idSchema = z.string().uuid();
const avatarUrl = z.string().trim().max(2048).refine((value) => {
  if (!/^https:\/\//i.test(value) || /[\u0000-\u001f\u007f]/.test(value)) return false;
  try {
    const url = new URL(value);
    return url.protocol === "https:" && !!url.hostname && !url.username && !url.password;
  } catch {
    return false;
  }
}, "Use an HTTPS image URL without credentials").nullable().optional();

const fields = z.object({
  headline: z.string().trim().min(1).max(70),
  quote: z.string().trim().min(1).max(280),
  name: z.string().trim().min(1).max(80),
  role: z.string().trim().min(1).max(80).nullable().optional(),
  avatar_url: avatarUrl,
  display_order: z.number().int(),
  status: z.enum(["pending", "draft", "published", "archived"]),
}).strict();
const updateSchema = fields.partial().extend({ id: idSchema }).strict()
  .refine((value) => Object.keys(value).length > 1, "Provide at least one change");

function failure(error: unknown) {
  console.error("Admin Testimonials request failed", error);
  return NextResponse.json({ error: "Testimonials could not be saved or loaded. Refresh their status before retrying." }, { status: 503 });
}

// Best-effort ISR invalidation — must never fail the mutation itself.
function revalidateTestimonialPaths() {
  try {
    revalidateTag("testimonials");
    revalidatePath("/");
    return null;
  } catch {
    return "Testimonial was saved, but the homepage cache could not be refreshed. Visitors may temporarily see the previous version.";
  }
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
    const rawLimit = searchParams.get("limit") || "50";
    if (!/^\d{1,3}$/.test(rawLimit) || Number(rawLimit) < 1 || Number(rawLimit) > 200) return NextResponse.json({ error: "Invalid page size" }, { status: 400 });
    const limit = Number(rawLimit);

    const { data, error } = await db
      .from("testimonials")
      .select("*")
      .order("display_order", { ascending: true }).order("id")
      .limit(limit);

    if (error) throw error;
    return NextResponse.json({ data }, { headers: { "Cache-Control": "private, no-store" } });
  } catch (error) {
    return failure(error);
  }
}

export async function POST(request: Request) {
  try {
    const auth = await requireAdmin();
    if (auth.response) return auth.response;
    const parsed = fields.safeParse(await request.json().catch(() => null));
    if (!parsed.success) return NextResponse.json({ error: "Invalid testimonial fields", fields: parsed.error.flatten().fieldErrors }, { status: 400 });
    const db = await createSupabaseAdminClient();

    const { data: testimonial, error } = await db
      .from("testimonials")
      .insert([parsed.data])
      .select()
      .single();

    if (error) throw error;
    const warning = revalidateTestimonialPaths();
    return NextResponse.json({ data: testimonial, ...(warning ? { warning } : {}) });
  } catch (error) {
    return failure(error);
  }
}

export async function PUT(request: Request) {
  try {
    const auth = await requireAdmin();
    if (auth.response) return auth.response;
    const parsed = updateSchema.safeParse(await request.json().catch(() => null));
    if (!parsed.success) return NextResponse.json({ error: "Invalid testimonial fields or missing ID", fields: parsed.error.flatten().fieldErrors }, { status: 400 });
    const { id, ...changes } = parsed.data;
    const db = await createSupabaseAdminClient();

    const { data: testimonial, error } = await db
      .from("testimonials")
      .update(changes)
      .eq("id", id)
      .select()
      .maybeSingle();

    if (error) throw error;
    if (!testimonial) return NextResponse.json({ error: "Testimonial not found. Refresh the list before retrying." }, { status: 404 });
    const warning = revalidateTestimonialPaths();
    return NextResponse.json({ data: testimonial, ...(warning ? { warning } : {}) });
  } catch (error) {
    return failure(error);
  }
}

export async function DELETE(request: Request) {
  try {
    const auth = await requireAdmin();
    if (auth.response) return auth.response;
    const { searchParams } = new URL(request.url);
    const id = searchParams.get("id");

    if (!idSchema.safeParse(id).success) return NextResponse.json({ error: "Invalid testimonial ID" }, { status: 400 });
    const db = await createSupabaseAdminClient();

    const { data: deleted, error } = await db
      .from("testimonials")
      .delete()
      .eq("id", id)
      .select("id")
      .maybeSingle();

    if (error) throw error;
    if (!deleted) return NextResponse.json({ error: "Testimonial not found. Refresh the list before retrying." }, { status: 404 });
    const warning = revalidateTestimonialPaths();
    return NextResponse.json({ success: true, ...(warning ? { warning } : {}) });
  } catch (error) {
    return failure(error);
  }
}
