import { ProjectForm } from "@/app/components/admin/ProjectForm";
import { createSupabaseAdminClient } from "@/app/lib/supabase/server";
import { notFound } from "next/navigation";
import { z } from "zod";
import Link from "next/link";

export default async function EditProjectPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  if (!z.string().uuid().safeParse(id).success) notFound();
  const supabase = await createSupabaseAdminClient();
  const loadProject = (withAlt: boolean) => supabase.from("projects")
      .select(withAlt
        ? "*, project_tags ( tags ( name ) ), project_images ( media_id, caption, alt_text, display_order, media ( secure_url, url, alt_text, original_filename ) )"
        : "*, project_tags ( tags ( name ) ), project_images ( media_id, caption, display_order, media ( secure_url, url, alt_text ) )")
      .eq("id", id)
      .maybeSingle();
  let [{ data: project, error }, { data: availableProjects, error: optionsError }] = await Promise.all([
    loadProject(true),
    supabase.from("projects").select("id, title, slug, status").order("title"),
  ]);
  if (error && ["42703", "PGRST200", "PGRST204"].includes(error.code) && /alt_text|original_filename/.test(error.message)) {
    ({ data: project, error } = await loadProject(false));
  }

  if (error || optionsError) return <div role="alert" className="rounded-xl border border-red-500/30 bg-red-950/30 p-5 text-sm text-red-300">Project editor could not be loaded. No changes were made. <Link prefetch={false} href={`/admin/projects/${id}?retry=${Date.now()}`} className="font-medium underline underline-offset-2">Retry</Link> or return to <Link href="/admin/projects" className="font-medium underline underline-offset-2">Projects</Link>.</div>;
  if (!project) notFound();

  // Flatten the join rows into a simple string[] for the form.
  const tags: string[] =
    project.project_tags
      ?.map((pt: any) => pt.tags?.name)
      .filter(Boolean) ?? [];
  const galleryImages = (project.project_images ?? [])
    .slice()
    .sort((a: any, b: any) => (a.display_order ?? 0) - (b.display_order ?? 0))
    .map((image: any) => ({
      mediaId: image.media_id,
      url: image.media?.secure_url || image.media?.url || "",
      caption: image.caption ?? "",
       altText: image.alt_text ?? "",
       fileName: image.media?.original_filename || image.media?.alt_text || "",
    }));
  const { project_tags: _ignored, project_images: _ignoredImages, ...projectFields } = project;

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Edit Project</h1>
        <p className="text-sm text-ink-secondary">Update your project details.</p>
      </div>
      
      <div className="rounded-xl border border-border-hairline bg-surface-raised p-6 shadow-sm">
        <ProjectForm initialData={{ ...projectFields, tags, galleryImages }} availableProjects={availableProjects ?? []} />
      </div>
    </div>
  );
}
