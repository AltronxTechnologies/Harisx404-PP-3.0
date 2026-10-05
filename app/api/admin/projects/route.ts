import { NextResponse } from "next/server";
import { revalidatePath, revalidateTag } from "next/cache";
import * as z from "zod";
import createSupabaseServerClient, { createSupabaseAdminClient } from "@/app/lib/supabase/server";
import { captionWordCount } from "@/app/lib/project-captions";
import { projectStages } from "@/app/lib/project-stage";
import { isValidBlogDate } from "@/app/lib/blog-defaults";

const idSchema = z.string().uuid();
const optionalText = z.string().max(10000).optional().default("");
const optionalUrl = z.union([z.literal(""), z.string().url().refine((url) => /^https?:\/\//i.test(url))]).optional().default("");
const optionalDate = z.string().refine((value) => !value || isValidBlogDate(value), "Choose a valid calendar date").optional().default("");
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
  project_stage: z.enum(projectStages).optional().default("completed"),
  expected_completion_label: z.string().trim().max(32).optional().default(""),
  source_note: z.string().max(80).optional().default(""),
  case_study_sections: z.object({
    cover_caption: z.string().max(200).refine((caption) => captionWordCount(caption) <= 30, "Use 30 words or fewer").optional().default(""),
    cover_alt: z.string().trim().max(160).optional().default(""),
    why_built: z.string().max(10000).optional().default(""),
    key_decisions: z.string().max(10000).optional().default(""),
    results: z.string().max(10000).optional().default(""),
    lessons_learned: z.string().max(10000).optional().default(""),
  }).strict().optional().default({}),
  tech_stack: z.array(z.string().trim().min(1).max(100)).optional().default([]),
  features: z.array(z.string().trim().min(1).max(500)).max(100).optional().default([]),
  tags: z.array(z.string().trim().min(1).max(100)).optional().default([]),
  related_project_ids: z.array(idSchema).max(2).refine((ids) => new Set(ids).size === ids.length, "Choose two different projects").optional().default([]),
  gallery: z.array(z.object({ mediaId: idSchema, caption: z.string().max(200).refine((value) => captionWordCount(value) <= 30, "Use 30 words or fewer"), altText: z.string().trim().max(160).optional().default("") }).strict()).optional().default([]),
}).strict();
const uniqueGallery = (data: z.infer<typeof projectFieldsSchema>) => new Set(data.gallery.map((image) => image.mediaId)).size === data.gallery.length;
const projectSchema = projectFieldsSchema.refine(uniqueGallery, {
  message: "Gallery images must be unique",
  path: ["gallery"],
});
const updateSchema = projectFieldsSchema.extend({ id: idSchema, updated_at: z.string().datetime({ offset: true }) }).refine(uniqueGallery, {
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

async function referringProjectSlugs(db: Awaited<ReturnType<typeof createSupabaseAdminClient>>, id: string) {
  const { data, error } = await db.from("projects").select("slug").contains("related_project_ids", [id]);
  if (error) {
    console.error("Could not revalidate related project pages:", error);
    return [];
  }
  return data?.map((project) => project.slug) ?? [];
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
    project_stage: data.project_stage,
    expected_completion_label: data.expected_completion_label || null,
    source_note: data.source_note || null,
    case_study_sections: data.case_study_sections,
    tech_stack: data.tech_stack,
    features: data.features,
    related_project_ids: data.related_project_ids,
  };
}

async function validateRelatedProjects(db: Awaited<ReturnType<typeof createSupabaseAdminClient>>, ids: string[], currentId?: string) {
  if (currentId && ids.includes(currentId)) return "A project cannot link to itself";
  if (!ids.length) return null;
  const { data, error } = await db.from("projects").select("id").in("id", ids).eq("status", "published");
  if (error) throw error;
  return data?.length === ids.length ? null : "Choose only published projects that still exist";
}

async function validateGalleryMedia(db: Awaited<ReturnType<typeof createSupabaseAdminClient>>, gallery: z.infer<typeof projectSchema>["gallery"]) {
  if (gallery.length) {
    const { data: media, error: mediaError } = await db.from("media").select("id").in("id", gallery.map((image) => image.mediaId));
    if (mediaError) throw mediaError;
    if (media?.length !== gallery.length) throw new Error("Gallery contains an unknown media ID");
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
  if (["42703", "PGRST204"].includes(error.code || "") && /alt_text/.test(error.message)) {
    return NextResponse.json({ error: "Apply migration 2026_project_gallery_alt.sql before saving project images." }, { status: 503 });
  }
  if (["PGRST202", "42883"].includes(error.code || "")) {
    return NextResponse.json({ error: "Apply migration 2026_project_admin_atomic_save.sql before saving projects." }, { status: 503 });
  }
  if (error.message.includes("PROJECT_CONFLICT")) {
    return NextResponse.json({ error: "This project changed since you opened it. Reload the editor before saving." }, { status: 409 });
  }
  if (error.message.includes("PROJECT_NOT_FOUND")) {
    return NextResponse.json({ error: "Project not found" }, { status: 404 });
  }
  if (["42703", "PGRST204"].includes(error.code || "") && /project_stage|expected_completion_label/.test(error.message)) {
    return NextResponse.json({ error: "Apply migration 2026_project_development_stage.sql before saving project stages." }, { status: 503 });
  }
  if (["42703", "PGRST204"].includes(error.code || "") && /related_project_ids/.test(error.message)) {
    return NextResponse.json({ error: "Apply migration 2026_project_related_selections.sql before saving related projects." }, { status: 503 });
  }
  if (["42703", "PGRST204"].includes(error.code || "") && /latest_update_label|case_study_sections|live_note|source_note/.test(error.message)) {
    return NextResponse.json({ error: "Project editor needs migration 2026_project_case_studies.sql before changes can be saved." }, { status: 503 });
  }
  return NextResponse.json({ error: error.message }, { status: 400 });
}

async function saveProject(db: Awaited<ReturnType<typeof createSupabaseAdminClient>>, data: z.infer<typeof projectSchema>, id?: string, expectedUpdatedAt?: string) {
  const { data: result, error } = await db.rpc("save_project_with_gallery_and_tags", {
    p_project: projectFields(data),
    p_gallery: data.gallery,
    p_tags: data.tags,
    p_id: id ?? null,
    p_expected_updated_at: expectedUpdatedAt ?? null,
  });
  if (error) return { error: projectWriteError(error) };
  if (!result?.project?.id || !result.project.slug) throw new Error("Project save returned no project");
  return { project: result.project, oldSlug: result.old_slug as string | null };
}

export async function POST(request: Request) {
  try {
    const denied = await authorizeAdmin();
    if (denied) return denied;
    const parsed = projectSchema.safeParse(await request.json());
    if (!parsed.success) return NextResponse.json({ error: "Invalid project data", issues: parsed.error.flatten() }, { status: 400 });

    const data = parsed.data;
    if (data.start_date && data.end_date && data.end_date < data.start_date) return NextResponse.json({ error: "End date must be on or after the start date" }, { status: 400 });
    const db = await createSupabaseAdminClient();
    const relatedError = await validateRelatedProjects(db, data.related_project_ids);
    if (relatedError) return NextResponse.json({ error: relatedError }, { status: 400 });
    await validateGalleryMedia(db, data.gallery);
    const saved = await saveProject(db, data);
    if (saved.error) return saved.error;
    revalidateProjectPaths(saved.project.slug);
    return NextResponse.json(saved.project);
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

    const { id, updated_at, ...data } = parsed.data;
    if (data.start_date && data.end_date && data.end_date < data.start_date) return NextResponse.json({ error: "End date must be on or after the start date" }, { status: 400 });
    const db = await createSupabaseAdminClient();
    const relatedError = await validateRelatedProjects(db, data.related_project_ids, id);
    if (relatedError) return NextResponse.json({ error: relatedError }, { status: 400 });
    await validateGalleryMedia(db, data.gallery);
    const saved = await saveProject(db, data, id, updated_at);
    if (saved.error) return saved.error;
    revalidateProjectPaths(saved.oldSlug, saved.project.slug, ...await referringProjectSlugs(db, id));
    return NextResponse.json(saved.project);
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
    const updatedAt = new URL(request.url).searchParams.get("updated_at");
    if (!z.string().datetime({ offset: true }).safeParse(updatedAt).success) return NextResponse.json({ error: "Reload the project list before deleting." }, { status: 400 });

    const db = await createSupabaseAdminClient();
    const { data: deleted, error } = await db.rpc("delete_project_and_unlink_related", { p_id: id, p_expected_updated_at: updatedAt });
    if (error && ["PGRST202", "42883"].includes(error.code)) return NextResponse.json({ error: "Apply migration 2026_project_admin_atomic_delete_with_token.sql before deleting projects." }, { status: 503 });
    if (error) return projectWriteError(error);
    if (!deleted?.slug || !Array.isArray(deleted.referring_slugs)) throw new Error("Project deletion returned no result");
    revalidateProjectPaths(deleted.slug, ...deleted.referring_slugs);
    return NextResponse.json({ success: true });
  } catch (error) {
    return fail(error);
  }
}
