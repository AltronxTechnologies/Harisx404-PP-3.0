import { FaqForm } from "@/app/components/admin/FaqForm";
import Link from "next/link";
import { requireAdmin } from "@/app/lib/admin-auth";
import { createSupabaseAdminClient } from "@/app/lib/supabase/server";
import { notFound, redirect } from "next/navigation";

export default async function EditFaqPage({ params }: { params: Promise<{ id: string }> }) {
  const auth = await requireAdmin();
  if (auth.response) redirect(auth.response.status === 401 ? "/admin/login" : "/");
  const { id } = await params;
  const supabase = await createSupabaseAdminClient();
  const { data: faq, error } = await supabase
    .from("faqs")
    .select("*")
    .eq("id", id)
    .maybeSingle();

  if (error) return <div role="alert" className="rounded-xl border border-red-500/30 bg-red-950/20 p-5 text-sm text-red-200">This FAQ could not be loaded. <Link prefetch={false} href={`/admin/faqs/${id}?retry=${Date.now()}`} className="inline-flex min-h-11 items-center font-medium underline underline-offset-2">Retry loading</Link></div>;
  if (!faq) notFound();

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
