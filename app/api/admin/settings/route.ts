import { NextResponse } from "next/server";
import { revalidatePath } from "next/cache";
import { z } from "zod";
import { requireAdmin } from "@/app/lib/admin-auth";
import { createSupabaseAdminClient } from "@/app/lib/supabase/server";

const SETTINGS_COLUMNS = "id, site_name, seo_description, seo_keywords, github_url, twitter_url, linkedin_url, email_address, updated_at";
const secureUrl = z.string().trim().max(2048).refine((value) => {
  if (!value) return true;
  try {
    const url = new URL(value);
    return url.protocol === "https:" && !!url.hostname && !url.username && !url.password;
  } catch {
    return false;
  }
}, "Use a valid HTTPS URL without embedded credentials");

const settingsSchema = z.object({
  updated_at: z.string().datetime({ offset: true }),
  site_name: z.string().trim().min(1).max(120).optional(),
  seo_description: z.string().trim().max(500).optional(),
  seo_keywords: z.string().trim().max(500).optional(),
  github_url: secureUrl.optional(),
  twitter_url: secureUrl.optional(),
  linkedin_url: secureUrl.optional(),
  email_address: z.union([z.literal(""), z.string().trim().email().max(320)]).optional(),
}).strict().refine((value) => Object.keys(value).some((key) => key !== "updated_at"), "Provide at least one setting");

async function settingsRow() {
  const db = await createSupabaseAdminClient();
  const { data, error } = await db.from("site_settings").select(SETTINGS_COLUMNS).limit(2);
  if (error) throw error;
  if (data?.length !== 1) return null;
  return { db, row: data[0] };
}

export async function GET() {
  try {
    const auth = await requireAdmin();
    if (auth.response) return auth.response;
    const result = await settingsRow();
    if (!result) return NextResponse.json({ error: "Site settings are not configured" }, { status: 503 });
    const row = result.row;
    return NextResponse.json({
      site_name: row.site_name ?? "",
      seo_description: row.seo_description ?? "",
      seo_keywords: row.seo_keywords ?? "",
      github_url: row.github_url ?? "",
      twitter_url: row.twitter_url ?? "",
      linkedin_url: row.linkedin_url ?? "",
      email_address: row.email_address ?? "",
      updated_at: row.updated_at ?? null,
    }, { headers: { "Cache-Control": "private, no-store" } });
  } catch (error) {
    console.error("Unable to read Admin settings:", error);
    return NextResponse.json({ error: "Site settings could not be loaded" }, { status: 503 });
  }
}

export async function PUT(request: Request) {
  try {
    const auth = await requireAdmin();
    if (auth.response) return auth.response;
    let body: unknown;
    try {
      body = await request.json();
    } catch {
      return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 });
    }
    const parsed = settingsSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json({ error: "Invalid settings", fields: parsed.error.flatten().fieldErrors }, { status: 400 });
    }

    const result = await settingsRow();
    if (!result) return NextResponse.json({ error: "Site settings are not configured" }, { status: 503 });
    const { updated_at, ...changes } = parsed.data;
    const currentRevision = result.row.updated_at;
    if (typeof currentRevision !== "string" || currentRevision !== updated_at) {
      return NextResponse.json({ error: "Site settings changed; reload before saving" }, { status: 409 });
    }
    const previousTime = Date.parse(currentRevision);
    if (!Number.isFinite(previousTime)) {
      return NextResponse.json({ error: "Site settings changed; reload before saving" }, { status: 409 });
    }
    const nextUpdatedAt = new Date(Math.max(Date.now(), previousTime + 1)).toISOString();
    const { data, error } = await result.db.from("site_settings")
      .update({ ...changes, updated_at: nextUpdatedAt })
      .eq("id", result.row.id)
      .eq("updated_at", updated_at)
      .select("id, updated_at")
      .maybeSingle();
    if (error) throw error;
    if (!data) return NextResponse.json({ error: "Site settings changed; reload before saving" }, { status: 409 });
    if (typeof data.updated_at !== "string" || Date.parse(data.updated_at) <= previousTime) {
      return NextResponse.json({ error: "Settings save could not be confirmed; reload before retrying" }, { status: 503 });
    }
    try {
      revalidatePath("/", "layout");
      revalidatePath("/about");
    } catch (revalidationError) {
      console.error("Admin settings saved, but cache revalidation failed:", revalidationError);
      return NextResponse.json({ success: true, updated_at: data.updated_at, warning: "Changes saved, but public pages may need a refresh" }, { headers: { "Cache-Control": "private, no-store" } });
    }
    return NextResponse.json({ success: true, updated_at: data.updated_at }, { headers: { "Cache-Control": "private, no-store" } });
  } catch (error) {
    console.error("Unable to save Admin settings:", error);
    return NextResponse.json({ error: "Site settings could not be saved" }, { status: 503 });
  }
}
