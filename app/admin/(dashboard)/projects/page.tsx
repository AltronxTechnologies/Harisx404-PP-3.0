import { redirect } from "next/navigation";
import { requireAdmin } from "@/app/lib/admin-auth";
import { createSupabaseAdminClient } from "@/app/lib/supabase/server";
import Link from "next/link";
import { Plus, Edit, ChevronLeft, ChevronRight } from "lucide-react";
import { DeleteProjectButton } from "@/app/components/admin/DeleteProjectButton";
import { ProjectListFilters } from "@/app/components/admin/ProjectListFilters";

const PAGE_SIZE = 10;

export default async function AdminProjectsPage({ searchParams }: { searchParams: Promise<Record<string, string | string[] | undefined>> }) {
  const auth = await requireAdmin();
  if (auth.response) redirect(auth.response.status === 401 ? "/admin/login" : "/");
  const params = await searchParams;
  const q = typeof params.q === "string" ? params.q.trim().slice(0, 100) : "";
  const status: "all" | "draft" | "published" | "archived" = typeof params.status === "string" && ["draft", "published", "archived"].includes(params.status) ? params.status as "draft" | "published" | "archived" : "all";
  const page = typeof params.page === "string" && /^[1-9]\d*$/.test(params.page) ? Math.min(Number(params.page), 10000) : 1;
  const pageHref = (target: number) => {
    const values = new URLSearchParams();
    if (q) values.set("q", q);
    if (status !== "all") values.set("status", status);
    if (target > 1) values.set("page", String(target));
    return values.size ? `/admin/projects?${values}` : "/admin/projects";
  };
  const db = await createSupabaseAdminClient();
  const filtered = (head: boolean) => {
    let query = db.from("projects").select("id, title, slug, status, start_date, end_date, updated_at", head ? { count: "exact", head: true } : undefined);
    if (q) query = query.ilike("title", `%${q.replace(/[\\%_]/g, "\\$&")}%`);
    if (status !== "all") query = query.eq("status", status);
    return query;
  };
  const { count, error: countError } = await filtered(true);
  const totalPages = count === null ? 1 : Math.max(1, Math.ceil(count / PAGE_SIZE));
  if (!countError && page > totalPages) redirect(pageHref(totalPages));
  const { data: projects, error: listError } = countError || count === null
    ? { data: null, error: countError }
    : await filtered(false).order("created_at", { ascending: false }).order("id").range((page - 1) * PAGE_SIZE, page * PAGE_SIZE - 1);
  const error = countError || count === null || listError;

  return (
    <div className="flex min-w-0 flex-col gap-6">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Projects</h1>
          <p className="text-sm text-ink-secondary">Manage your portfolio projects.</p>
        </div>
        <Link
          href="/admin/projects/new"
          className="inline-flex min-h-11 items-center justify-center rounded-xl bg-accent-signal px-4 py-2 text-sm font-medium text-white shadow hover:bg-accent-signal/90 transition-all"
        >
          <Plus className="mr-2 h-4 w-4" />
          New Project
        </Link>
      </div>

      <ProjectListFilters key={`${q}:${status}`} q={q} status={status} />
      <div className="overflow-hidden rounded-xl border border-border-hairline bg-surface-raised shadow-sm">
        {!error && <p role="status" className="border-b border-border-hairline px-6 py-3 text-sm text-ink-secondary">{count === 0 ? "Showing 0 projects" : `Showing ${(page - 1) * PAGE_SIZE + 1}-${(page - 1) * PAGE_SIZE + (projects?.length ?? 0)} of ${count} projects`}</p>}
        <div className="overflow-x-auto" role="region" aria-label="Projects table" tabIndex={0}>
          <table className="admin-action-table w-full text-sm text-left">
            <thead className="bg-surface-base border-b border-border-hairline text-ink-secondary">
              <tr>
                  <th scope="col" className="px-6 py-4 font-medium">Title</th>
                  <th scope="col" className="px-6 py-4 font-medium">Status</th>
                  <th scope="col" className="px-6 py-4 font-medium">Timeline</th>
                  <th scope="col" className="px-6 py-4 font-medium text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border-hairline">
              {error ? (
                <tr><td colSpan={4} role="alert" className="px-6 py-8 text-center text-text-secondary">Projects could not be loaded. Reload this page to retry.</td></tr>
              ) : projects?.length === 0 ? (
                <tr>
                  <td colSpan={4} className="px-6 py-8 text-center text-ink-secondary">
                      {q || status !== "all" ? "No projects match these filters. Try another search or status." : "No projects found. Create one to get started!"}
                  </td>
                </tr>
              ) : (
                projects?.map((project) => (
                  <tr key={project.id} className="hover:bg-surface-base/50 transition-colors">
                    <td className="px-6 py-4 font-medium text-ink-primary">
                      {project.title}
                      <div className="text-xs text-ink-secondary font-normal mt-1">{project.slug}</div>
                    </td>
                    <td className="px-6 py-4">
                      <span className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-semibold ${
                         project.status === "published"
                           ? "bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400"
                           : project.status === "archived" ? "bg-surface-base text-ink-secondary" : "bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-400"
                      }`}>
                        {project.status}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-ink-secondary">
                         {project.start_date?.slice(0, 4) || "N/A"}
                      {" - "}
                         {project.end_date?.slice(0, 4) || "Present"}
                    </td>
                    <td className="px-6 py-4 text-right">
                      <div className="flex items-center justify-end gap-2">
                        <Link 
                          href={`/admin/projects/${project.id}`}
                          aria-label={`Edit ${project.title}`}
                          className="inline-flex size-11 items-center justify-center rounded-lg text-ink-secondary transition-colors hover:bg-surface-base hover:text-accent-signal focus-visible:outline focus-visible:outline-2 focus-visible:outline-current"
                        >
                          <Edit className="h-4 w-4" />
                        </Link>
                         <DeleteProjectButton id={project.id} name={project.title} slug={project.slug} updatedAt={project.updated_at} />
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
      {!error && count !== null && totalPages > 1 && <nav aria-label="Projects pages" className="flex items-center justify-between gap-3 text-sm">
        {page > 1 ? <Link href={pageHref(page - 1)} className="inline-flex min-h-11 items-center gap-1 rounded-xl px-3 hover:bg-surface-raised"><ChevronLeft className="size-4" aria-hidden />Previous</Link> : <span className="inline-flex min-h-11 items-center gap-1 px-3 opacity-50"><ChevronLeft className="size-4" aria-hidden />Previous</span>}
        <span>Page {page} of {totalPages}</span>
        {page < totalPages ? <Link href={pageHref(page + 1)} className="inline-flex min-h-11 items-center gap-1 rounded-xl px-3 hover:bg-surface-raised">Next<ChevronRight className="size-4" aria-hidden /></Link> : <span className="inline-flex min-h-11 items-center gap-1 px-3 opacity-50">Next<ChevronRight className="size-4" aria-hidden /></span>}
      </nav>}
    </div>
  );
}
