import { NextResponse } from "next/server";
import { revalidatePath, revalidateTag } from "next/cache";
import * as z from "zod";
import createSupabaseServerClient, { createSupabaseAdminClient } from "@/app/lib/supabase/server";
import { syncTags } from "@/app/lib/tag-sync";
import { captionWordCount } from "@/app/lib/project-captions";

const idSchema = z.string().uuid();
const optionalText = z.string().max(10000).optional().default("");
const optionalUrl = z.union([z.literal(""), z.string().url().refine((url) => /^https?:\/\//i.test(url))]).optional().default("");
const optionalDate = z.union([z.literal(""), z.string().regex(/^\d{4}-\d{2}-\d{2}$/)]).optional().default("");
const projectFieldsSchema = z.object({
  title: z.string().trim().min(1).max(200),
  slug: z.string().regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/).max(200),
  description: optionalText,
  content: z.string().max(200000).optional().default(""),
  status: z.enum(["draft", "published", "archived"]),
  cover_image_url: z.string().url().refine((url) => /^https?:\/\//i.test(url), "At least one image is required"),
  cover_image_id: z.union([z.literal(""), idSchema]).optional().default(""),
  live_url: optionalUrl,
  github_url: optionalUrl,
  start_date: optionalDate,
  end_date: optionalDate,
  featured: z.boolean().optional().default(false),
  tagline: z.string().max(160).optional().default(""),
  category: z.string().trim().min(1).max(60),
  year: z.string().max(20).optional().default(""),
  latest_update_label: z.string().max(32).optional().default(""),
  source_note: z.string().max(80).optional().default(""),
  case_study_sections: z.object({
    cover_caption: z.string().max(200).refine((caption) => captionWordCount(caption) <= 30, "Use 30 words or fewer").optional().default(""),
    why_built: z.string().max(10000).optional().default(""),
    key_decisions: z.string().max(10000).optional().default(""),
    results: z.string().max(10000).optional().default(""),
    lessons_learned: z.string().max(10000).optional().default(""),
  }).strict().optional().default({}),
  tech_stack: z.array(z.string().trim().min(1).max(100)).optional().default([]),
  features: z.array(z.string().trim().min(1).max(500)).max(100).optional().default([]),
  tags: z.array(z.string().trim().min(1).max(100)).optional().default([]),
  gallery: z.array(z.object({ mediaId: idSchema, caption: z.string().max(200).refine((value) => captionWordCount(value) <= 30, "Use 30 words or fewer") }).strict()).optional().default([]),
}).strict();
const uniqueGallery = (data: z.infer<typeof projectFieldsSchema>) => new Set(data.gallery.map((image) => image.mediaId)).size === data.gallery.length;
const projectSchema = projectFieldsSchema.refine(uniqueGallery, {
  message: "Gallery images must be unique",
  path: ["gallery"],
});
const updateSchema = projectFieldsSchema.extend({ id: idSchema }).refine(uniqueGallery, {
  message: "Gallery images must be unique",
  path: ["gallery"],
});

async function authorizeAdmin() {
  const auth = await createSupabaseServerClient();
  const { data: { user }, error } = await auth.auth.getUser();
  if (error || !user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const adminEmail = process.env.ADMIN_EMAIL?.trim().toLowerCase();
  if (!adminEmail) {
    console.error("Project admin API is disabled because ADMIN_EMAIL is not configured");
    return NextResponse.json({ error: "Admin access is not configured" }, { status: 500 });
  }
  if (user.email?.trim().toLowerCase() !== adminEmail) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }
  return null;
}

function revalidateProjectPaths(...slugs: Array<string | null | undefined>) {
  try {
    revalidateTag("projects");
    revalidatePath("/");
    revalidatePath("/projects");
    for (const slug of new Set(slugs)) {
      if (slug) revalidatePath(`/projects/${slug}`);
    }
  } catch (error) {
    console.error("Revalidation failed:", error);
  }
}

function projectFields(data: z.infer<typeof projectSchema>) {
  return {
    title: data.title,
    slug: data.slug,
    description: data.description,
    content: data.content,
    status: data.status,
    cover_image_url: data.cover_image_url || null,
    cover_image_id: data.cover_image_id || null,
    live_url: data.live_url || null,
    github_url: data.github_url || null,
    start_date: data.start_date || null,
    end_date: data.end_date || null,
    featured: data.featured,
    tagline: data.tagline || null,
    category: data.category,
    year: data.year || null,
    latest_update_label: data.latest_update_label || null,
    source_note: data.source_note || null,
    case_study_sections: data.case_study_sections,
    tech_stack: data.tech_stack,
    features: data.features,
  };
}

async function validateGalleryMedia(db: Awaited<ReturnType<typeof createSupabaseAdminClient>>, gallery: z.infer<typeof projectSchema>["gallery"]) {
  if (gallery.length) {
    const { data: media, error: mediaError } = await db.from("media").select("id").in("id", gallery.map((image) => image.mediaId));
    if (mediaError) throw mediaError;
    if (media?.length !== gallery.length) throw new Error("Gallery contains an unknown media ID");
  }
}

async function saveGallery(db: Awaited<ReturnType<typeof createSupabaseAdminClient>>, projectId: string, gallery: z.infer<typeof projectSchema>["gallery"]) {
  const { error: deleteError } = await db.from("project_images").delete().eq("project_id", projectId);
  if (deleteError) throw deleteError;
  if (gallery.length) {
    const { error: insertError } = await db.from("project_images").insert(gallery.map((image, index) => ({
      project_id: projectId,
      media_id: image.mediaId,
      caption: image.caption,
      display_order: index,
    })));
    if (insertError) throw insertError;
  }
}

function fail(error: unknown) {
  if (error instanceof SyntaxError) return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 });
  if (error instanceof Error && error.message === "Gallery contains an unknown media ID") {
    return NextResponse.json({ error: error.message }, { status: 400 });
  }
  console.error("Project admin request failed:", error);
  return NextResponse.json({ error: error instanceof Error ? error.message : "Project request failed" }, { status: 500 });
}

function projectWriteError(error: { message: string; code?: string }) {
  if (["42703", "PGRST204"].includes(error.code || "") && /latest_update_label|case_study_sections|live_note|source_note/.test(error.message)) {
    return NextResponse.json({ error: "Project editor needs migration 2026_project_case_studies.sql before changes can be saved." }, { status: 503 });
  }
  return NextResponse.json({ error: error.message }, { status: 400 });
}

export async function POST(request: Request) {
  try {
    const denied = await authorizeAdmin();
    if (denied) return denied;
    const parsed = projectSchema.safeParse(await request.json());
    if (!parsed.success) return NextResponse.json({ error: "Invalid project data", issues: parsed.error.flatten() }, { status: 400 });

    const data = parsed.data;
    const db = await createSupabaseAdminClient();
    await validateGalleryMedia(db, data.gallery);
    const { data: project, error } = await db.from("projects").insert(projectFields(data)).select().single();
    if (error) return projectWriteError(error);

    try {
      await saveGallery(db, project.id, data.gallery);
      await syncTags({ joinTable: "project_tags", entityColumn: "project_id", entityId: project.id, tags: data.tags });
    } finally {
      revalidateProjectPaths(project.slug);
    }
    return NextResponse.json(project);
  } catch (error) {
    return fail(error);
  }
}

export async function PUT(request: Request) {
  try {
    const denied = await authorizeAdmin();
    if (denied) return denied;
    const parsed = updateSchema.safeParse(await request.json());
    if (!parsed.success) return NextResponse.json({ error: "Invalid project data", issues: parsed.error.flatten() }, { status: 400 });

    const { id, ...data } = parsed.data;
    const db = await createSupabaseAdminClient();
    await validateGalleryMedia(db, data.gallery);
    const { data: previous, error: lookupError } = await db.from("projects").select("slug").eq("id", id).maybeSingle();
    if (lookupError) throw lookupError;
    if (!previous) return NextResponse.json({ error: "Project not found" }, { status: 404 });

    const { data: project, error } = await db.from("projects")
      .update({ ...projectFields(data), updated_at: new Date().toISOString() })
      .eq("id", id).select().maybeSingle();
    if (error) return projectWriteError(error);
    if (!project) return NextResponse.json({ error: "Project not found" }, { status: 404 });

    try {
      await saveGallery(db, id, data.gallery);
      await syncTags({ joinTable: "project_tags", entityColumn: "project_id", entityId: id, tags: data.tags });
    } finally {
      revalidateProjectPaths(previous.slug, project.slug);
    }
    return NextResponse.json(project);
  } catch (error) {
    return fail(error);
  }
}

export async function DELETE(request: Request) {
  try {
    const denied = await authorizeAdmin();
    if (denied) return denied;
    const id = new URL(request.url).searchParams.get("id");
    if (!idSchema.safeParse(id).success) return NextResponse.json({ error: "Invalid project ID" }, { status: 400 });

    const db = await createSupabaseAdminClient();
    const { data: project, error } = await db.from("projects").delete().eq("id", id!).select("slug").maybeSingle();
    if (error) return NextResponse.json({ error: error.message }, { status: 400 });
    if (!project) return NextResponse.json({ error: "Project not found" }, { status: 404 });
    revalidateProjectPaths(project.slug);
    return NextResponse.json({ success: true });
  } catch (error) {
    return fail(error);
  }
}
