import { createSupabaseAdminClient } from "@/app/lib/supabase/server";
import Link from "next/link";
import { Plus, Edit, Inbox } from "lucide-react";
import { DeleteRowButton } from "@/app/components/admin/DeleteRowButton";
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

export default async function AdminTestimonialsPage() {
  // Service-role client: RLS only exposes status='published' to the
  // session/anon client, so the pending moderation queue would be
  // invisible otherwise. This page is admin-gated by middleware.
  const supabase = await createSupabaseAdminClient();
  // select("*") so the page keeps working whether or not the optional
  // email/source columns from the submissions migration exist yet.
  const { data } = await supabase
    .from("testimonials")
    .select("*")
    .order("display_order", { ascending: true })
    .order("created_at", { ascending: false });

  const testimonials = (data ?? []) as TestimonialRow[];
  const pending = testimonials.filter((t) => t.status === "pending");
  const rest = testimonials.filter((t) => t.status !== "pending");

  return (
    <div className="flex flex-col gap-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Testimonials</h1>
          <p className="text-sm text-ink-secondary">
            Review visitor submissions and manage the homepage carousel.
          </p>
        </div>
        <Link
          href="/admin/testimonials/new"
          className="inline-flex items-center justify-center rounded-xl bg-accent-signal px-4 py-2 text-sm font-medium text-white shadow hover:bg-accent-signal/90 transition-all"
        >
          <Plus className="mr-2 h-4 w-4" />
          New Testimonial
        </Link>
      </div>

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
                  <div className="min-w-0 flex-1">
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
                  <div className="flex shrink-0 items-center gap-2">
                    <TestimonialModerationActions id={t.id} />
                    <Link
                      href={`/admin/testimonials/${t.id}`}
                      className="p-2 text-ink-secondary hover:text-accent-signal hover:bg-surface-base rounded-lg transition-colors"
                      title="Edit before approving"
                    >
                      <Edit className="h-4 w-4" />
                    </Link>
                    <DeleteRowButton
                      id={t.id}
                      endpoint="/api/admin/testimonials"
                      label="testimonial"
                    />
                  </div>
                </div>
              </li>
            ))}
          </ul>
        )}
      </div>

      {/* ---------- All testimonials ---------- */}
      <div className="rounded-xl border border-border-hairline bg-surface-raised shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm text-left">
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
                          className="p-2 text-ink-secondary hover:text-accent-signal hover:bg-surface-base rounded-lg transition-colors"
                        >
                          <Edit className="h-4 w-4" />
                        </Link>
                        <DeleteRowButton
                          id={t.id}
                          endpoint="/api/admin/testimonials"
                          label="testimonial"
                        />
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
  );
}
