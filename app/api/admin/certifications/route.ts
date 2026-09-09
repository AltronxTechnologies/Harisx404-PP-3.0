import { NextResponse } from "next/server";
import { revalidatePath, revalidateTag } from "next/cache";
import * as z from "zod";
import createSupabaseServerClient, {
  createSupabaseAdminClient,
} from "@/app/lib/supabase/server";

const isHttpsUrl = (value: string) => {
  try {
    return new URL(value).protocol === "https:";
  } catch {
    return false;
  }
};
const optionalUrl = z.union([
  z.string().trim().refine(isHttpsUrl, "Use a valid HTTPS URL."),
  z.literal(""),
  z.null(),
]);
const certificationSchema = z.object({
  title: z.string().trim().min(2).max(140),
  issuer: z.string().trim().min(2).max(120),
  issue_date: z.string().trim().max(40).nullable().optional(),
  credential_url: optionalUrl.optional(),
  issuer_logo_url: optionalUrl.optional(),
  badge_image_url: optionalUrl.optional(),
  credential_id: z.string().trim().max(120).nullable().optional(),
  expiration_date: z.string().trim().max(40).nullable().optional(),
  does_not_expire: z.boolean().default(true),
  description: z.string().trim().max(600).nullable().optional(),
  skills: z.array(z.string().trim().min(1).max(60)).max(12).default([]),
  category: z.enum(["Web Development", "Cybersecurity", "AI / ML", "Cloud", "Other"]),
  is_demo: z.boolean().default(false),
  display_order: z.number().int().min(0).max(10000),
  status: z.enum(["draft", "published", "archived"]),
}).superRefine((data, context) => {
  if (!data.does_not_expire && !data.expiration_date) {
    context.addIssue({ code: "custom", path: ["expiration_date"], message: "Expiration date is required." });
  }
});

async function requireAdmin(
  supabase: Awaited<ReturnType<typeof createSupabaseServerClient>>,
) {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return false;
  const adminEmail = process.env.ADMIN_EMAIL?.trim().toLowerCase();
  if (!adminEmail) return false;
  return user.email?.trim().toLowerCase() === adminEmail;
}

function revalidateCertificationPaths() {
  try {
    revalidatePath("/credentials");
    revalidatePath("/about");
    revalidateTag("credentials");
  } catch (error) {
    console.error("Certification revalidation failed:", error);
  }
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
    const auth = await createSupabaseServerClient();
    if (!(await requireAdmin(auth))) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    const db = await createSupabaseAdminClient();
    const requested = Number.parseInt(new URL(request.url).searchParams.get("limit") || "100", 10);
    const limit = Number.isFinite(requested) ? Math.min(Math.max(requested, 1), 200) : 100;
    const { data, error } = await db.from("certifications").select("*").order("display_order").limit(limit);
    if (error) throw error;
    return NextResponse.json({ data });
  } catch (error) {
    return NextResponse.json({ error: error instanceof Error ? error.message : "Request failed" }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const auth = await createSupabaseServerClient();
    if (!(await requireAdmin(auth))) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    const parsed = parseBody(await request.json());
    if ("error" in parsed) return NextResponse.json({ error: parsed.error }, { status: 400 });
    const db = await createSupabaseAdminClient();
    const { data, error } = await db.from("certifications").insert(parsed.data).select().single();
    if (error) throw error;
    revalidateCertificationPaths();
    return NextResponse.json({ data });
  } catch (error) {
    return NextResponse.json({ error: error instanceof Error ? error.message : "Request failed" }, { status: 500 });
  }
}

export async function PUT(request: Request) {
  try {
    const auth = await createSupabaseServerClient();
    if (!(await requireAdmin(auth))) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    const body = await request.json();
    const id = typeof body?.id === "string" ? body.id : "";
    if (!id) return NextResponse.json({ error: "Missing certification ID" }, { status: 400 });
    const parsed = parseBody(body);
    if ("error" in parsed) return NextResponse.json({ error: parsed.error }, { status: 400 });
    const db = await createSupabaseAdminClient();
    const { data, error } = await db.from("certifications").update(parsed.data).eq("id", id).select().single();
    if (error) throw error;
    revalidateCertificationPaths();
    return NextResponse.json({ data });
  } catch (error) {
    return NextResponse.json({ error: error instanceof Error ? error.message : "Request failed" }, { status: 500 });
  }
}

export async function DELETE(request: Request) {
  try {
    const auth = await createSupabaseServerClient();
    if (!(await requireAdmin(auth))) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    const id = new URL(request.url).searchParams.get("id");
    if (!id) return NextResponse.json({ error: "Missing certification ID" }, { status: 400 });
    const db = await createSupabaseAdminClient();
    const { error } = await db.from("certifications").delete().eq("id", id);
    if (error) throw error;
    revalidateCertificationPaths();
    return NextResponse.json({ success: true });
  } catch (error) {
    return NextResponse.json({ error: error instanceof Error ? error.message : "Request failed" }, { status: 500 });
  }
}
