import { requireAdmin } from "@/app/lib/admin-auth";
import { createSupabaseAdminClient } from "@/app/lib/supabase/server";
import { redirect } from "next/navigation";
import Link from "next/link";
import { Plus, Edit } from "lucide-react";
import { DeleteRowButton } from "@/app/components/admin/DeleteRowButton";
import { FaqVisibilityToggle, FaqSectionToggle } from "@/app/components/admin/FaqToggles";

export const dynamic = "force-dynamic";

export default async function AdminFaqsPage() {
  const auth = await requireAdmin();
  if (auth.response) redirect(auth.response.status === 401 ? "/admin/login" : "/");
  const supabase = await createSupabaseAdminClient();

  const [{ data: faqs, error: faqsError }, { data: setting, error: settingError }] = await Promise.all([
    supabase
      .from("faqs")
      .select("id, question, answer, display_order, is_visible")
      .order("display_order", { ascending: true })
      .order("created_at", { ascending: true }),
    supabase.from("site_settings").select("show_faq_section").limit(1).maybeSingle(),
  ]);

  const sectionEnabled = setting?.show_faq_section !== false;
  return (
    <div className="flex min-w-0 flex-col gap-6">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">FAQs</h1>
          <p className="text-sm text-ink-secondary">
            Manage the questions shown in the homepage FAQ section.
          </p>
        </div>
        <Link
          href="/admin/faqs/new"
          className="inline-flex min-h-11 items-center justify-center rounded-xl bg-accent-signal px-4 py-2 text-sm font-medium text-white shadow hover:bg-accent-signal/90 transition-all"
        >
          <Plus className="mr-2 h-4 w-4" />
          New FAQ
        </Link>
      </div>

      {settingError ? (
        <p role="alert" className="rounded-xl border border-border-primary bg-bg-primary p-4 text-sm text-text-secondary">
          FAQ section visibility could not be loaded. Reload this page to retry before changing it.
        </p>
      ) : (
        <FaqSectionToggle enabled={sectionEnabled} />
      )}

      {faqsError ? (
        <p role="alert" className="rounded-xl border border-border-primary bg-bg-primary p-4 text-sm text-text-secondary">
          FAQs could not be loaded. Reload this page to retry.
        </p>
      ) : (
        <div className="rounded-xl border border-border-hairline bg-surface-raised shadow-sm overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-sm text-left">
              <thead className="bg-surface-base border-b border-border-hairline text-ink-secondary">
                <tr>
                  <th className="px-6 py-4 font-medium w-16">Order</th>
                  <th className="px-6 py-4 font-medium">Question</th>
                  <th className="px-6 py-4 font-medium">Status</th>
                  <th className="px-6 py-4 font-medium text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border-hairline">
                {!faqs || faqs.length === 0 ? (
                  <tr>
                    <td colSpan={4} className="px-6 py-8 text-center text-ink-secondary">
                      No FAQs found. Create one to get started!
                    </td>
                  </tr>
                ) : (
                  faqs.map((faq) => (
                    <tr key={faq.id} className="hover:bg-surface-base/50 transition-colors">
                      <td className="px-6 py-4 text-ink-secondary font-mono">{faq.display_order}</td>
                      <td className="px-6 py-4 font-medium text-ink-primary">
                        {faq.question}
                        <div className="mt-1 line-clamp-1 max-w-xl text-xs font-normal text-ink-secondary">
                          {faq.answer}
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <FaqVisibilityToggle id={faq.id} isVisible={faq.is_visible} />
                      </td>
                      <td className="px-6 py-4 text-right">
                        <div className="flex items-center justify-end gap-2">
                          <Link
                            href={`/admin/faqs/${faq.id}`}
                            aria-label={`Edit ${faq.question}`}
                            className="inline-flex size-11 items-center justify-center rounded-lg text-ink-secondary transition-colors hover:bg-surface-base hover:text-accent-signal focus-visible:outline focus-visible:outline-2 focus-visible:outline-current"
                          >
                            <Edit className="h-4 w-4" />
                          </Link>
                          <DeleteRowButton id={faq.id} endpoint="/api/admin/faqs" label="FAQ" />
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}
