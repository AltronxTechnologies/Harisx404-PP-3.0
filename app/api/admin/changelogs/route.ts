import { NextResponse } from "next/server";
import { revalidatePath } from "next/cache";
import { z } from "zod";
import { requireAdmin } from "@/app/lib/admin-auth";
import { createSupabaseAdminClient } from "@/app/lib/supabase/server";

const changelogSchema = z.object({
  title: z.string().trim().min(1).max(200),
  slug: z.string().trim().regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/).max(200),
  content: z.string().trim().min(1).max(200000),
  status: z.enum(["draft", "published", "archived"]),
  image_url: z.union([z.string().trim().url(), z.literal(""), z.null()]).optional(),
  published_at: z.union([
    z.string().regex(/^\d{4}-\d{2}-\d{2}$/).refine((value) => {
      const timestamp = Date.parse(`${value}T00:00:00Z`);
      return Number.isFinite(timestamp) && new Date(timestamp).toISOString().slice(0, 10) === value;
    }),
    z.string().datetime({ offset: true }), z.literal(""), z.null(),
  ]).optional(),
}).strict();
const updateSchema = changelogSchema.partial().extend({ id: z.string().uuid() }).strict()
  .refine((value) => Object.keys(value).length > 1, "Provide at least one change");

function normalizeChangelog<T extends { image_url?: string | null; published_at?: string | null }>(value: T) {
  return {
    ...value,
    ...(value.image_url === "" ? { image_url: null } : {}),
    ...(value.published_at === "" ? { published_at: null } : {}),
  };
}

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
    const auth = await requireAdmin();
    if (auth.response) return auth.response;
    const requestedLimit = Number(new URL(request.url).searchParams.get("limit") ?? 50);
    if (!Number.isSafeInteger(requestedLimit) || requestedLimit < 1) return NextResponse.json({ error: "Invalid limit" }, { status: 400 });
    const supabase = await createSupabaseAdminClient();

    const { data, error } = await supabase
      .from("changelogs")
      .select("*")
      .order("published_at", { ascending: false })
      .limit(Math.min(requestedLimit, 100));

    if (error) throw error;
    return NextResponse.json({ data }, { headers: { "Cache-Control": "private, no-store" } });
  } catch {
    return NextResponse.json({ error: "Changelogs could not be loaded" }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const auth = await requireAdmin();
    if (auth.response) return auth.response;
    const parsed = changelogSchema.safeParse(await request.json().catch(() => null));
    if (!parsed.success) return NextResponse.json({ error: "Invalid Changelog fields" }, { status: 400 });
    const supabase = await createSupabaseAdminClient();

    const { data: changelog, error } = await supabase
      .from("changelogs")
      .insert([normalizeChangelog(parsed.data)])
      .select()
      .single();

    if (error) throw error;
    revalidateChangelogPaths();
    return NextResponse.json({ data: changelog });
  } catch {
    return NextResponse.json({ error: "Changelog could not be created" }, { status: 500 });
  }
}

export async function PUT(request: Request) {
  try {
    const auth = await requireAdmin();
    if (auth.response) return auth.response;
    const parsed = updateSchema.safeParse(await request.json().catch(() => null));
    if (!parsed.success) return NextResponse.json({ error: "Invalid Changelog fields or ID" }, { status: 400 });
    const { id, ...updateData } = parsed.data;
    const supabase = await createSupabaseAdminClient();

    const { data: changelog, error } = await supabase
      .from("changelogs")
      .update(normalizeChangelog(updateData))
      .eq("id", id)
      .select()
      .maybeSingle();

    if (error) throw error;
    if (!changelog) return NextResponse.json({ error: "Changelog not found" }, { status: 404 });
    revalidateChangelogPaths();
    return NextResponse.json({ data: changelog });
  } catch {
    return NextResponse.json({ error: "Changelog could not be updated" }, { status: 500 });
  }
}

export async function DELETE(request: Request) {
  try {
    const auth = await requireAdmin();
    if (auth.response) return auth.response;
    const id = new URL(request.url).searchParams.get("id");
    if (!z.string().uuid().safeParse(id).success) return NextResponse.json({ error: "Invalid Changelog ID" }, { status: 400 });
    const supabase = await createSupabaseAdminClient();

    const { data, error } = await supabase
      .from("changelogs")
      .delete()
      .eq("id", id)
      .select("id")
      .maybeSingle();

    if (error) throw error;
    if (!data) return NextResponse.json({ error: "Changelog not found" }, { status: 404 });
    revalidateChangelogPaths();
    return NextResponse.json({ success: true });
  } catch {
    return NextResponse.json({ error: "Changelog could not be deleted" }, { status: 500 });
  }
}
