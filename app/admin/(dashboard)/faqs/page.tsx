import createSupabaseServerClient from "@/app/lib/supabase/server";
import Link from "next/link";
import { Plus, Edit } from "lucide-react";
import { DeleteRowButton } from "@/app/components/admin/DeleteRowButton";
import { FaqVisibilityToggle, FaqSectionToggle } from "@/app/components/admin/FaqToggles";

export const dynamic = "force-dynamic";

export default async function AdminFaqsPage() {
  const supabase = await createSupabaseServerClient();

  const [{ data: faqs, error: faqsError }, { data: setting }] = await Promise.all([
    supabase
      .from("faqs")
      .select("id, question, answer, display_order, is_visible")
      .order("display_order", { ascending: true })
      .order("created_at", { ascending: true }),
    supabase.from("site_settings").select("show_faq_section").limit(1).maybeSingle(),
  ]);

  const sectionEnabled = setting?.show_faq_section !== false;
  const tableMissing = Boolean(faqsError);

  return (
    <div className="flex flex-col gap-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">FAQs</h1>
          <p className="text-sm text-ink-secondary">
            Manage the questions shown in the homepage FAQ section.
          </p>
        </div>
        <Link
          href="/admin/faqs/new"
          className="inline-flex items-center justify-center rounded-xl bg-accent-signal px-4 py-2 text-sm font-medium text-white shadow hover:bg-accent-signal/90 transition-all"
        >
          <Plus className="mr-2 h-4 w-4" />
          New FAQ
        </Link>
      </div>

      <FaqSectionToggle enabled={sectionEnabled} />

      {tableMissing ? (
        <div className="rounded-xl border border-yellow-300/50 bg-yellow-50 p-5 text-sm text-yellow-800 dark:border-yellow-500/30 dark:bg-yellow-950/20 dark:text-yellow-400">
          The <code className="font-mono">faqs</code> table doesn&apos;t exist yet. Run{" "}
          <code className="font-mono">migrations/2026_faqs.sql</code> in the Supabase SQL editor,
          then reload this page. Until then, the homepage shows the built-in default questions.
        </div>
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
                            className="p-2 text-ink-secondary hover:text-accent-signal hover:bg-surface-base rounded-lg transition-colors"
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
