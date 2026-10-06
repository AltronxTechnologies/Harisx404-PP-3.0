import { requireAdmin } from "@/app/lib/admin-auth";
import { createSupabaseAdminClient } from "@/app/lib/supabase/server";
import { redirect } from "next/navigation";
import Link from "next/link";
import { Plus, Edit } from "lucide-react";
import { DeleteFaqButton } from "@/app/components/admin/DeleteFaqButton";
import { FaqVisibilityToggle, FaqSectionToggle } from "@/app/components/admin/FaqToggles";

export const dynamic = "force-dynamic";

export default async function AdminFaqsPage() {
  const auth = await requireAdmin();
  if (auth.response) redirect(auth.response.status === 401 ? "/admin/login" : "/");
  const supabase = await createSupabaseAdminClient();

  const [{ data: faqs, error: faqsError }, { data: settings, error: settingError }] = await Promise.all([
    supabase
      .from("faqs")
      .select("id, question, answer, display_order, is_visible")
      .order("display_order", { ascending: true })
      .order("created_at", { ascending: true }),
    supabase.from("site_settings").select("show_faq_section").limit(2),
  ]);

  const setting = settings?.length === 1 ? settings[0] : null;
  const sectionEnabled = setting?.show_faq_section === true;
  return (
    <div className="flex min-w-0 flex-col gap-6">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-ink-primary">FAQs</h1>
          <p className="mt-1 text-sm text-ink-secondary">
            Manage the questions shown in the homepage FAQ section.
          </p>
        </div>
        <Link
          href="/admin/faqs/new"
           className="inline-flex min-h-11 items-center justify-center rounded-xl bg-accent-signal px-4 py-2 text-sm font-medium text-white shadow hover:bg-accent-signal/90 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-white"
        >
          <Plus className="mr-2 h-4 w-4" />
          New FAQ
        </Link>
      </div>

       {(settingError || !setting) ? (
         <p role="alert" className="rounded-xl border border-red-500/30 bg-red-950/20 p-4 text-sm text-red-200">
           FAQ section visibility could not be loaded. <Link prefetch={false} href={`/admin/faqs?retry=${Date.now()}`} className="inline-flex min-h-11 items-center font-medium underline underline-offset-2">Retry loading</Link> before changing it.
        </p>
      ) : (
        <FaqSectionToggle enabled={sectionEnabled} />
      )}

      {faqsError ? (
         <p role="alert" className="rounded-xl border border-red-500/30 bg-red-950/20 p-4 text-sm text-red-200">
           FAQs could not be loaded. <Link prefetch={false} href={`/admin/faqs?retry=${Date.now()}`} className="inline-flex min-h-11 items-center font-medium underline underline-offset-2">Retry loading</Link>.
         </p>
       ) : (
         <div className="flex min-w-0 flex-col gap-4">
           <p role="status" className="text-sm text-ink-secondary">{faqs?.length ?? 0} questions · {faqs?.filter((faq) => faq.is_visible).length ?? 0} set to visible</p>
           <div className="grid min-w-0 gap-3 xl:hidden">
             {!faqs?.length ? <p className="rounded-2xl border border-border-hairline bg-surface-raised p-5 text-sm text-ink-secondary">No FAQs found. Create a question to get started.</p> : faqs.map((faq) => <article key={faq.id} className="min-w-0 rounded-2xl border border-border-hairline bg-surface-raised p-4 shadow-sm">
               <div className="flex min-w-0 items-start justify-between gap-3"><h2 className="min-w-0 break-words font-semibold text-ink-primary" style={{ overflowWrap: "anywhere" }}>{faq.question}</h2><span className="shrink-0 font-mono text-xs text-ink-secondary">#{faq.display_order}</span></div>
               <p className="mt-2 line-clamp-3 break-words text-sm leading-6 text-ink-secondary" style={{ overflowWrap: "anywhere" }}>{faq.answer}</p>
               <div className="mt-4 flex flex-wrap items-center justify-between gap-2 border-t border-border-hairline pt-3">
                 <FaqVisibilityToggle id={faq.id} isVisible={faq.is_visible} question={faq.question} />
                 <div className="flex items-center gap-2"><Link href={`/admin/faqs/${faq.id}`} aria-label={`Edit ${faq.question}`} className="inline-flex size-11 items-center justify-center rounded-xl text-ink-secondary hover:bg-surface-base hover:text-accent-signal focus-visible:outline focus-visible:outline-2 focus-visible:outline-current"><Edit aria-hidden className="size-4" /></Link><DeleteFaqButton id={faq.id} question={faq.question} /></div>
               </div>
             </article>)}
           </div>
           <div className="hidden overflow-hidden rounded-xl border border-border-hairline bg-surface-raised shadow-sm xl:block">
           <div className="overflow-x-auto" role="region" aria-label="FAQs table" tabIndex={0}>
            <table className="admin-action-table w-full text-sm text-left">
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
                         <FaqVisibilityToggle id={faq.id} isVisible={faq.is_visible} question={faq.question} />
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
                           <DeleteFaqButton id={faq.id} question={faq.question} />
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
           </div>
           </div>
         </div>
      )}
    </div>
  );
}
