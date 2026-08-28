import { ProjectForm } from "@/app/components/admin/ProjectForm";
import createSupabaseServerClient from "@/app/lib/supabase/server";
import { notFound } from "next/navigation";

export default async function EditProjectPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const supabase = await createSupabaseServerClient();
  const { data: project, error } = await supabase
    .from("projects")
    .select("*, project_tags ( tags ( name ) )")
    .eq("id", id)
    .single();

  if (error || !project) {
    notFound();
  }

  // Flatten the join rows into a simple string[] for the form.
  const tags: string[] =
    project.project_tags
      ?.map((pt: any) => pt.tags?.name)
      .filter(Boolean) ?? [];
  const { project_tags: _ignored, ...projectFields } = project;

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Edit Project</h1>
        <p className="text-sm text-ink-secondary">Update your project details.</p>
      </div>
      
      <div className="rounded-xl border border-border-hairline bg-surface-raised p-6 shadow-sm">
        <ProjectForm initialData={{ ...projectFields, tags }} />
      </div>
    </div>
  );
}
