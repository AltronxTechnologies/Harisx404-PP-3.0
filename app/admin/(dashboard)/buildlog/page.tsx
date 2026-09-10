import Link from "next/link";
import { Edit, Plus } from "lucide-react";
import { createSupabaseAdminClient } from "@/app/lib/supabase/server";
import { DeleteBuildlogButton } from "@/app/components/admin/DeleteBuildlogButton";

export default async function AdminBuildlogPage() {
  const supabase = await createSupabaseAdminClient();
  const { data: projects, error } = await supabase
    .from("buildlog_projects")
    .select("id, name, current_version, status, display_order, is_demo, items")
    .order("display_order", { ascending: true });
  if (error) throw new Error(`Unable to load Buildlog projects: ${error.message}`);

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Buildlog</h1>
          <p className="text-sm text-ink-secondary">Manage projects and release items shown on the public Buildlog.</p>
        </div>
        <Link href="/admin/buildlog/new" className="inline-flex items-center justify-center rounded-xl bg-accent-signal px-4 py-2 text-sm font-medium text-white shadow transition-opacity hover:opacity-90">
          <Plus className="mr-2 size-4" /> New project
        </Link>
      </div>

      <div className="overflow-hidden rounded-xl border border-border-hairline bg-surface-raised shadow-sm">
        <div className="overflow-x-auto">
          <table className="w-full min-w-[680px] text-left text-sm">
            <thead className="border-b border-border-hairline bg-surface-base text-ink-secondary">
              <tr>
                <th className="px-6 py-4 font-medium">Project</th>
                <th className="px-6 py-4 font-medium">Items</th>
                <th className="px-6 py-4 font-medium">Status</th>
                <th className="px-6 py-4 font-medium">Order</th>
                <th className="px-6 py-4 text-right font-medium">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border-hairline">
              {!projects || projects.length === 0 ? (
                <tr><td colSpan={5} className="px-6 py-10 text-center text-ink-secondary">No Buildlog projects found. Create one to publish your first release record.</td></tr>
              ) : projects.map((project) => (
                <tr key={project.id} className="transition-colors hover:bg-surface-base/50">
                  <td className="px-6 py-4 font-medium text-ink-primary">
                    {project.name}
                    <div className="mt-1 text-xs font-normal text-ink-secondary">{project.current_version}</div>
                    {project.is_demo && <span className="mt-1 inline-flex rounded-full bg-amber-100 px-2 py-0.5 text-[10px] font-medium text-amber-800 dark:bg-amber-900/30 dark:text-amber-300">Demo</span>}
                  </td>
                  <td className="px-6 py-4 text-ink-secondary">{Array.isArray(project.items) ? project.items.length : 0}</td>
                  <td className="px-6 py-4"><span className={`inline-flex rounded-full px-2.5 py-0.5 text-xs font-semibold ${project.status === "published" ? "bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400" : "bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-400"}`}>{project.status}</span></td>
                  <td className="px-6 py-4 text-ink-secondary">{project.display_order}</td>
                  <td className="px-6 py-4 text-right">
                    <div className="flex items-start justify-end gap-2">
                      <Link href={`/admin/buildlog/${project.id}`} aria-label={`Edit ${project.name}`} className="rounded-lg p-2 text-ink-secondary transition-colors hover:bg-surface-base hover:text-accent-signal"><Edit className="size-4" /></Link>
                      <DeleteBuildlogButton id={project.id} name={project.name} />
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
