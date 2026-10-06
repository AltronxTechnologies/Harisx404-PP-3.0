import { TestimonialForm } from "@/app/components/admin/TestimonialForm";
import { requireAdmin } from "@/app/lib/admin-auth";
import { createSupabaseAdminClient } from "@/app/lib/supabase/server";
import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { z } from "zod";

export default async function EditTestimonialPage({ params }: { params: Promise<{ id: string }> }) {
  const auth = await requireAdmin();
  if (auth.response) redirect(auth.response.status === 401 ? "/admin/login" : "/");
  const { id } = await params;
  if (!z.string().uuid().safeParse(id).success) notFound();
  // Pending and archived rows require the service role after the admin gate.
  let testimonial;
  try {
    const supabase = await createSupabaseAdminClient();
    const { data, error } = await supabase
      .from("testimonials")
      .select("*")
      .eq("id", id)
      .maybeSingle();
    if (error) throw error;
    testimonial = data;
  } catch (error) {
    console.error("Admin Testimonial read failed", error);
    return <div role="alert" className="rounded-xl border border-red-500/30 bg-red-950/20 p-5 text-sm text-red-200">Testimonial could not be loaded. <Link prefetch={false} href={`/admin/testimonials/${id}?retry=${Date.now()}`} className="inline-flex min-h-11 items-center font-medium underline underline-offset-2">Retry loading</Link></div>;
  }

  if (!testimonial) notFound();

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Edit Testimonial</h1>
        <p className="text-sm text-ink-secondary">Update this testimonial&apos;s details.</p>
      </div>

      <div className="rounded-xl border border-border-hairline bg-surface-raised p-6 shadow-sm">
        <TestimonialForm initialData={testimonial} />
      </div>
    </div>
  );
}
