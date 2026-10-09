import { NextResponse } from "next/server";
import { revalidatePath, revalidateTag } from "next/cache";
import { z } from "zod";
import { requireAdmin } from "@/app/lib/admin-auth";
import { createSupabaseAdminClient } from "@/app/lib/supabase/server";

const id = z.string().uuid();
const selectionSchema = z.object({
  ids: z.array(id).max(10000).refine((ids) => new Set(ids).size === ids.length),
  expected: z.array(z.object({ id, updated_at: z.string().datetime({ offset: true }) }).strict()).max(10000),
}).strict();

export async function POST(request: Request) {
  const auth = await requireAdmin();
  if (auth.response) return auth.response;

  let parsed;
  try {
    parsed = selectionSchema.safeParse(await request.json());
  } catch {
    return NextResponse.json({ error: "Invalid featured-project request." }, { status: 400 });
  }
  if (!parsed.success) return NextResponse.json({ error: "Choose distinct published projects and reload the list." }, { status: 400 });

  try {
    const db = await createSupabaseAdminClient();
    const { data, error } = await db.rpc("set_home_featured_projects", {
      p_ids: parsed.data.ids,
      p_expected: parsed.data.expected,
    });
    if (error) {
      if (["PGRST202", "42883"].includes(error.code)) return NextResponse.json({ error: "Featured ordering needs the reviewed database migration." }, { status: 503 });
      if (error.message.includes("FEATURED_PROJECT_CONFLICT")) return NextResponse.json({ error: "Projects changed since this page loaded. Reload before saving the Home selection." }, { status: 409 });
      if (error.message.includes("FEATURED_PROJECT_INVALID")) return NextResponse.json({ error: "Choose only published projects that still exist." }, { status: 400 });
      return NextResponse.json({ error: "Featured projects could not be saved. No changes were confirmed." }, { status: 503 });
    }
    if (data?.featured_count !== parsed.data.ids.length) return NextResponse.json({ error: "Selection could not be confirmed. Refresh the list before retrying." }, { status: 503 });
    try {
      revalidateTag("projects");
      revalidatePath("/");
      revalidatePath("/admin/projects");
    } catch {
      return NextResponse.json({ success: true, warning: "Selection saved, but Home may show the previous order until its cache refreshes." });
    }
    return NextResponse.json({ success: true });
  } catch {
    return NextResponse.json({ error: "Featured projects could not be confirmed. Refresh the list before retrying." }, { status: 503 });
  }
}
