import createSupabaseServerClient from "@/app/lib/supabase/server";
import Link from "next/link";
import { Plus, Edit } from "lucide-react";
import { DeleteRowButton } from "@/app/components/admin/DeleteRowButton";

export default async function AdminCertificationsPage() {
  const supabase = await createSupabaseServerClient();
  const { data: entries } = await supabase
    .from("certifications")
    .select("id, title, issuer, issue_date, status, display_order")
    .order("display_order", { ascending: true });

  return (
    <div className="flex flex-col gap-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Certifications</h1>
          <p className="text-sm text-ink-secondary">Manage the certifications shown on the about page.</p>
        </div>
        <Link
          href="/admin/certifications/new"
          className="inline-flex items-center justify-center rounded-xl bg-accent-signal px-4 py-2 text-sm font-medium text-white shadow hover:bg-accent-signal/90 transition-all"
        >
          <Plus className="mr-2 h-4 w-4" />
          New Certification
        </Link>
      </div>

      <div className="rounded-xl border border-border-hairline bg-surface-raised shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm text-left">
            <thead className="bg-surface-base border-b border-border-hairline text-ink-secondary">
              <tr>
                <th className="px-6 py-4 font-medium">Title</th>
                <th className="px-6 py-4 font-medium">Issued</th>
                <th className="px-6 py-4 font-medium">Status</th>
                <th className="px-6 py-4 font-medium">Order</th>
                <th className="px-6 py-4 font-medium text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border-hairline">
              {!entries || entries.length === 0 ? (
                <tr>
                  <td colSpan={5} className="px-6 py-8 text-center text-ink-secondary">
                    No certifications found. Create one to get started!
                  </td>
                </tr>
              ) : (
                entries.map((entry) => (
                  <tr key={entry.id} className="hover:bg-surface-base/50 transition-colors">
                    <td className="px-6 py-4 font-medium text-ink-primary">
                      {entry.title}
                      {entry.issuer && (
                        <div className="text-xs text-ink-secondary font-normal mt-1">{entry.issuer}</div>
                      )}
                    </td>
                    <td className="px-6 py-4 text-ink-secondary">
                      {entry.issue_date || "N/A"}
                    </td>
                    <td className="px-6 py-4">
                      <span className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-semibold ${
                        entry.status === "published"
                          ? "bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400"
                          : "bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-400"
                      }`}>
                        {entry.status}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-ink-secondary">{entry.display_order}</td>
                    <td className="px-6 py-4 text-right">
                      <div className="flex items-center justify-end gap-2">
                        <Link
                          href={`/admin/certifications/${entry.id}`}
                          className="p-2 text-ink-secondary hover:text-accent-signal hover:bg-surface-base rounded-lg transition-colors"
                        >
                          <Edit className="h-4 w-4" />
                        </Link>
                        <DeleteRowButton id={entry.id} endpoint="/api/admin/certifications" label="certification" />
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
