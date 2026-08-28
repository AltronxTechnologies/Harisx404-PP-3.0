import { CertificationForm } from "@/app/components/admin/CertificationForm";
import createSupabaseServerClient from "@/app/lib/supabase/server";
import { notFound } from "next/navigation";

export default async function EditCertificationPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const supabase = await createSupabaseServerClient();
  const { data: entry, error } = await supabase
    .from("certifications")
    .select("*")
    .eq("id", id)
    .single();

  if (error || !entry) {
    notFound();
  }

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Edit Certification</h1>
        <p className="text-sm text-ink-secondary">Update this certification&apos;s details.</p>
      </div>

      <div className="rounded-xl border border-border-hairline bg-surface-raised p-6 shadow-sm">
        <CertificationForm initialData={entry} />
      </div>
    </div>
  );
}
