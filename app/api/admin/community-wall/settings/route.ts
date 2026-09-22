import { revalidatePath } from "next/cache";
import { NextResponse } from "next/server";
import * as z from "zod";
import createSupabaseServerClient, { createSupabaseAdminClient } from "@/app/lib/supabase/server";

const schema = z.object({
  kicker: z.string().trim().min(2).max(80),
  heading: z.string().trim().min(2).max(100),
  heading_accent: z.string().trim().min(1).max(60),
  description: z.string().trim().min(10).max(300),
  collection_label: z.string().trim().min(2).max(60),
  sign_in_title: z.string().trim().min(2).max(100),
  sign_in_description: z.string().trim().min(5).max(200),
  composer_title: z.string().trim().min(2).max(100),
  composer_description: z.string().trim().min(5).max(200),
  empty_title: z.string().trim().min(2).max(100),
  empty_description: z.string().trim().min(5).max(240),
  seo_title: z.string().trim().min(2).max(100),
  seo_description: z.string().trim().min(10).max(300),
}).strict();

async function authorized() {
  const auth = await createSupabaseServerClient();
  const { data: { user } } = await auth.auth.getUser();
  const email = process.env.ADMIN_EMAIL?.trim().toLowerCase();
  return Boolean(user && email && user.email?.trim().toLowerCase() === email);
}

export async function GET() {
  try {
    if (!(await authorized())) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    const db = await createSupabaseAdminClient();
    const { data, error } = await db.from("community_wall_settings").select("*").eq("id", true).single();
    if (error) throw error;
    return NextResponse.json({ data });
  } catch (error) {
    console.error("Community Wall settings read failed", error);
    return NextResponse.json({ error: "Community Wall settings could not be loaded." }, { status: 500 });
  }
}

export async function PUT(request: Request) {
  try {
    if (!(await authorized())) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    let body: unknown;
    try {
      body = await request.json();
    } catch {
      return NextResponse.json({ error: "Invalid JSON body." }, { status: 400 });
    }
    const parsed = schema.safeParse(body);
    if (!parsed.success) return NextResponse.json({ error: parsed.error.issues[0]?.message || "Invalid settings." }, { status: 400 });
    const db = await createSupabaseAdminClient();
    const { data, error } = await db.from("community_wall_settings").upsert({ id: true, ...parsed.data }, { onConflict: "id" }).select().single();
    if (error) throw error;
    revalidatePath("/community-wall");
    revalidatePath("/admin/community-wall");
    return NextResponse.json({ data });
  } catch (error) {
    console.error("Community Wall settings update failed", error);
    return NextResponse.json({ error: "Community Wall settings could not be saved." }, { status: 500 });
  }
}
