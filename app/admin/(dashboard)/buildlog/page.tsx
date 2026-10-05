import Link from "next/link";
import { Edit, Plus, Settings, ChevronLeft, ChevronRight } from "lucide-react";
import { redirect } from "next/navigation";
import { createSupabaseAdminClient } from "@/app/lib/supabase/server";
import { DeleteBuildlogButton } from "@/app/components/admin/DeleteBuildlogButton";

const PAGE_SIZE = 10;

export default async function AdminBuildlogPage({ searchParams }: { searchParams: Promise<Record<string, string | string[] | undefined>> }) {
  const params = await searchParams;
  const q = typeof params.q === "string" ? params.q.trim().slice(0, 100) : "";
  const status = typeof params.status === "string" && ["draft", "published", "archived"].includes(params.status) ? params.status : "all";
  const page = typeof params.page === "string" && /^[1-9]\d*$/.test(params.page) ? Math.min(Number(params.page), 10000) : 1;
  const pageHref = (target: number) => {
    const query = new URLSearchParams();
    if (q) query.set("q", q);
    if (status !== "all") query.set("status", status);
    if (target > 1) query.set("page", String(target));
    return query.size ? `/admin/buildlog?${query}` : "/admin/buildlog";
  };
  const supabase = await createSupabaseAdminClient();
  const filtered = (head: boolean) => {
    let query = supabase.from("buildlog_projects").select("id, name, current_version, project_status, status, display_order, is_demo, items, updated_at", head ? { count: "exact", head: true } : undefined);
    if (q) query = query.ilike("name", `%${q.replace(/[\\%_]/g, "\\$&")}%`);
    if (status !== "all") query = query.eq("status", status);
    return query;
  };
  const { count, error: countError } = await filtered(true);
  const pages = count === null ? 1 : Math.max(1, Math.ceil(count / PAGE_SIZE));
  if (!countError && page > pages) redirect(pageHref(pages));
  const { data: projects, error: projectsError } = countError || count === null
    ? { data: null, error: countError }
    : await filtered(false).order("display_order", { ascending: true }).order("name", { ascending: true }).order("id").range((page - 1) * PAGE_SIZE, page * PAGE_SIZE - 1);
  const error = countError || count === null || projectsError;

  return (
    <div className="flex min-w-0 flex-col gap-6">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Buildlog</h1>
          <p className="text-sm text-ink-secondary">Manage projects and release items shown on the public Buildlog.</p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <Link href="/admin/buildlog/settings" className="inline-flex min-h-11 items-center justify-center rounded-xl border border-border-hairline bg-surface-raised px-4 py-2 text-sm font-medium text-ink-secondary transition-colors hover:bg-surface-base hover:text-ink-primary">
            <Settings className="mr-2 size-4" /> Page settings
          </Link>
          <Link href="/admin/buildlog/new" className="inline-flex min-h-11 items-center justify-center rounded-xl bg-accent-signal px-4 py-2 text-sm font-medium text-white shadow transition-opacity hover:opacity-90">
            <Plus className="mr-2 size-4" /> New project
          </Link>
        </div>
      </div>
      {params.saved === "1" && <p role="status" className="rounded-xl border border-emerald-500/40 bg-emerald-950/20 p-4 text-sm text-emerald-200">Buildlog project saved.</p>}
      {params.notice === "deleted" && <p role="status" className="rounded-xl border border-emerald-500/40 bg-emerald-950/20 p-4 text-sm text-emerald-200">Buildlog project deleted.</p>}
      {params.cache === "stale" && <p role="alert" className="rounded-xl border border-amber-500/40 bg-amber-950/20 p-4 text-sm text-amber-200">The database change completed, but the public Buildlog cache could not be refreshed. Visitors may see the previous version for up to an hour.</p>}

      <form action="/admin/buildlog" method="get" className="grid gap-3 rounded-xl border border-border-hairline bg-surface-raised p-4 sm:grid-cols-[minmax(0,1fr)_auto_auto] sm:items-end">
        <div className="min-w-0 space-y-1"><label htmlFor="buildlog-search" className="text-sm font-medium">Search projects</label><input id="buildlog-search" name="q" type="search" defaultValue={q} maxLength={100} placeholder="Find a Buildlog project" className="min-h-11 w-full rounded-xl border border-border-hairline bg-surface-base px-3 text-sm" /></div>
        <div className="space-y-1"><label htmlFor="buildlog-list-status" className="text-sm font-medium">Visibility</label><select id="buildlog-list-status" name="status" defaultValue={status} className="min-h-11 w-full rounded-xl border border-border-hairline bg-surface-base px-3 text-sm"><option value="all">All statuses</option><option value="draft">Draft</option><option value="published">Published</option><option value="archived">Archived</option></select></div>
        <button type="submit" className="min-h-11 rounded-xl bg-accent-signal px-5 text-sm font-medium text-white">Apply</button>
      </form>
      {error ? <div role="alert" className="rounded-xl border border-red-500/30 bg-red-950/30 p-4 text-sm text-red-300">Buildlog projects could not be loaded. <Link prefetch={false} href={`${pageHref(page)}${pageHref(page).includes("?") ? "&" : "?"}retry=${Date.now()}`} className="font-medium underline underline-offset-2">Retry</Link>.</div> : <p role="status" className="text-sm text-ink-secondary">{count === 0 ? "Showing 0 projects" : `Showing ${(page - 1) * PAGE_SIZE + 1}-${(page - 1) * PAGE_SIZE + (projects?.length ?? 0)} of ${count} projects`}</p>}

      <div className="grid min-w-0 gap-3 xl:hidden">
        {!error && !projects?.length ? (
          <p className="rounded-xl border border-border-hairline bg-surface-raised p-6 text-sm text-ink-secondary">
            {q || status !== "all" ? "No projects match these filters. Try another title or status." : "No Buildlog projects found. Create one to publish your first release record."}
          </p>
        ) : projects?.map((project) => (
          <article key={project.id} className="min-w-0 rounded-2xl border border-border-hairline bg-surface-raised p-4 shadow-sm">
            <div className="flex min-w-0 flex-wrap items-start justify-between gap-3">
              <div className="min-w-0 flex-1">
                <h2 className="break-words text-base font-semibold text-ink-primary">{project.name}</h2>
                <p className="mt-1 break-all font-mono text-xs text-ink-secondary">{project.current_version}</p>
              </div>
              <span className={`inline-flex shrink-0 rounded-full px-2.5 py-1 text-xs font-semibold ${project.status === "published" ? "bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400" : project.status === "archived" ? "bg-surface-base text-ink-secondary" : "bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-400"}`}>{project.status}</span>
            </div>
            <dl className="mt-4 grid grid-cols-2 gap-x-4 gap-y-3 border-t border-border-hairline pt-4 text-sm">
              <div><dt className="text-xs text-ink-secondary">Release items</dt><dd className="mt-1 font-medium text-ink-primary">{Array.isArray(project.items) ? project.items.length : 0}</dd></div>
              <div><dt className="text-xs text-ink-secondary">Lifecycle</dt><dd className="mt-1 font-medium text-ink-primary">{project.project_status === "in_progress" ? "In progress" : project.project_status === "live" ? "Live" : "Completed"}</dd></div>
              <div><dt className="text-xs text-ink-secondary">Order</dt><dd className="mt-1 font-medium text-ink-primary">{project.display_order}</dd></div>
              {project.is_demo && <div><dt className="text-xs text-ink-secondary">Type</dt><dd className="mt-1 font-medium text-amber-800 dark:text-amber-300">Demo</dd></div>}
            </dl>
            <div className="mt-4 flex items-center justify-end gap-2 border-t border-border-hairline pt-3">
              <Link href={`/admin/buildlog/${project.id}`} aria-label={`Edit ${project.name}`} className="inline-flex size-11 items-center justify-center rounded-lg text-ink-secondary transition-colors hover:bg-surface-base hover:text-accent-signal focus-visible:outline focus-visible:outline-2 focus-visible:outline-current"><Edit className="size-4" /></Link>
               <DeleteBuildlogButton id={project.id} name={project.name} updatedAt={project.updated_at} />
            </div>
          </article>
        ))}
      </div>

      <div className="hidden overflow-hidden rounded-xl border border-border-hairline bg-surface-raised shadow-sm xl:block">
        <div className="overflow-x-auto">
          <table className="w-full min-w-[780px] text-left text-sm">
            <thead className="border-b border-border-hairline bg-surface-base text-ink-secondary">
              <tr>
                  <th scope="col" className="px-6 py-4 font-medium">Project</th>
                  <th scope="col" className="px-6 py-4 font-medium">Items</th>
                  <th scope="col" className="px-6 py-4 font-medium">Lifecycle</th>
                  <th scope="col" className="px-6 py-4 font-medium">Visibility</th>
                  <th scope="col" className="px-6 py-4 font-medium">Order</th>
                  <th scope="col" className="px-6 py-4 text-right font-medium">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border-hairline">
              {!error && (!projects || projects.length === 0) ? (
                <tr><td colSpan={6} className="px-6 py-10 text-center text-ink-secondary">{q || status !== "all" ? "No projects match these filters. Try another title or status." : "No Buildlog projects found. Create one to publish your first release record."}</td></tr>
              ) : projects?.map((project) => (
                <tr key={project.id} className="transition-colors hover:bg-surface-base/50">
                  <td className="px-6 py-4 font-medium text-ink-primary">
                    {project.name}
                    <div className="mt-1 text-xs font-normal text-ink-secondary">{project.current_version}</div>
                    {project.is_demo && <span className="mt-1 inline-flex rounded-full bg-amber-100 px-2 py-0.5 text-[10px] font-medium text-amber-800 dark:bg-amber-900/30 dark:text-amber-300">Demo</span>}
                  </td>
                  <td className="px-6 py-4 text-ink-secondary">{Array.isArray(project.items) ? project.items.length : 0}</td>
                  <td className="px-6 py-4 text-ink-secondary">{project.project_status === "in_progress" ? "In progress" : project.project_status === "live" ? "Live" : "Completed"}</td>
                  <td className="px-6 py-4"><span className={`inline-flex rounded-full px-2.5 py-0.5 text-xs font-semibold ${project.status === "published" ? "bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400" : project.status === "archived" ? "bg-surface-base text-ink-secondary" : "bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-400"}`}>{project.status}</span></td>
                  <td className="px-6 py-4 text-ink-secondary">{project.display_order}</td>
                  <td className="px-6 py-4 text-right">
                    <div className="flex items-start justify-end gap-2">
                       <Link href={`/admin/buildlog/${project.id}`} aria-label={`Edit ${project.name}`} className="flex size-11 items-center justify-center rounded-lg text-ink-secondary transition-colors hover:bg-surface-base hover:text-accent-signal"><Edit className="size-4" /></Link>
                       <DeleteBuildlogButton id={project.id} name={project.name} updatedAt={project.updated_at} />
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
      {!error && count !== null && pages > 1 && <nav aria-label="Buildlog pages" className="flex items-center justify-between gap-3 text-sm">
        {page > 1 ? <Link href={pageHref(page - 1)} className="inline-flex min-h-11 items-center gap-1 rounded-xl px-3 hover:bg-surface-raised"><ChevronLeft className="size-4" aria-hidden />Previous</Link> : <span className="inline-flex min-h-11 items-center gap-1 px-3 opacity-50"><ChevronLeft className="size-4" aria-hidden />Previous</span>}
        <span>Page {page} of {pages}</span>
        {page < pages ? <Link href={pageHref(page + 1)} className="inline-flex min-h-11 items-center gap-1 rounded-xl px-3 hover:bg-surface-raised">Next<ChevronRight className="size-4" aria-hidden /></Link> : <span className="inline-flex min-h-11 items-center gap-1 px-3 opacity-50">Next<ChevronRight className="size-4" aria-hidden /></span>}
      </nav>}
    </div>
  );
}
