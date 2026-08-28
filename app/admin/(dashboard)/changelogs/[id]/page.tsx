import { ChangelogForm } from "@/app/components/admin/ChangelogForm";
import createSupabaseServerClient from "@/app/lib/supabase/server";
import { notFound } from "next/navigation";

export default async function EditChangelogPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const supabase = await createSupabaseServerClient();
  const { data: changelog, error } = await supabase
    .from("changelogs")
    .select("*")
    .eq("id", id)
    .single();

  if (error || !changelog) {
    notFound();
  }

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
