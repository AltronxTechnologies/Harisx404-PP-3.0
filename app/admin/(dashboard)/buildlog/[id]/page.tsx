import { notFound } from "next/navigation";
import { BuildlogForm } from "@/app/components/admin/BuildlogForm";
import { createSupabaseAdminClient } from "@/app/lib/supabase/server";
import type { BuildlogProjectAdmin } from "@/app/buildlog/types";
import Link from "next/link";
import { z } from "zod";

export default async function EditBuildlogProjectPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  if (!z.string().uuid().safeParse(id).success) notFound();
  const supabase = await createSupabaseAdminClient();
  const { data, error } = await supabase.from("buildlog_projects").select("*").eq("id", id).maybeSingle();
  if (error) return <div role="alert" className="rounded-xl border border-red-500/30 bg-red-950/30 p-5 text-sm text-red-300">Buildlog project could not be loaded. No changes were made. <Link prefetch={false} href={`/admin/buildlog/${id}?retry=${Date.now()}`} className="font-medium underline underline-offset-2">Retry</Link>.</div>;
  if (!data) notFound();

  const project: BuildlogProjectAdmin & { updated_at: string } = {
    id: data.id,
    updated_at: data.updated_at,
    name: data.name,
    tagline: data.tagline,
    info: data.info,
    current_version: data.current_version,
    github_url: data.github_url || null,
    live_url: data.live_url || null,
    project_status:
      data.project_status === "live" || data.project_status === "completed"
        ? data.project_status
        : "in_progress",
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
