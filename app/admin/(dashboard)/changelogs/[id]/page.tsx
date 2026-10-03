import { ChangelogForm } from "@/app/components/admin/ChangelogForm";
import { requireAdmin } from "@/app/lib/admin-auth";
import { createSupabaseAdminClient } from "@/app/lib/supabase/server";
import { notFound, redirect } from "next/navigation";

export default async function EditChangelogPage({ params }: { params: Promise<{ id: string }> }) {
  const auth = await requireAdmin();
  if (auth.response) redirect(auth.response.status === 401 ? "/admin/login" : "/");
  const { id } = await params;
  const supabase = await createSupabaseAdminClient();
  const { data: changelog, error } = await supabase
    .from("changelogs")
    .select("*")
    .eq("id", id)
    .maybeSingle();

  if (error) throw new Error("Changelog could not be loaded");
  if (!changelog) notFound();

  // Format date if present
  if (changelog.published_at) {
    changelog.published_at = new Date(changelog.published_at).toISOString().split("T")[0];
  }

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Edit Changelog</h1>
        <p className="text-sm text-ink-secondary">Update your changelog entry details.</p>
      </div>
      
      <div className="rounded-xl border border-border-hairline bg-surface-raised p-6 shadow-sm">
        <ChangelogForm initialData={changelog} />
      </div>
    </div>
  );
}
