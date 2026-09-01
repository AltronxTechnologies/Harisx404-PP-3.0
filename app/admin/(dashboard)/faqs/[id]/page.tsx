import { FaqForm } from "@/app/components/admin/FaqForm";
import createSupabaseServerClient from "@/app/lib/supabase/server";
import { notFound } from "next/navigation";

export default async function EditFaqPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const supabase = await createSupabaseServerClient();
  const { data: faq, error } = await supabase
    .from("faqs")
    .select("*")
    .eq("id", id)
    .single();

  if (error || !faq) {
    notFound();
  }

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Edit FAQ</h1>
        <p className="text-sm text-ink-secondary">Update this homepage FAQ entry.</p>
      </div>

      <div className="rounded-xl border border-border-hairline bg-surface-raised p-6 shadow-sm">
        <FaqForm initialData={faq} />
      </div>
    </div>
  );
}
