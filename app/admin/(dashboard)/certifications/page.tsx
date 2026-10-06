import Link from "next/link";
import { redirect } from "next/navigation";
import { ArrowUpRight, ChevronLeft, ChevronRight, Edit, Plus } from "lucide-react";
import { requireAdmin } from "@/app/lib/admin-auth";
import { createSupabaseAdminClient } from "@/app/lib/supabase/server";
import { DeleteCertificationButton } from "@/app/components/admin/DeleteCertificationButton";

const PAGE_SIZE = 12;
type CertificationRow = {
  id: string;
  title: string;
  issuer: string | null;
  issue_date: string | null;
  category: string | null;
  is_demo: boolean;
  status: string;
  display_order: number;
};

const badge = (status: string) => status === "published"
  ? "border-emerald-500/30 bg-emerald-500/10 text-emerald-200"
  : status === "archived"
    ? "border-border-hairline bg-surface-base text-ink-secondary"
    : "border-amber-500/30 bg-amber-500/10 text-amber-200";

export default async function AdminCertificationsPage({ searchParams }: { searchParams: Promise<{ page?: string; notice?: string; cache?: string }> }) {
  const auth = await requireAdmin();
  if (auth.response) redirect(auth.response.status === 401 ? "/admin/login" : "/");
  const params = await searchParams;
  const page = typeof params.page === "string" && /^[1-9]\d{0,3}$/.test(params.page) ? Number(params.page) : 1;
  const href = (target: number) => target === 1 ? "/admin/certifications" : `/admin/certifications?page=${target}`;
  const db = await createSupabaseAdminClient();
  const { count, error: countError } = await db.from("certifications").select("id", { count: "exact", head: true });
  const pages = Math.max(1, Math.ceil((count ?? 0) / PAGE_SIZE));
  if (!countError && count !== null && page > pages) {
    const query = new URLSearchParams();
    if (pages > 1) query.set("page", String(pages));
    if (["saved", "deleted"].includes(params.notice || "")) query.set("notice", params.notice!);
    if (params.cache === "stale") query.set("cache", "stale");
    redirect(query.size ? `/admin/certifications?${query}` : "/admin/certifications");
  }
  const { data, error: listError } = countError || count === null
    ? { data: null, error: countError }
    : await db.from("certifications").select("id, title, issuer, issue_date, category, is_demo, status, display_order")
      .order("display_order", { ascending: true }).order("id").range((page - 1) * PAGE_SIZE, page * PAGE_SIZE - 1);
  const error = countError || count === null || listError;
  const entries = (data ?? []) as CertificationRow[];

  return <div className="flex min-w-0 flex-col gap-6">
    <div className="flex flex-wrap items-center justify-between gap-4">
      <div><h1 className="text-2xl font-bold tracking-tight text-ink-primary">Certifications</h1><p className="mt-1 text-sm text-ink-secondary">Manage credentials shown on the public Credentials page.</p></div>
      <div className="flex flex-wrap gap-2">
        <Link href="/credentials" target="_blank" rel="noopener noreferrer" className="inline-flex min-h-11 items-center gap-2 rounded-xl border border-border-hairline px-4 text-sm font-medium text-ink-primary hover:bg-surface-raised focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-current">View Credentials<ArrowUpRight aria-hidden className="size-4" /></Link>
        <Link href="/admin/certifications/new" className="inline-flex min-h-11 items-center gap-2 rounded-xl bg-accent-signal px-4 text-sm font-medium text-white hover:opacity-90 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-white"><Plus aria-hidden className="size-4" />New certification</Link>
      </div>
    </div>
    {params.notice === "saved" && <p role="status" className="rounded-xl border border-emerald-500/30 bg-emerald-950/20 p-4 text-sm text-emerald-200">Certification saved.</p>}
    {params.notice === "deleted" && <p role="status" className="rounded-xl border border-emerald-500/30 bg-emerald-950/20 p-4 text-sm text-emerald-200">Certification deleted.</p>}
    {params.cache === "stale" && <p role="alert" className="rounded-xl border border-amber-500/30 bg-amber-950/20 p-4 text-sm text-amber-200">The database changed, but public Credentials cache refresh could not be confirmed. Visitors may temporarily see the previous version.</p>}
    {error ? <p role="alert" className="rounded-2xl border border-red-500/30 bg-red-950/20 p-5 text-sm text-red-200">Certifications could not be loaded. No entries are displayed. <Link prefetch={false} href={`/admin/certifications?retry=${Date.now()}`} className="inline-flex min-h-11 items-center font-medium underline underline-offset-2">Retry loading</Link></p> : <>
      <p role="status" className="text-sm text-ink-secondary">{count === 0 ? "Showing 0 credentials" : `Showing ${(page - 1) * PAGE_SIZE + 1}-${(page - 1) * PAGE_SIZE + entries.length} of ${count} credentials`}</p>
      <div className="grid min-w-0 gap-3 xl:hidden">
        {!entries.length ? <p className="rounded-2xl border border-border-hairline bg-surface-raised p-5 text-sm text-ink-secondary">No certifications yet. Add a credential to start the collection.</p> : entries.map((entry) => <article key={entry.id} className="min-w-0 rounded-2xl border border-border-hairline bg-surface-raised p-4 shadow-sm">
          <div className="flex min-w-0 flex-wrap items-start justify-between gap-3"><div className="min-w-0 flex-1"><h2 className="break-words font-semibold text-ink-primary" style={{ overflowWrap: "anywhere" }}>{entry.title}</h2><p className="mt-1 break-words text-sm text-ink-secondary">{entry.issuer || "Issuer not set"}</p></div><span className={`shrink-0 rounded-full border px-2.5 py-1 text-xs font-medium capitalize ${badge(entry.status)}`}>{entry.status}</span></div>
          <dl className="mt-4 grid grid-cols-2 gap-3 border-t border-border-hairline pt-3 text-sm"><div><dt className="text-xs text-ink-secondary">Category</dt><dd className="mt-1 text-ink-primary">{entry.category || "Other"}</dd></div><div><dt className="text-xs text-ink-secondary">Issue date</dt><dd className="mt-1 text-ink-primary">{entry.issue_date || "Not set"}</dd></div><div><dt className="text-xs text-ink-secondary">Order</dt><dd className="mt-1 text-ink-primary">{entry.display_order}</dd></div>{entry.is_demo && <div><dt className="text-xs text-ink-secondary">Type</dt><dd className="mt-1 text-amber-200">Demo</dd></div>}</dl>
          <div className="mt-3 flex justify-end gap-2 border-t border-border-hairline pt-3"><Link href={`/admin/certifications/${entry.id}`} aria-label={`Edit ${entry.title}`} className="inline-flex size-11 items-center justify-center rounded-xl text-ink-secondary hover:bg-surface-base hover:text-accent-signal focus-visible:outline focus-visible:outline-offset-2 focus-visible:outline-current"><Edit aria-hidden className="size-4" /></Link><DeleteCertificationButton id={entry.id} title={entry.title} /></div>
        </article>)}
      </div>
      <div className="hidden overflow-hidden rounded-xl border border-border-hairline bg-surface-raised shadow-sm xl:block">
        <div className="overflow-x-auto" role="region" aria-label="Certifications table" tabIndex={0}>
          <table className="admin-action-table w-full text-left text-sm"><thead className="border-b border-border-hairline bg-surface-base text-ink-secondary"><tr><th scope="col" className="px-6 py-4 font-medium">Credential</th><th scope="col" className="px-6 py-4 font-medium">Issued</th><th scope="col" className="px-6 py-4 font-medium">Category</th><th scope="col" className="px-6 py-4 font-medium">Status</th><th scope="col" className="px-6 py-4 font-medium">Order</th><th scope="col" className="px-6 py-4 text-right font-medium">Actions</th></tr></thead>
            <tbody className="divide-y divide-border-hairline">{!entries.length ? <tr><td colSpan={6} className="px-6 py-8 text-center text-ink-secondary">No certifications yet. Add a credential to start the collection.</td></tr> : entries.map((entry) => <tr key={entry.id} className="hover:bg-surface-base/50"><td className="px-6 py-4 font-medium text-ink-primary">{entry.title}<p className="mt-1 text-xs font-normal text-ink-secondary">{entry.issuer}</p>{entry.is_demo && <span className="mt-1 inline-flex rounded-full border border-amber-500/30 bg-amber-500/10 px-2 py-0.5 text-xs text-amber-200">Demo</span>}</td><td className="px-6 py-4 text-ink-secondary">{entry.issue_date || "Not set"}</td><td className="px-6 py-4 text-ink-secondary">{entry.category || "Other"}</td><td className="px-6 py-4"><span className={`rounded-full border px-2.5 py-1 text-xs font-medium capitalize ${badge(entry.status)}`}>{entry.status}</span></td><td className="px-6 py-4 text-ink-secondary">{entry.display_order}</td><td className="px-6 py-4"><div className="flex justify-end gap-2"><Link href={`/admin/certifications/${entry.id}`} aria-label={`Edit ${entry.title}`} className="inline-flex size-11 items-center justify-center rounded-xl text-ink-secondary hover:bg-surface-base hover:text-accent-signal focus-visible:outline focus-visible:outline-offset-2 focus-visible:outline-current"><Edit aria-hidden className="size-4" /></Link><DeleteCertificationButton id={entry.id} title={entry.title} /></div></td></tr>)}</tbody>
          </table>
        </div>
      </div>
      {pages > 1 && <nav aria-label="Certification pages" className="flex items-center justify-between gap-3 text-sm"><span>{page > 1 ? <Link href={href(page - 1)} className="inline-flex min-h-11 items-center gap-1 rounded-xl px-3 hover:bg-surface-raised"><ChevronLeft aria-hidden className="size-4" />Previous</Link> : <span className="inline-flex min-h-11 items-center px-3 text-ink-secondary">Previous</span>}</span><span>Page {page} of {pages}</span><span>{page < pages ? <Link href={href(page + 1)} className="inline-flex min-h-11 items-center gap-1 rounded-xl px-3 hover:bg-surface-raised">Next<ChevronRight aria-hidden className="size-4" /></Link> : <span className="inline-flex min-h-11 items-center px-3 text-ink-secondary">Next</span>}</span></nav>}
    </>}
  </div>;
}
