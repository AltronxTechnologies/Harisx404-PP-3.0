import { randomUUID } from "node:crypto";
import { revalidatePath, revalidateTag } from "next/cache";
import { NextResponse } from "next/server";
import * as z from "zod";
import createSupabaseServerClient, {
  createSupabaseAdminClient,
} from "@/app/lib/supabase/server";

const itemSchema = z.object({
  id: z.union([z.string().uuid(), z.literal("")]).optional(),
  title: z.string().trim().min(2).max(160),
  description: z.string().trim().max(400).nullable().optional(),
  badge: z.string().trim().min(1).max(40),
  done: z.boolean(),
  display_order: z.number().int().min(0).max(10000),
}).strict();

const projectSchema = z.object({
  name: z.string().trim().min(2).max(100),
  tagline: z.string().trim().min(2).max(120),
  info: z.string().trim().min(10).max(360),
  current_version: z.string().trim().min(1).max(40),
  display_order: z.number().int().min(0).max(10000),
  status: z.enum(["draft", "published", "archived"]),
  is_demo: z.boolean().default(false),
  items: z.array(itemSchema).min(1).max(50),
}).strict();

async function requireAdmin(
  supabase: Awaited<ReturnType<typeof createSupabaseServerClient>>,
) {
  const { data: { user } } = await supabase.auth.getUser();
  const adminEmail = process.env.ADMIN_EMAIL?.trim().toLowerCase();
  return Boolean(user && adminEmail && user.email?.trim().toLowerCase() === adminEmail);
}

function parseProject(value: unknown) {
  const parsed = projectSchema.safeParse(value);
  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message || "Invalid Buildlog data." } as const;
  }
  return {
    data: {
      ...parsed.data,
      items: parsed.data.items.map((item) => ({
        ...item,
        id: item.id || randomUUID(),
        description: item.description || null,
      })),
    },
  } as const;
}

function revalidateBuildlog() {
  revalidatePath("/buildlog");
  revalidateTag("buildlog");
}

function serverError(error: unknown) {
  console.error("Buildlog admin request failed", error);
  return NextResponse.json({ error: "The Buildlog request could not be completed." }, { status: 500 });
}

export async function GET(request: Request) {
  try {
    const auth = await createSupabaseServerClient();
    if (!(await requireAdmin(auth))) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    const requested = Number.parseInt(new URL(request.url).searchParams.get("limit") || "100", 10);
    const limit = Number.isFinite(requested) ? Math.min(Math.max(requested, 1), 200) : 100;
    const db = await createSupabaseAdminClient();
    const { data, error } = await db
      .from("buildlog_projects")
      .select("id, name, tagline, info, current_version, display_order, status, is_demo, items")
      .order("display_order", { ascending: true })
      .limit(limit);
    if (error) throw error;
    return NextResponse.json({ data });
  } catch (error) {
    return serverError(error);
  }
}

export async function POST(request: Request) {
  try {
    const auth = await createSupabaseServerClient();
    if (!(await requireAdmin(auth))) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    const parsed = parseProject(await request.json());
    if ("error" in parsed) return NextResponse.json({ error: parsed.error }, { status: 400 });
    const db = await createSupabaseAdminClient();
    const { data, error } = await db.from("buildlog_projects").insert(parsed.data).select().single();
    if (error) throw error;
    revalidateBuildlog();
    return NextResponse.json({ data });
  } catch (error) {
    return serverError(error);
  }
}

export async function PUT(request: Request) {
  try {
    const auth = await createSupabaseServerClient();
    if (!(await requireAdmin(auth))) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    const body: unknown = await request.json();
    const id = typeof body === "object" && body && "id" in body ? String(body.id) : "";
    if (!z.string().uuid().safeParse(id).success) {
      return NextResponse.json({ error: "Invalid Buildlog project ID." }, { status: 400 });
    }
    const data = typeof body === "object" && body ? { ...body } as Record<string, unknown> : {};
    delete data.id;
    const parsed = parseProject(data);
    if ("error" in parsed) return NextResponse.json({ error: parsed.error }, { status: 400 });
    const db = await createSupabaseAdminClient();
    const { data: updated, error } = await db
      .from("buildlog_projects")
      .update(parsed.data)
      .eq("id", id)
      .select()
      .single();
    if (error) throw error;
    revalidateBuildlog();
    return NextResponse.json({ data: updated });
  } catch (error) {
    return serverError(error);
  }
}

export async function DELETE(request: Request) {
  try {
    const auth = await createSupabaseServerClient();
    if (!(await requireAdmin(auth))) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    const id = new URL(request.url).searchParams.get("id") || "";
    if (!z.string().uuid().safeParse(id).success) {
      return NextResponse.json({ error: "Invalid Buildlog project ID." }, { status: 400 });
    }
    const db = await createSupabaseAdminClient();
    const { error } = await db.from("buildlog_projects").delete().eq("id", id);
    if (error) throw error;
    revalidateBuildlog();
    return NextResponse.json({ success: true });
  } catch (error) {
    return serverError(error);
  }
}
