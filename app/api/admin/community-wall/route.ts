import { revalidatePath, revalidateTag } from "next/cache";
import { NextResponse } from "next/server";
import * as z from "zod";
import createSupabaseServerClient, {
  createSupabaseAdminClient,
} from "@/app/lib/supabase/server";

const idSchema = z.string().uuid();
const revisionSchema = z.string().datetime({ offset: true });
const updateSchema = z.object({
  id: idSchema,
  status: z.enum(["pending", "published", "archived"]),
  updated_at: revisionSchema,
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
    const rawLimit = url.searchParams.get("limit") || "100";
    if (!/^\d{1,3}$/.test(rawLimit) || Number(rawLimit) < 1 || Number(rawLimit) > 200) {
      return NextResponse.json({ error: "Invalid page size." }, { status: 400 });
    }
    const limit = Number(rawLimit);
    const rawPage = url.searchParams.get("page") || "1";
    if (!/^[1-9]\d{0,3}$/.test(rawPage)) return NextResponse.json({ error: "Invalid page." }, { status: 400 });
    const page = Number(rawPage);
    const status = url.searchParams.get("status");
    if (status && !["pending", "published", "archived"].includes(status)) {
      return NextResponse.json({ error: "Invalid status." }, { status: 400 });
    }
    const db = await createSupabaseAdminClient();
    let query = db
      .from("messages")
      .select("id, message, patternindex, user_id, creator_name, creator_avatar_url, status, moderated_at, created_at, updated_at", { count: "exact" })
      .order("created_at", { ascending: false }).order("id", { ascending: false })
      .range((page - 1) * limit, page * limit - 1);
    if (status) query = query.eq("status", status);
    const { data, count, error } = await query;
    if (error) throw error;
    return NextResponse.json({ data, count: count ?? 0, page, limit }, { headers: { "Cache-Control": "private, no-store" } });
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
      .eq("updated_at", parsed.data.updated_at)
      .select("id, status")
      .maybeSingle();
    if (error) throw error;
    if (!data) return NextResponse.json({ error: "This note changed or was removed. Refresh the page before moderating it." }, { status: 409 });
    try {
      revalidateCommunityWall();
      return NextResponse.json({ data });
    } catch {
      return NextResponse.json({ data, warning: "The note was updated, but public cache refresh could not be confirmed." });
    }
  } catch (error) {
    return fail(error);
  }
}

export async function DELETE(request: Request) {
  try {
    if (!(await requireAdmin())) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    const params = new URL(request.url).searchParams;
    const id = params.get("id") || "";
    const updatedAt = params.get("updated_at") || "";
    if (!idSchema.safeParse(id).success || !revisionSchema.safeParse(updatedAt).success) {
      return NextResponse.json({ error: "Invalid Community Wall note ID or revision." }, { status: 400 });
    }
    const db = await createSupabaseAdminClient();
    const { data, error } = await db.from("messages").delete().eq("id", id).eq("updated_at", updatedAt).select("id").maybeSingle();
    if (error) throw error;
    if (!data) return NextResponse.json({ error: "This note changed or was removed. Refresh the page before deleting it." }, { status: 409 });
    try {
      revalidateCommunityWall();
      return NextResponse.json({ success: true });
    } catch {
      return NextResponse.json({ success: true, warning: "The note was deleted, but public cache refresh could not be confirmed." });
    }
  } catch (error) {
    return fail(error);
  }
}
