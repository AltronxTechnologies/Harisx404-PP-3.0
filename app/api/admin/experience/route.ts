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

// Columns added after the original schema (tech = 2026 parity; the rest =
// LinkedIn-parity upgrade, see migrations/2026_experience_linkedin.sql).
// Live DBs may not have them until the owner re-runs the migration — detect
// that failure so mutations can retry without the new columns instead of
// hard-failing the admin form.
const OPTIONAL_COLUMNS = [
  "tech",
  "logo_url",
  "location_type",
  "employment_type",
  "start_month",
  "start_year",
  "end_month",
  "end_year",
  "is_current",
  "summary",
  "highlights",
];

function isMissingColumnError(error: any): boolean {
  return (
    typeof error?.message === "string" &&
    /column|schema cache/i.test(error.message)
  );
}

function stripOptionalColumns(data: Record<string, unknown>) {
  const copy: Record<string, unknown> = { ...data };
  for (const col of OPTIONAL_COLUMNS) delete copy[col];
  return copy;
}


export async function GET(request: Request) {
  try {
    const supabase = await createSupabaseServerClient();
    const { searchParams } = new URL(request.url);
    const limit = parseInt(searchParams.get("limit") || "50");

    const { data, error } = await supabase
      .from("experience")
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

    let { data: entry, error } = await db
      .from("experience")
      .insert([data])
      .select()
      .single();

    if (error && isMissingColumnError(error)) {
      ({ data: entry, error } = await db
        .from("experience")
        .insert([stripOptionalColumns(data)])
        .select()
        .single());
    }

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

    if (!id) return NextResponse.json({ error: "Missing experience ID" }, { status: 400 });

    let { data: entry, error } = await db
      .from("experience")
      .update(updateData)
      .eq("id", id)
      .select()
      .single();

    if (error && isMissingColumnError(error)) {
      ({ data: entry, error } = await db
        .from("experience")
        .update(stripOptionalColumns(updateData))
        .eq("id", id)
        .select()
        .single());
    }

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

    if (!id) return NextResponse.json({ error: "Missing experience ID" }, { status: 400 });

    const { error } = await db
      .from("experience")
      .delete()
      .eq("id", id);

    if (error) throw error;
    revalidateExperiencePaths();
    return NextResponse.json({ success: true });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
