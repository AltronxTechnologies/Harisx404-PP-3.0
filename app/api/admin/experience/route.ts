import { NextResponse } from "next/server";
import { revalidatePath, revalidateTag } from "next/cache";
import { z } from "zod";
import { requireAdmin } from "@/app/lib/admin-auth";
import { createSupabaseAdminClient } from "@/app/lib/supabase/server";

const idSchema = z.string().uuid();
const year = z.number().int().min(1900).max(2100);
const month = z.number().int().min(1).max(12);
const logoUrl = z.string().trim().max(2048).nullable().refine((value) => {
  if (!value) return true;
  if (value.startsWith("/") && !value.startsWith("//") && !value.split("/").includes("..")) return true;
  try {
    const url = new URL(value);
    return url.protocol === "https:" && !!url.hostname && !url.username && !url.password;
  } catch {
    return false;
  }
}, "Use an HTTPS image URL or a site-relative path");

const fields = z.object({
  role: z.string().trim().min(1).max(160),
  company: z.string().trim().min(1).max(160),
  logo_url: logoUrl,
  location: z.string().trim().max(160).nullable(),
  location_type: z.enum(["On-site", "Hybrid", "Remote"]).nullable(),
  employment_type: z.enum(["Full-time", "Part-time", "Self-employed", "Freelance", "Contract", "Internship", "Apprenticeship", "Seasonal", "Open source"]).nullable(),
  start_month: month.nullable(),
  start_year: year,
  end_month: month.nullable(),
  end_year: year.nullable(),
  is_current: z.boolean(),
  summary: z.string().trim().max(1000).nullable(),
  highlights: z.array(z.object({ lead: z.string().max(80), text: z.string().max(500) }).strict()).max(20),
  display_order: z.number().int(),
  status: z.enum(["draft", "published", "archived"]),
}).strict();
const createSchema = fields.refine((value) => value.is_current ? !value.end_month && !value.end_year : !value.end_month || value.end_year !== null, "Current positions cannot have an end date; other positions require an end year with an end month")
  .refine((value) => value.is_current || !value.end_year || value.end_year > value.start_year || (value.end_year === value.start_year && (!value.start_month || !value.end_month || value.end_month >= value.start_month)), "End date must not precede start date");
const updateSchema = fields.partial().extend({ id: idSchema }).strict()
  .refine((value) => Object.keys(value).length > 1, "Provide at least one change");

function revalidateExperiencePaths() {
  try {
    revalidateTag("experiences");
    revalidatePath("/about");
    return null;
  } catch {
    return "Experience was saved, but the public About cache could not be refreshed. Visitors may temporarily see the previous version.";
  }
}

function failure(error: unknown) {
  console.error("Admin Experience request failed", error);
  return NextResponse.json({ error: "Experience could not be saved or loaded. Refresh its status before retrying." }, { status: 503 });
}

export async function GET(request: Request) {
  try {
    const auth = await requireAdmin();
    if (auth.response) return auth.response;
    const rawLimit = new URL(request.url).searchParams.get("limit") || "50";
    if (!/^\d{1,3}$/.test(rawLimit) || Number(rawLimit) < 1 || Number(rawLimit) > 200) return NextResponse.json({ error: "Invalid page size." }, { status: 400 });
    const db = await createSupabaseAdminClient();
    const { data, error } = await db.from("experience").select("*")
      .order("display_order", { ascending: true }).order("id")
      .limit(Number(rawLimit));
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
    const parsed = createSchema.safeParse(await request.json().catch(() => null));
    if (!parsed.success) return NextResponse.json({ error: "Invalid Experience fields", fields: parsed.error.flatten().fieldErrors }, { status: 400 });
    const db = await createSupabaseAdminClient();
    const { data, error } = await db.from("experience").insert(parsed.data).select().single();
    if (error) throw error;
    const warning = revalidateExperiencePaths();
    return NextResponse.json({ data, ...(warning ? { warning } : {}) });
  } catch (error) {
    return failure(error);
  }
}

export async function PUT(request: Request) {
  try {
    const auth = await requireAdmin();
    if (auth.response) return auth.response;
    const parsed = updateSchema.safeParse(await request.json().catch(() => null));
    if (!parsed.success) return NextResponse.json({ error: "Invalid Experience fields or missing ID", fields: parsed.error.flatten().fieldErrors }, { status: 400 });
    const { id, ...changes } = parsed.data;
    const db = await createSupabaseAdminClient();
    const { data: current, error: readError } = await db.from("experience")
      .select("start_month, start_year, end_month, end_year, is_current")
      .eq("id", id).maybeSingle();
    if (readError) throw readError;
    if (!current) return NextResponse.json({ error: "Experience entry not found. Refresh the list before retrying." }, { status: 404 });
    const dates = { ...current, ...changes };
    if (dates.is_current && (changes.end_month || changes.end_year)) {
      return NextResponse.json({ error: "Current positions cannot have an end date." }, { status: 400 });
    }
    if (changes.is_current === true) {
      changes.end_month = null;
      changes.end_year = null;
    } else if (!dates.is_current && ((dates.end_month && !dates.end_year) || (dates.end_year && dates.start_year && (dates.end_year < dates.start_year || (dates.end_year === dates.start_year && dates.start_month && dates.end_month && dates.end_month < dates.start_month))))) {
      return NextResponse.json({ error: "End date cannot precede the start date or lack an end year." }, { status: 400 });
    }
    const { data, error } = await db.from("experience").update(changes).eq("id", id).select().maybeSingle();
    if (error) throw error;
    if (!data) return NextResponse.json({ error: "Experience entry not found. Refresh the list before retrying." }, { status: 404 });
    const warning = revalidateExperiencePaths();
    return NextResponse.json({ data, ...(warning ? { warning } : {}) });
  } catch (error) {
    return failure(error);
  }
}

export async function DELETE(request: Request) {
  try {
    const auth = await requireAdmin();
    if (auth.response) return auth.response;
    const id = new URL(request.url).searchParams.get("id");
    if (!idSchema.safeParse(id).success) return NextResponse.json({ error: "Invalid Experience ID" }, { status: 400 });
    const db = await createSupabaseAdminClient();
    const { data, error } = await db.from("experience").delete().eq("id", id).select("id").maybeSingle();
    if (error) throw error;
    if (!data) return NextResponse.json({ error: "Experience entry not found. Refresh the list before retrying." }, { status: 404 });
    const warning = revalidateExperiencePaths();
    return NextResponse.json({ success: true, ...(warning ? { warning } : {}) });
  } catch (error) {
    return failure(error);
  }
}
