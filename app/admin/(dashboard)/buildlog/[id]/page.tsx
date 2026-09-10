import { notFound } from "next/navigation";
import { BuildlogForm } from "@/app/components/admin/BuildlogForm";
import { createSupabaseAdminClient } from "@/app/lib/supabase/server";
import type { BuildlogProjectAdmin } from "@/app/buildlog/types";

export default async function EditBuildlogProjectPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const supabase = await createSupabaseAdminClient();
  const { data, error } = await supabase.from("buildlog_projects").select("*").eq("id", id).single();
  if (error?.code === "PGRST116" || !data) notFound();
  if (error) throw new Error(`Unable to load Buildlog project: ${error.message}`);

  const project: BuildlogProjectAdmin = {
    id: data.id,
    name: data.name,
    tagline: data.tagline,
    info: data.info,
    current_version: data.current_version,
    display_order: data.display_order,
    status: data.status,
    is_demo: data.is_demo,
    items: Array.isArray(data.items) ? data.items : [],
  };

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Edit Buildlog project</h1>
        <p className="text-sm text-ink-secondary">Update public project details and release-item order.</p>
      </div>
      <div className="rounded-xl border border-border-hairline bg-surface-raised p-4 shadow-sm sm:p-6">
        <BuildlogForm initialData={project} />
      </div>
    </div>
  );
}
