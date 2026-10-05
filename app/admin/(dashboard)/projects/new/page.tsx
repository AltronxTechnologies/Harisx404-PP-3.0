import { ProjectForm } from "@/app/components/admin/ProjectForm";
import { createSupabaseAdminClient } from "@/app/lib/supabase/server";
import Link from "next/link";

export default async function NewProjectPage() {
  const db = await createSupabaseAdminClient();
  const { data: availableProjects, error } = await db.from("projects").select("id, title, slug, status").order("title");
  if (error) return <div role="alert" className="rounded-xl border border-red-500/30 bg-red-950/30 p-5 text-sm text-red-300">Project editor could not be loaded. No changes were made. <Link prefetch={false} href={`/admin/projects/new?retry=${Date.now()}`} className="font-medium underline underline-offset-2">Retry</Link> or return to <Link href="/admin/projects" className="font-medium underline underline-offset-2">Projects</Link>.</div>;
  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Create New Project</h1>
        <p className="text-sm text-ink-secondary">Add a new project to your portfolio.</p>
      </div>
      
      <div className="rounded-xl border border-border-hairline bg-surface-raised p-6 shadow-sm">
        <ProjectForm availableProjects={availableProjects ?? []} />
      </div>
    </div>
  );
}
