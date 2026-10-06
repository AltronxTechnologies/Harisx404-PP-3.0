import { ExperienceForm } from "@/app/components/admin/ExperienceForm";
import { requireAdmin } from "@/app/lib/admin-auth";
import { createSupabaseAdminClient } from "@/app/lib/supabase/server";
import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { z } from "zod";

export default async function EditExperiencePage({ params }: { params: Promise<{ id: string }> }) {
  const auth = await requireAdmin();
  if (auth.response) redirect(auth.response.status === 401 ? "/admin/login" : "/");
  const { id } = await params;
  if (!z.string().uuid().safeParse(id).success) notFound();
  const supabase = await createSupabaseAdminClient();
  const { data: entry, error } = await supabase
    .from("experience")
    .select("*")
    .eq("id", id)
    .maybeSingle();

  if (error) return <div role="alert" className="rounded-xl border border-red-500/30 bg-red-950/20 p-5 text-sm text-red-200">Experience entry could not be loaded. <Link prefetch={false} href={`/admin/experience/${id}?retry=${Date.now()}`} className="inline-flex min-h-11 items-center font-medium underline underline-offset-2">Retry loading</Link></div>;
  if (!entry) notFound();

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Edit Experience Entry</h1>
        <p className="text-sm text-ink-secondary">Update this experience entry&apos;s details.</p>
      </div>

      <div className="rounded-xl border border-border-hairline bg-surface-raised p-6 shadow-sm">
        <ExperienceForm initialData={entry} />
      </div>
    </div>
  );
}
