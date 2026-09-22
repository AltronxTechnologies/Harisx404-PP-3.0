import { revalidatePath, revalidateTag } from "next/cache";
import { NextResponse } from "next/server";
import * as z from "zod";
import createSupabaseServerClient, {
  createSupabaseAdminClient,
} from "@/app/lib/supabase/server";

const idSchema = z.string().uuid();
const updateSchema = z.object({
  id: idSchema,
  status: z.enum(["pending", "published", "archived"]),
}).strict();

async function requireAdmin() {
  const auth = await createSupabaseServerClient();
  const { data: { user } } = await auth.auth.getUser();
  const adminEmail = process.env.ADMIN_EMAIL?.trim().toLowerCase();
  return Boolean(user && adminEmail && user.email?.trim().toLowerCase() === adminEmail);
}

function fail(error: unknown) {
  console.error("Community Wall admin request failed", error);
  return NextResponse.json(
    { error: "The Community Wall request could not be completed." },
    { status: 500 },
  );
}

function revalidateCommunityWall() {
  revalidatePath("/community-wall");
  revalidatePath("/admin/community-wall");
  revalidateTag("server-stats");
}

export async function GET(request: Request) {
  try {
    if (!(await requireAdmin())) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    const url = new URL(request.url);
    const parsedLimit = Number.parseInt(url.searchParams.get("limit") || "100", 10);
    const limit = Number.isFinite(parsedLimit) ? Math.min(Math.max(parsedLimit, 1), 200) : 100;
    const rawPage = url.searchParams.get("page") || "1";
    const page = /^\d{1,4}$/.test(rawPage) ? Math.max(Number(rawPage), 1) : 1;
    const status = url.searchParams.get("status");
    if (status && !["pending", "published", "archived"].includes(status)) {
      return NextResponse.json({ error: "Invalid status." }, { status: 400 });
    }
    const db = await createSupabaseAdminClient();
    let query = db
      .from("messages")
      .select("id, message, patternindex, user_id, creator_name, creator_avatar_url, status, moderated_at, created_at, updated_at", { count: "exact" })
      .order("created_at", { ascending: false })
      .range((page - 1) * limit, page * limit - 1);
    if (status) query = query.eq("status", status);
    const { data, count, error } = await query;
    if (error) throw error;
    return NextResponse.json({ data, count: count ?? 0, page, limit });
  } catch (error) {
    return fail(error);
  }
}

export async function PATCH(request: Request) {
  try {
    if (!(await requireAdmin())) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    let body: unknown;
    try {
      body = await request.json();
    } catch {
      return NextResponse.json({ error: "Invalid JSON body." }, { status: 400 });
    }
    const parsed = updateSchema.safeParse(body);
    if (!parsed.success) return NextResponse.json({ error: "Invalid moderation request." }, { status: 400 });
    const db = await createSupabaseAdminClient();
    const { data, error } = await db
      .from("messages")
      .update({
        status: parsed.data.status,
        moderated_at: parsed.data.status === "pending" ? null : new Date().toISOString(),
      })
      .eq("id", parsed.data.id)
      .select("id, status")
      .maybeSingle();
    if (error) throw error;
    if (!data) return NextResponse.json({ error: "Community Wall note not found." }, { status: 404 });
    revalidateCommunityWall();
    return NextResponse.json({ data });
  } catch (error) {
    return fail(error);
  }
}

export async function DELETE(request: Request) {
  try {
    if (!(await requireAdmin())) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    const id = new URL(request.url).searchParams.get("id") || "";
    if (!idSchema.safeParse(id).success) {
      return NextResponse.json({ error: "Invalid Community Wall note ID." }, { status: 400 });
    }
    const db = await createSupabaseAdminClient();
    const { data, error } = await db.from("messages").delete().eq("id", id).select("id").maybeSingle();
    if (error) throw error;
    if (!data) return NextResponse.json({ error: "Community Wall note not found." }, { status: 404 });
    revalidateCommunityWall();
    return NextResponse.json({ success: true });
  } catch (error) {
    return fail(error);
  }
}
