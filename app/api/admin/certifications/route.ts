import { NextResponse } from "next/server";
import { revalidatePath, revalidateTag } from "next/cache";
import * as z from "zod";
import { requireAdmin } from "@/app/lib/admin-auth";
import { createSupabaseAdminClient } from "@/app/lib/supabase/server";

const isHttpsUrl = (value: string) => {
  try {
    const url = new URL(value);
    return url.protocol === "https:" && !!url.hostname && !url.username && !url.password;
  } catch {
    return false;
  }
};
const optionalUrl = z.union([
  z.string().trim().max(2048).refine(isHttpsUrl, "Use a valid HTTPS URL."),
  z.literal(""),
  z.null(),
]);
const validDate = (value: string) => {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(value)) return false;
  try { return new Date(`${value}T00:00:00Z`).toISOString().slice(0, 10) === value; }
  catch { return false; }
};
const optionalDate = z.union([z.string().refine(validDate, "Use a valid calendar date."), z.literal(""), z.null()]);
const certificationSchema = z.object({
  title: z.string().trim().min(2).max(140),
  issuer: z.string().trim().min(2).max(120),
  issue_date: optionalDate.optional(),
  credential_url: optionalUrl.optional(),
  issuer_logo_url: optionalUrl.optional(),
  badge_image_url: optionalUrl.optional(),
  credential_id: z.string().trim().max(120).nullable().optional(),
  expiration_date: optionalDate.optional(),
  does_not_expire: z.boolean().default(true),
  description: z.string().trim().max(600).nullable().optional(),
  skills: z.array(z.string().trim().min(1).max(60)).max(12).default([]),
  category: z.enum(["Web Development", "Cybersecurity", "AI / ML", "Cloud", "Other"]),
  is_demo: z.boolean().default(false),
  display_order: z.number().int().min(0).max(10000),
  status: z.enum(["draft", "published", "archived"]),
}).strict().superRefine((data, context) => {
  if (!data.does_not_expire && !data.expiration_date) {
    context.addIssue({ code: "custom", path: ["expiration_date"], message: "Expiration date is required." });
  }
  if (!data.does_not_expire && data.issue_date && data.expiration_date && data.expiration_date < data.issue_date) {
    context.addIssue({ code: "custom", path: ["expiration_date"], message: "Expiration cannot precede the issue date." });
  }
});

function revalidateCertificationPaths() {
  try {
    revalidatePath("/credentials");
    revalidatePath("/about");
    revalidatePath("/");
    revalidateTag("credentials");
    return null;
  } catch {
    return "The database change completed, but public Credentials cache refresh could not be confirmed.";
  }
}

function fail(error: unknown) {
  console.error("Certification Admin request failed", error && typeof error === "object" && "code" in error ? error.code : "unknown");
  return NextResponse.json({ error: "Certification request could not be completed. Refresh its status before retrying." }, { status: 503 });
}

function parseBody(data: unknown) {
  const parsed = certificationSchema.safeParse(data);
  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message || "Invalid certification data." } as const;
  }
  const row = parsed.data;
  return {
    data: {
      ...row,
      issue_date: row.issue_date || null,
      credential_url: row.credential_url || null,
      issuer_logo_url: row.issuer_logo_url || null,
      badge_image_url: row.badge_image_url || null,
      credential_id: row.credential_id || null,
      expiration_date: row.does_not_expire ? null : row.expiration_date || null,
      description: row.description || null,
      skills: Array.from(new Set(row.skills.map((skill) => skill.trim()).filter(Boolean))),
    },
  } as const;
}

export async function GET(request: Request) {
  try {
    const auth = await requireAdmin();
    if (auth.response) return auth.response;
    const db = await createSupabaseAdminClient();
    const rawLimit = new URL(request.url).searchParams.get("limit") || "100";
    if (!/^\d{1,3}$/.test(rawLimit) || Number(rawLimit) < 1 || Number(rawLimit) > 200) return NextResponse.json({ error: "Invalid page size." }, { status: 400 });
    const { data, error } = await db.from("certifications").select("*").order("display_order").order("id").limit(Number(rawLimit));
    if (error) throw error;
    return NextResponse.json({ data }, { headers: { "Cache-Control": "private, no-store" } });
  } catch (error) {
    return fail(error);
  }
}

export async function POST(request: Request) {
  try {
    const auth = await requireAdmin();
    if (auth.response) return auth.response;
    const parsed = parseBody(await request.json().catch(() => null));
    if ("error" in parsed) return NextResponse.json({ error: parsed.error }, { status: 400 });
    const db = await createSupabaseAdminClient();
    const { data, error } = await db.from("certifications").insert(parsed.data).select().single();
    if (error) throw error;
    const warning = revalidateCertificationPaths();
    return NextResponse.json({ data, ...(warning ? { warning } : {}) });
  } catch (error) {
    return fail(error);
  }
}

export async function PUT(request: Request) {
  try {
    const auth = await requireAdmin();
    if (auth.response) return auth.response;
    const body = await request.json().catch(() => null);
    const id = typeof body?.id === "string" ? body.id : "";
    if (!z.string().uuid().safeParse(id).success) return NextResponse.json({ error: "Invalid certification ID" }, { status: 400 });
    const { id: _id, ...fields } = body;
    const parsed = parseBody(fields);
    if ("error" in parsed) return NextResponse.json({ error: parsed.error }, { status: 400 });
    const db = await createSupabaseAdminClient();
    const { data, error } = await db.from("certifications").update(parsed.data).eq("id", id).select().maybeSingle();
    if (error) throw error;
    if (!data) return NextResponse.json({ error: "Certification not found. Refresh the list before retrying." }, { status: 404 });
    const warning = revalidateCertificationPaths();
    return NextResponse.json({ data, ...(warning ? { warning } : {}) });
  } catch (error) {
    return fail(error);
  }
}

export async function DELETE(request: Request) {
  try {
    const auth = await requireAdmin();
    if (auth.response) return auth.response;
    const id = new URL(request.url).searchParams.get("id");
    if (!z.string().uuid().safeParse(id).success) return NextResponse.json({ error: "Invalid certification ID" }, { status: 400 });
    const db = await createSupabaseAdminClient();
    const { data, error } = await db.from("certifications").delete().eq("id", id).select("id").maybeSingle();
    if (error) throw error;
    if (!data) return NextResponse.json({ error: "Certification not found. Refresh the list before retrying." }, { status: 404 });
    const warning = revalidateCertificationPaths();
    return NextResponse.json({ success: true, ...(warning ? { warning } : {}) });
  } catch (error) {
    return fail(error);
  }
}
