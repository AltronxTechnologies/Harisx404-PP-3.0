import { revalidatePath, revalidateTag } from "next/cache";
import { NextResponse } from "next/server";
import * as z from "zod";
import createSupabaseServerClient, {
  createSupabaseAdminClient,
} from "@/app/lib/supabase/server";

const settingsSchema = z.object({
  kicker: z.string().trim().min(2).max(80),
  heading: z.string().trim().min(2).max(100),
  heading_accent: z.string().trim().min(1).max(60),
  description: z.string().trim().min(10).max(300),
  archive_label: z.string().trim().min(2).max(60),
  seo_title: z.string().trim().min(2).max(100),
  seo_description: z.string().trim().min(10).max(300),
}).strict();

async function requireAdmin(
  supabase: Awaited<ReturnType<typeof createSupabaseServerClient>>,
) {
  const { data: { user } } = await supabase.auth.getUser();
  const adminEmail = process.env.ADMIN_EMAIL?.trim().toLowerCase();
  return Boolean(user && adminEmail && user.email?.trim().toLowerCase() === adminEmail);
}

function fail(error: unknown) {
  console.error("Buildlog settings request failed", error);
  return NextResponse.json(
    { error: "The Buildlog settings request could not be completed." },
    { status: 500 },
  );
}

export async function GET() {
  try {
    const auth = await createSupabaseServerClient();
    if (!(await requireAdmin(auth))) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    const db = await createSupabaseAdminClient();
    const { data, error } = await db
      .from("buildlog_settings")
      .select("kicker, heading, heading_accent, description, archive_label, seo_title, seo_description")
      .eq("id", true)
      .single();
    if (error) throw error;
    return NextResponse.json({ data });
  } catch (error) {
    return fail(error);
  }
}

export async function PUT(request: Request) {
  try {
    const auth = await createSupabaseServerClient();
    if (!(await requireAdmin(auth))) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    let body: unknown;
    try {
      body = await request.json();
    } catch {
      return NextResponse.json({ error: "Invalid JSON body." }, { status: 400 });
    }
    const parsed = settingsSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        { error: parsed.error.issues[0]?.message || "Invalid Buildlog settings." },
        { status: 400 },
      );
    }
    const db = await createSupabaseAdminClient();
    const { data, error } = await db
      .from("buildlog_settings")
      .upsert({ id: true, ...parsed.data }, { onConflict: "id" })
      .select()
      .single();
    if (error) throw error;
    revalidatePath("/buildlog");
    revalidateTag("buildlog");
    return NextResponse.json({ data });
  } catch (error) {
    return fail(error);
  }
}
