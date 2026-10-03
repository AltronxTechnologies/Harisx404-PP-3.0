import { redirect } from "next/navigation";
import { requireAdmin } from "@/app/lib/admin-auth";
import { createSupabaseAdminClient } from "@/app/lib/supabase/server";
import Link from "next/link";
import { Plus, Edit } from "lucide-react";
import { DeleteChangelogButton } from "@/app/components/admin/DeleteChangelogButton";

export default async function AdminChangelogsPage() {
  const auth = await requireAdmin();
  if (auth.response) redirect(auth.response.status === 401 ? "/admin/login" : "/");
  const supabase = await createSupabaseAdminClient();
  const { data: changelogs, error } = await supabase
    .from("changelogs")
    .select("id, title, slug, status, published_at")
    .order("published_at", { ascending: false });

  return (
    <div className="flex min-w-0 flex-col gap-6">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Changelogs</h1>
          <p className="text-sm text-ink-secondary">Manage your portfolio changelog entries.</p>
        </div>
        <Link
          href="/admin/changelogs/new"
          className="inline-flex min-h-11 items-center justify-center rounded-xl bg-accent-signal px-4 py-2 text-sm font-medium text-white shadow hover:bg-accent-signal/90 transition-all"
        >
          <Plus className="mr-2 h-4 w-4" />
          New Changelog
        </Link>
      </div>

      <div className="rounded-xl border border-border-hairline bg-surface-raised shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm text-left">
            <thead className="bg-surface-base border-b border-border-hairline text-ink-secondary">
              <tr>
                <th className="px-6 py-4 font-medium">Title</th>
                <th className="px-6 py-4 font-medium">Status</th>
                <th className="px-6 py-4 font-medium">Published Date</th>
                <th className="px-6 py-4 font-medium text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border-hairline">
              {error ? (
                <tr><td colSpan={4} role="alert" className="px-6 py-8 text-center text-text-secondary">Changelogs could not be loaded. Reload this page to retry.</td></tr>
              ) : changelogs?.length === 0 ? (
                <tr>
                  <td colSpan={4} className="px-6 py-8 text-center text-ink-secondary">
                    No changelogs found. Create one to get started!
                  </td>
                </tr>
              ) : (
                changelogs?.map((changelog) => (
                  <tr key={changelog.id} className="hover:bg-surface-base/50 transition-colors">
                    <td className="px-6 py-4 font-medium text-ink-primary">
                      {changelog.title}
                      <div className="text-xs text-ink-secondary font-normal mt-1">{changelog.slug}</div>
                    </td>
                    <td className="px-6 py-4">
                      <span className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-semibold ${
                        changelog.status === "published" 
                          ? "bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400"
                          : "bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-400"
                      }`}>
                        {changelog.status}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-ink-secondary">
                      {changelog.published_at ? new Date(changelog.published_at).toLocaleDateString() : "N/A"}
                    </td>
                    <td className="px-6 py-4 text-right">
                      <div className="flex items-center justify-end gap-2">
                        <Link 
                          href={`/admin/changelogs/${changelog.id}`}
                          aria-label={`Edit ${changelog.title}`}
                          className="inline-flex size-11 items-center justify-center rounded-lg text-ink-secondary transition-colors hover:bg-surface-base hover:text-accent-signal focus-visible:outline focus-visible:outline-2 focus-visible:outline-current"
                        >
                          <Edit className="h-4 w-4" />
                        </Link>
                        <DeleteChangelogButton id={changelog.id} name={changelog.title} />
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
