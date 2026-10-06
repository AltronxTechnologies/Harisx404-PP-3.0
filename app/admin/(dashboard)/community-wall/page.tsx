import Link from "next/link";
import { ArrowUpRight, ChevronLeft, ChevronRight, Inbox, MessageSquare } from "lucide-react";
import { redirect } from "next/navigation";
import { requireAdmin } from "@/app/lib/admin-auth";
import { createSupabaseAdminClient } from "@/app/lib/supabase/server";
import { CommunityWallModerationActions } from "@/app/components/admin/CommunityWallModerationActions";
import type { CommunityWallMessageAdmin } from "@/app/community-wall/types";

const PAGE_SIZE = 12;
const statusClass = {
  pending: "border-amber-500/30 bg-amber-500/10 text-amber-200",
  published: "border-emerald-500/30 bg-emerald-500/10 text-emerald-200",
  archived: "border-border-hairline bg-surface-base text-ink-secondary",
};
function parsePage(value?: string) {
  return value && /^\d{1,4}$/.test(value) ? Math.max(Number(value), 1) : 1;
}
function date(value: string) {
  const parsed = new Date(value);
  return Number.isNaN(parsed.getTime())
    ? "Date unavailable"
    : new Intl.DateTimeFormat("en-US", {
        month: "short",
        day: "numeric",
        year: "numeric",
      }).format(parsed);
}
function Note({ note }: { note: CommunityWallMessageAdmin }) {
  return (
    <li className="min-w-0 px-4 py-5 sm:px-6">
      <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-3">
            <span aria-hidden="true" className="flex size-10 shrink-0 items-center justify-center rounded-full border border-border-hairline bg-surface-base text-sm font-semibold text-ink-primary">{note.creator_name.charAt(0).toUpperCase() || "V"}</span>
            <p className="min-w-0 break-words font-medium text-ink-primary">{note.creator_name}</p>
            <span
              className={`rounded-full border px-2.5 py-1 text-xs font-medium capitalize ${statusClass[note.status]}`}
            >
              {note.status}
            </span>
          </div>
          <blockquote className="mt-4 whitespace-pre-wrap break-words border-l-2 border-border-hairline pl-4 text-sm leading-6 text-ink-primary" style={{ overflowWrap: "anywhere" }}>
            {note.message}
          </blockquote>
          <p className="mt-3 font-mono text-xs text-ink-secondary">
            Submitted {date(note.created_at)}
            {note.moderated_at && ` · Reviewed ${date(note.moderated_at)}`}
          </p>
        </div>
        <CommunityWallModerationActions id={note.id} status={note.status} updatedAt={note.updated_at} creatorName={note.creator_name} />
      </div>
    </li>
  );
}
function Pages({
  kind,
  current,
  total,
  other,
}: {
  kind: "pending" | "reviewed";
  current: number;
  total: number;
  other: number;
}) {
  const pages = Math.max(1, Math.ceil(total / PAGE_SIZE));
  if (pages <= 1) return null;
  const href = (next: number) =>
    `/admin/community-wall?${kind}Page=${next}&${kind === "pending" ? "reviewed" : "pending"}Page=${other}`;
  return (
    <nav
      aria-label={`${kind} notes pages`}
      className="flex flex-wrap items-center justify-between gap-2 border-t border-border-hairline px-4 py-3 text-sm sm:px-6"
    >
      {current > 1 ? (
        <Link
          href={href(current - 1)}
          className="inline-flex min-h-11 items-center gap-1 rounded-xl border border-border-hairline px-3 hover:bg-surface-base focus-visible:outline focus-visible:outline-2 focus-visible:outline-current"
        >
          <ChevronLeft aria-hidden className="size-4" />Previous
        </Link>
      ) : <span className="min-h-11" />}
      <span className="text-ink-secondary" aria-live="polite">
        Page {current} of {pages} · {Math.min((current - 1) * PAGE_SIZE + 1, total)}-{Math.min(current * PAGE_SIZE, total)} of {total}
      </span>
      {current < pages ? (
        <Link
          href={href(current + 1)}
          className="inline-flex min-h-11 items-center gap-1 rounded-xl border border-border-hairline px-3 hover:bg-surface-base focus-visible:outline focus-visible:outline-2 focus-visible:outline-current"
        >
          Next<ChevronRight aria-hidden className="size-4" />
        </Link>
      ) : <span className="min-h-11" />}
    </nav>
  );
}

export default async function AdminCommunityWallPage({
  searchParams,
}: {
  searchParams: Promise<{ pendingPage?: string; reviewedPage?: string; notice?: string; cache?: string }>;
}) {
  const auth = await requireAdmin();
  if (auth.response) redirect(auth.response.status === 401 ? "/admin/login" : "/");
  const query = await searchParams;
  const pendingPage = parsePage(query.pendingPage);
  const reviewedPage = parsePage(query.reviewedPage);
  const db = await createSupabaseAdminClient();
  const [pendingCountResult, reviewedCountResult] = await Promise.all([
    db.from("messages").select("id", { count: "exact", head: true }).eq("status", "pending"),
    db.from("messages").select("id", { count: "exact", head: true }).in("status", ["published", "archived"]),
  ]);
  const pendingCount = pendingCountResult.count ?? 0;
  const reviewedCount = reviewedCountResult.count ?? 0;
  const pendingPages = Math.max(1, Math.ceil(pendingCount / PAGE_SIZE));
  const reviewedPages = Math.max(1, Math.ceil(reviewedCount / PAGE_SIZE));
  const countError = pendingCountResult.error || reviewedCountResult.error || pendingCountResult.count === null || reviewedCountResult.count === null;
  if (!countError && (pendingPage > pendingPages || reviewedPage > reviewedPages)) {
    const params = new URLSearchParams();
    if (Math.min(pendingPage, pendingPages) > 1) params.set("pendingPage", String(Math.min(pendingPage, pendingPages)));
    if (Math.min(reviewedPage, reviewedPages) > 1) params.set("reviewedPage", String(Math.min(reviewedPage, reviewedPages)));
    if (["published", "archived", "pending", "deleted"].includes(query.notice || "")) params.set("notice", query.notice!);
    if (query.cache === "stale") params.set("cache", "stale");
    redirect(params.size ? `/admin/community-wall?${params}` : "/admin/community-wall");
  }
  const [pendingResult, reviewedResult] = countError ? [null, null] : await Promise.all([
    db
      .from("messages")
      .select(
        "id, message, patternindex, user_id, creator_name, creator_avatar_url, status, moderated_at, created_at, updated_at",
      )
      .eq("status", "pending")
      .order("created_at", { ascending: true }).order("id", { ascending: true })
      .range((pendingPage - 1) * PAGE_SIZE, pendingPage * PAGE_SIZE - 1),
    db
      .from("messages")
      .select(
        "id, message, patternindex, user_id, creator_name, creator_avatar_url, status, moderated_at, created_at, updated_at",
      )
      .in("status", ["published", "archived"])
      .order("created_at", { ascending: false }).order("id", { ascending: false })
      .range((reviewedPage - 1) * PAGE_SIZE, reviewedPage * PAGE_SIZE - 1),
  ]);
  const error = countError || pendingResult?.error || reviewedResult?.error;
  const pending = (pendingResult?.data ?? []) as CommunityWallMessageAdmin[];
  const reviewed = (reviewedResult?.data ?? []) as CommunityWallMessageAdmin[];
  return (
    <div className="flex min-w-0 flex-col gap-6">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-ink-primary">Community Wall</h1>
          <p className="mt-1 text-sm text-ink-secondary">
            Review visitor notes and decide what appears on the public wall.
          </p>
        </div>
        <Link href="/community-wall" target="_blank" rel="noopener noreferrer" className="inline-flex min-h-11 items-center gap-2 rounded-xl border border-border-hairline px-4 text-sm font-medium text-ink-primary hover:bg-surface-raised focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-current">View public wall<ArrowUpRight aria-hidden className="size-4" /></Link>
      </div>
      {query.notice && ["published", "archived", "pending", "deleted"].includes(query.notice) && <p role="status" className="rounded-xl border border-emerald-500/30 bg-emerald-950/20 p-4 text-sm text-emerald-200">{query.notice === "published" ? "Note published on the Community Wall." : query.notice === "archived" ? "Note archived and hidden from the public wall." : query.notice === "pending" ? "Note returned to pending review." : "Note permanently deleted."}</p>}
      {query.cache === "stale" && <p role="alert" className="rounded-xl border border-amber-500/30 bg-amber-950/20 p-4 text-sm text-amber-200">The database change completed, but cache refresh could not be confirmed. Refresh the public wall to verify its current state.</p>}
      {error ? <div role="alert" className="rounded-2xl border border-red-500/30 bg-red-950/20 p-6 text-sm text-red-200">Community Wall notes could not be loaded. No notes are displayed. <Link prefetch={false} href={`/admin/community-wall?retry=${Date.now()}`} className="inline-flex min-h-11 items-center font-medium underline underline-offset-2">Retry loading</Link></div> : <>
      <dl className="grid gap-3 sm:grid-cols-3">
        {[["Pending review", pendingCount], ["Reviewed notes", reviewedCount], ["Total notes", pendingCount + reviewedCount]].map(([label, count]) => <div key={label} className="rounded-2xl border border-border-hairline bg-surface-raised p-4"><dt className="text-sm text-ink-secondary">{label}</dt><dd className="mt-2 text-2xl font-semibold text-ink-primary">{count}</dd></div>)}
      </dl>
      <section aria-labelledby="pending-notes-heading" className="overflow-hidden rounded-2xl border border-border-hairline bg-surface-raised shadow-sm">
        <header className="flex items-center gap-3 border-b border-border-hairline px-4 py-4 sm:px-6">
          <span className="flex size-10 items-center justify-center rounded-xl bg-amber-500/10 text-amber-200"><Inbox aria-hidden className="size-5" /></span>
          <div><h2 id="pending-notes-heading" className="font-semibold text-ink-primary">Pending review</h2><p className="text-xs text-ink-secondary">Oldest submissions first</p></div>
          <span className="ml-auto rounded-full border border-amber-500/30 bg-amber-500/10 px-3 py-1 text-xs font-semibold text-amber-200">{pendingCount}</span>
        </header>
        {pending.length ? (
          <ul className="divide-y divide-border-hairline">
            {pending.map((note) => (
              <Note key={note.id} note={note} />
            ))}
          </ul>
        ) : (
          <p className="px-4 py-8 text-sm text-ink-secondary sm:px-6">All caught up. No notes are waiting for review.</p>
        )}
        <Pages
          kind="pending"
          current={pendingPage}
          total={pendingCount}
          other={reviewedPage}
        />
      </section>
      <section aria-labelledby="reviewed-notes-heading" className="overflow-hidden rounded-2xl border border-border-hairline bg-surface-raised shadow-sm">
        <header className="flex items-center gap-3 border-b border-border-hairline px-4 py-4 sm:px-6">
          <span className="flex size-10 items-center justify-center rounded-xl bg-surface-base text-ink-secondary"><MessageSquare aria-hidden className="size-5" /></span>
          <div><h2 id="reviewed-notes-heading" className="font-semibold text-ink-primary">Reviewed notes</h2><p className="text-xs text-ink-secondary">Newest submissions first</p></div>
          <span className="ml-auto rounded-full border border-border-hairline px-3 py-1 text-xs font-medium text-ink-secondary">{reviewedCount}</span>
        </header>
        {reviewed.length ? (
          <ul className="divide-border-hairline divide-y">
            {reviewed.map((note) => (
              <Note key={note.id} note={note} />
            ))}
          </ul>
        ) : (
          <p className="px-4 py-8 text-sm text-ink-secondary sm:px-6">No reviewed notes yet. Published and archived notes will appear here.</p>
        )}
        <Pages
          kind="reviewed"
          current={reviewedPage}
          total={reviewedCount}
          other={pendingPage}
        />
      </section>
      </>}
    </div>
  );
}
