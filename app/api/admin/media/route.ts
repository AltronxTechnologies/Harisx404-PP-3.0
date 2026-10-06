import { NextResponse } from "next/server";
import { z } from "zod";
import { requireAdmin } from "@/app/lib/admin-auth";
import { deleteManagedMedia } from "@/app/lib/admin/delete-media";
import { createSupabaseAdminClient } from "@/app/lib/supabase/server";

export async function GET(request: Request) {
  try {
    const auth = await requireAdmin();
    if (auth.response) return auth.response;
    const supabase = await createSupabaseAdminClient();

    const { searchParams } = new URL(request.url);
    const requestedLimit = Number(searchParams.get("limit") ?? 50);
    const requestedOffset = Number(searchParams.get("offset") ?? 0);
    if (!Number.isSafeInteger(requestedLimit) || requestedLimit < 1 || !Number.isSafeInteger(requestedOffset) || requestedOffset < 0 || requestedOffset > 120000) {
      return NextResponse.json({ error: "Invalid pagination" }, { status: 400 });
    }
    const limit = Math.min(requestedLimit, 100);
    const offset = requestedOffset;

    const { data, error, count } = await supabase
      .from("media")
      .select("*", { count: "exact" })
      .order("created_at", { ascending: false })
      .order("id", { ascending: false })
      .range(offset, offset + limit - 1);

    if (error) {
      return NextResponse.json({ error: "Media could not be loaded. Retry before managing files." }, { status: 503 });
    }

    return NextResponse.json({ data, count }, { headers: { "Cache-Control": "private, no-store" } });
  } catch {
    return NextResponse.json({ error: "Media could not be loaded. Retry before managing files." }, { status: 503 });
  }
}

export async function PATCH(request: Request) {
  const auth = await requireAdmin();
  if (auth.response) return auth.response;
  const parsed = z.object({ id: z.string().uuid(), alt_text: z.string().trim().min(1).max(160) }).strict().safeParse(await request.json().catch(() => null));
  if (!parsed.success) return NextResponse.json({ error: "Enter an image description of 1 to 160 characters." }, { status: 400 });
  const db = await createSupabaseAdminClient();
  const { data, error } = await db.from("media").update({ alt_text: parsed.data.alt_text }).eq("id", parsed.data.id).select("id, alt_text").maybeSingle();
  if (error) return NextResponse.json({ error: "Image description could not be updated." }, { status: 500 });
  if (!data) return NextResponse.json({ error: "Image not found." }, { status: 404 });
  return NextResponse.json({ data });
}

export async function DELETE(request: Request) {
  const auth = await requireAdmin();
  if (auth.response) return auth.response;

  const params = new URL(request.url).searchParams;
  const id = params.get("id");
  const detachPostId = params.get("detach_blog_post_id");
  if (!z.string().uuid().safeParse(id).success) {
    return NextResponse.json({ error: "Invalid image ID" }, { status: 400 });
  }
  if (detachPostId !== null && !z.string().uuid().safeParse(detachPostId).success) {
    return NextResponse.json({ error: "Invalid Blog post ID" }, { status: 400 });
  }

  try {
    const result = await deleteManagedMedia(await createSupabaseAdminClient(), id!, detachPostId);
    return result.kind === "deleted"
      ? NextResponse.json({ success: true })
      : NextResponse.json({ error: result.error }, { status: result.status });
  } catch {
    return NextResponse.json({ error: "Image could not be deleted. No Cloudinary deletion was attempted." }, { status: 500 });
  }
}
