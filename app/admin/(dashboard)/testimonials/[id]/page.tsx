import { TestimonialForm } from "@/app/components/admin/TestimonialForm";
import { createSupabaseAdminClient } from "@/app/lib/supabase/server";
import { notFound } from "next/navigation";

export default async function EditTestimonialPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  // Service-role client so pending/archived rows (hidden from the
  // session client by RLS) can be edited. Page is admin-gated by middleware.
  const supabase = await createSupabaseAdminClient();
  const { data: testimonial, error } = await supabase
    .from("testimonials")
    .select("*")
    .eq("id", id)
    .single();

  if (error || !testimonial) {
    notFound();
  }

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
