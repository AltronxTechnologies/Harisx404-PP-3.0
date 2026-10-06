import { createSupabaseAdminClient } from "@/app/lib/supabase/server";
import { requireAdmin } from "@/app/lib/admin-auth";
import { redirect } from "next/navigation";
import Link from "next/link";
import { Plus, Edit, Inbox } from "lucide-react";
import { DeleteTestimonialButton } from "@/app/components/admin/DeleteTestimonialButton";
import { TestimonialModerationActions } from "@/app/components/admin/TestimonialModerationActions";

type TestimonialRow = {
  id: string;
  headline: string;
  quote: string;
  name: string;
  role: string | null;
  status: string;
  display_order: number;
  created_at: string | null;
  // Present once migrations/2026_testimonial_submissions.sql has been run.
  email?: string | null;
  source?: string | null;
};

const statusBadge: Record<string, string> = {
  published:
    "bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400",
  pending:
    "bg-amber-100 text-amber-800 dark:bg-amber-900/30 dark:text-amber-400",
  archived: "bg-gray-100 text-gray-600 dark:bg-gray-800 dark:text-gray-400",
  draft:
    "bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-400",
};

function formatDate(value: string | null) {
  if (!value) return "—";
  try {
    return new Date(value).toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
      year: "numeric",
    });
  } catch {
    return "—";
  }
}

export default async function AdminTestimonialsPage({ searchParams }: { searchParams: Promise<{ notice?: string; cache?: string }> }) {
  const auth = await requireAdmin();
  if (auth.response) redirect(auth.response.status === 401 ? "/admin/login" : "/");
  const params = await searchParams;
  const supabase = await createSupabaseAdminClient();
  // select("*") so the page keeps working whether or not the optional
  // email/source columns from the submissions migration exist yet.
  const { data, error } = await supabase
    .from("testimonials")
    .select("*")
    .order("display_order", { ascending: true })
    .order("created_at", { ascending: false });

  const testimonials = (data ?? []) as TestimonialRow[];
  const pending = testimonials.filter((t) => t.status === "pending");
  const rest = testimonials.filter((t) => t.status !== "pending");

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Testimonials</h1>
          <p className="text-sm text-ink-secondary">
            Review visitor submissions and manage the homepage carousel.
          </p>
        </div>
        <Link
          href="/admin/testimonials/new"
          className="inline-flex min-h-11 items-center justify-center rounded-xl bg-accent-signal px-4 py-2 text-sm font-medium text-white shadow hover:bg-accent-signal/90 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-white"
        >
          <Plus className="mr-2 h-4 w-4" />
          New Testimonial
        </Link>
      </div>
      {["saved", "published", "archived", "deleted"].includes(params.notice || "") && <p role="status" className="rounded-xl border border-emerald-500/30 bg-emerald-950/20 p-4 text-sm text-emerald-200">{params.notice === "saved" ? "Testimonial saved." : params.notice === "published" ? "Testimonial published." : params.notice === "archived" ? "Testimonial archived." : "Testimonial deleted."}</p>}
      {params.cache === "stale" && <p role="alert" className="rounded-xl border border-amber-500/30 bg-amber-950/20 p-4 text-sm text-amber-200">The database change completed, but homepage cache refresh could not be confirmed. Visitors may temporarily see the previous version.</p>}

      {error ? <div role="alert" className="rounded-2xl border border-red-500/30 bg-red-950/20 p-6 text-sm text-red-200">Testimonials could not be loaded. No submissions are displayed. <Link prefetch={false} href={`/admin/testimonials?retry=${Date.now()}`} className="inline-flex min-h-11 items-center font-medium underline underline-offset-2">Retry loading</Link></div> : <>
      {/* ---------- Pending review queue ---------- */}
      <div className="rounded-xl border border-amber-300/60 bg-amber-50/40 dark:border-amber-500/30 dark:bg-amber-900/10">
        <div className="flex items-center gap-2 border-b border-amber-300/60 px-6 py-4 dark:border-amber-500/30">
          <Inbox className="h-4 w-4 text-amber-600 dark:text-amber-400" />
          <h2 className="text-sm font-semibold text-ink-primary">
            Pending review
          </h2>
          <span className="ml-1 inline-flex items-center rounded-full bg-amber-200 px-2 py-0.5 text-xs font-semibold text-amber-900 dark:bg-amber-500/20 dark:text-amber-300">
            {pending.length}
          </span>
        </div>
        {pending.length === 0 ? (
          <p className="px-6 py-6 text-sm text-ink-secondary">
            No submissions waiting for review. Visitor submissions from the
            homepage will appear here.
          </p>
        ) : (
          <ul className="divide-y divide-amber-300/40 dark:divide-amber-500/20">
            {pending.map((t) => (
              <li key={t.id} className="px-6 py-5">
                <div className="flex flex-wrap items-start justify-between gap-4">
                  <div className="min-w-0 flex-1 break-words" style={{ overflowWrap: "anywhere" }}>
                    <p className="font-medium text-ink-primary">
                      &ldquo;{t.headline}&rdquo;
                    </p>
                    <p className="mt-1.5 text-sm leading-relaxed text-ink-secondary">
                      {t.quote}
                    </p>
                    <p className="mt-2 text-xs text-ink-secondary">
                      <span className="font-semibold text-ink-primary">
                        {t.name}
                      </span>
                      {t.role ? ` · ${t.role}` : ""}
                      {t.email ? (
                        <>
                          {" · "}
                          <a
                            href={`mailto:${t.email}`}
                            className="underline decoration-dotted underline-offset-2 hover:text-accent-signal"
                          >
                            {t.email}
                          </a>
                        </>
                      ) : (
                        " · no email provided"
                      )}
                      {" · "}
                      submitted {formatDate(t.created_at)}
                    </p>
                  </div>
                   <div className="flex w-full flex-wrap items-center gap-2 sm:w-auto">
                    <TestimonialModerationActions id={t.id} />
                    <Link
                      href={`/admin/testimonials/${t.id}`}
                      aria-label={`Edit testimonial from ${t.name}: ${t.headline}`}
                       className="inline-flex size-11 items-center justify-center rounded-lg text-ink-secondary hover:text-accent-signal hover:bg-surface-base focus-visible:outline focus-visible:outline-2 focus-visible:outline-current"
                      title="Edit before approving"
                    >
                      <Edit className="h-4 w-4" />
                    </Link>
                     <DeleteTestimonialButton id={t.id} name={t.name} />
                  </div>
                </div>
              </li>
            ))}
          </ul>
        )}
      </div>

      {/* ---------- All testimonials ---------- */}
      <div className="grid min-w-0 gap-3 xl:hidden">
        {rest.length === 0 ? <p className="rounded-2xl border border-border-hairline bg-surface-raised p-5 text-sm text-ink-secondary">No reviewed or curated testimonials yet.</p> : rest.map((t) => <article key={t.id} className="min-w-0 rounded-2xl border border-border-hairline bg-surface-raised p-4 shadow-sm">
          <div className="flex min-w-0 flex-wrap items-start justify-between gap-3">
            <h3 className="min-w-0 flex-1 break-words font-semibold text-ink-primary" style={{ overflowWrap: "anywhere" }}>{t.headline}</h3>
            <span className={`rounded-full px-2.5 py-1 text-xs font-medium capitalize ${statusBadge[t.status] ?? statusBadge.draft}`}>{t.status}</span>
          </div>
          <p className="mt-2 break-words text-sm leading-6 text-ink-secondary" style={{ overflowWrap: "anywhere" }}>{t.quote}</p>
          <dl className="mt-4 grid grid-cols-2 gap-3 border-t border-border-hairline pt-3 text-sm">
            <div className="min-w-0"><dt className="text-xs text-ink-secondary">Author</dt><dd className="break-words font-medium text-ink-primary">{t.name}{t.role ? ` · ${t.role}` : ""}</dd></div>
            <div><dt className="text-xs text-ink-secondary">Source</dt><dd className="font-medium text-ink-primary">{t.source === "public" ? "Visitor" : "Admin"}</dd></div>
            <div><dt className="text-xs text-ink-secondary">Order</dt><dd className="font-medium text-ink-primary">{t.display_order}</dd></div>
          </dl>
          <div className="mt-3 flex items-center justify-end gap-2 border-t border-border-hairline pt-3">
            <Link href={`/admin/testimonials/${t.id}`} aria-label={`Edit testimonial from ${t.name}: ${t.headline}`} className="inline-flex size-11 items-center justify-center rounded-lg text-ink-secondary hover:bg-surface-base hover:text-accent-signal focus-visible:outline focus-visible:outline-2 focus-visible:outline-current"><Edit aria-hidden className="size-4" /></Link>
            <DeleteTestimonialButton id={t.id} name={t.name} />
          </div>
        </article>)}
      </div>
      <div className="hidden overflow-hidden rounded-xl border border-border-hairline bg-surface-raised shadow-sm xl:block">
        <div className="overflow-x-auto" role="region" aria-label="Testimonials table" tabIndex={0}>
          <table className="admin-action-table w-full text-sm text-left">
            <thead className="bg-surface-base border-b border-border-hairline text-ink-secondary">
              <tr>
                <th className="px-6 py-4 font-medium">Headline</th>
                <th className="px-6 py-4 font-medium">Author</th>
                <th className="px-6 py-4 font-medium">Source</th>
                <th className="px-6 py-4 font-medium">Status</th>
                <th className="px-6 py-4 font-medium">Order</th>
                <th className="px-6 py-4 font-medium text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border-hairline">
              {rest.length === 0 ? (
                <tr>
                  <td
                    colSpan={6}
                    className="px-6 py-8 text-center text-ink-secondary"
                  >
                    No testimonials found. Create one to get started!
                  </td>
                </tr>
              ) : (
                rest.map((t) => (
                  <tr
                    key={t.id}
                    className="hover:bg-surface-base/50 transition-colors"
                  >
                    <td className="px-6 py-4 font-medium text-ink-primary">
                      {t.headline}
                    </td>
                    <td className="px-6 py-4 text-ink-secondary">
                      {t.name}
                      {t.role && (
                        <div className="text-xs font-normal mt-1">{t.role}</div>
                      )}
                    </td>
                    <td className="px-6 py-4 text-ink-secondary">
                      {t.source === "public" ? "Visitor" : "Admin"}
                    </td>
                    <td className="px-6 py-4">
                      <span
                        className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-semibold ${
                          statusBadge[t.status] ?? statusBadge.draft
                        }`}
                      >
                        {t.status}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-ink-secondary">
                      {t.display_order}
                    </td>
                    <td className="px-6 py-4 text-right">
                      <div className="flex items-center justify-end gap-2">
                        <Link
                          href={`/admin/testimonials/${t.id}`}
                          aria-label={`Edit testimonial from ${t.name}: ${t.headline}`}
                           className="inline-flex size-11 items-center justify-center rounded-lg text-ink-secondary hover:text-accent-signal hover:bg-surface-base focus-visible:outline focus-visible:outline-2 focus-visible:outline-current"
                        >
                          <Edit className="h-4 w-4" />
                        </Link>
                         <DeleteTestimonialButton id={t.id} name={t.name} />
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
      </>}
    </div>
  );
}
