import Link from "next/link";
import { MessageSquare, Settings } from "lucide-react";
import { redirect } from "next/navigation";
import { createSupabaseAdminClient } from "@/app/lib/supabase/server";
import { CommunityWallModerationActions } from "@/app/components/admin/CommunityWallModerationActions";
import type { CommunityWallMessageAdmin } from "@/app/community-wall/types";

const PAGE_SIZE = 50;
const statusClass = {
  pending: "bg-amber-100 text-amber-800 dark:bg-amber-900/30 dark:text-amber-300",
  published: "bg-emerald-100 text-emerald-800 dark:bg-emerald-900/30 dark:text-emerald-300",
  archived: "bg-neutral-100 text-neutral-600 dark:bg-neutral-800 dark:text-neutral-300",
};
function parsePage(value?: string) { return value && /^\d{1,4}$/.test(value) ? Math.max(Number(value), 1) : 1; }
function date(value: string) { const parsed = new Date(value); return Number.isNaN(parsed.getTime()) ? "Date unavailable" : new Intl.DateTimeFormat("en-US", { month: "short", day: "numeric", year: "numeric" }).format(parsed); }
function Note({ note }: { note: CommunityWallMessageAdmin }) { return <li className="px-4 py-5 sm:px-6"><div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between"><div className="min-w-0 max-w-3xl"><div className="flex flex-wrap items-center gap-2"><p className="font-medium text-ink-primary">{note.creator_name}</p><span className={`rounded-full px-2.5 py-0.5 text-[10px] font-semibold uppercase tracking-wide ${statusClass[note.status]}`}>{note.status}</span></div><p className="mt-2 whitespace-pre-wrap text-sm leading-6 text-ink-secondary">{note.message}</p><p className="mt-2 font-mono text-[10px] uppercase tracking-wide text-ink-secondary">Submitted {date(note.created_at)}</p></div><CommunityWallModerationActions id={note.id} status={note.status} /></div></li>; }
function Pages({ kind, current, total, other }: { kind: "pending" | "reviewed"; current: number; total: number; other: number }) {
  const pages = Math.max(1, Math.ceil(total / PAGE_SIZE));
  if (pages <= 1) return null;
  const href = (next: number) => `/admin/community-wall?${kind}Page=${next}&${kind === "pending" ? "reviewed" : "pending"}Page=${other}`;
  return <nav aria-label={`${kind} notes pages`} className="flex items-center justify-end gap-2 border-t border-border-hairline px-4 py-3 text-xs sm:px-6">{current > 1 && <Link href={href(current - 1)} className="rounded-lg border border-border-hairline px-3 py-1.5">Previous</Link>}<span className="text-ink-secondary">{current} / {pages}</span>{current < pages && <Link href={href(current + 1)} className="rounded-lg border border-border-hairline px-3 py-1.5">Next</Link>}</nav>;
}

export default async function AdminCommunityWallPage({ searchParams }: { searchParams: Promise<{ pendingPage?: string; reviewedPage?: string }> }) {
  const query = await searchParams;
  const pendingPage = parsePage(query.pendingPage);
  const reviewedPage = parsePage(query.reviewedPage);
  const db = await createSupabaseAdminClient();
  const [pendingResult, reviewedResult] = await Promise.all([
    db.from("messages").select("id, message, patternindex, user_id, creator_name, creator_avatar_url, status, moderated_at, created_at, updated_at", { count: "exact" }).eq("status", "pending").order("created_at", { ascending: true }).range((pendingPage - 1) * PAGE_SIZE, pendingPage * PAGE_SIZE - 1),
    db.from("messages").select("id, message, patternindex, user_id, creator_name, creator_avatar_url, status, moderated_at, created_at, updated_at", { count: "exact" }).in("status", ["published", "archived"]).order("created_at", { ascending: false }).range((reviewedPage - 1) * PAGE_SIZE, reviewedPage * PAGE_SIZE - 1),
  ]);
  if (pendingResult.error || reviewedResult.error) throw new Error(`Unable to load Community Wall notes: ${pendingResult.error?.message || reviewedResult.error?.message}`);
  const pendingCount = pendingResult.count ?? 0, reviewedCount = reviewedResult.count ?? 0;
  const pendingPages = Math.max(1, Math.ceil(pendingCount / PAGE_SIZE)), reviewedPages = Math.max(1, Math.ceil(reviewedCount / PAGE_SIZE));
  if (pendingPage > pendingPages || reviewedPage > reviewedPages) redirect("/admin/community-wall");
  const pending = (pendingResult.data ?? []) as CommunityWallMessageAdmin[];
  const reviewed = (reviewedResult.data ?? []) as CommunityWallMessageAdmin[];
  return <div className="flex flex-col gap-6"><div className="flex flex-wrap items-center justify-between gap-4"><div><h1 className="text-2xl font-bold tracking-tight">Community Wall</h1><p className="text-sm text-ink-secondary">Review visitor notes, control publication, and remove spam.</p></div><Link href="/admin/community-wall/settings" className="inline-flex min-h-10 items-center rounded-xl border border-border-hairline bg-surface-raised px-4 text-sm font-medium text-ink-secondary hover:text-ink-primary"><Settings className="mr-2 size-4" />Page settings</Link></div><section className="overflow-hidden rounded-xl border border-amber-300/60 bg-amber-50/40 dark:border-amber-500/30 dark:bg-amber-900/10"><header className="flex items-center gap-2 border-b border-amber-300/60 px-4 py-4 dark:border-amber-500/30 sm:px-6"><MessageSquare className="size-4 text-amber-600" /><h2 className="text-sm font-semibold">Pending review</h2><span className="rounded-full bg-amber-200 px-2 py-0.5 text-xs font-semibold text-amber-900 dark:bg-amber-500/20 dark:text-amber-300">{pendingCount}</span></header>{pending.length ? <ul className="divide-y divide-amber-300/40 dark:divide-amber-500/20">{pending.map((note) => <Note key={note.id} note={note} />)}</ul> : <p className="px-4 py-6 text-sm text-ink-secondary sm:px-6">No notes are waiting for review.</p>}<Pages kind="pending" current={pendingPage} total={pendingCount} other={reviewedPage} /></section><section className="overflow-hidden rounded-xl border border-border-hairline bg-surface-raised shadow-sm"><header className="flex items-center justify-between border-b border-border-hairline px-4 py-4 sm:px-6"><h2 className="text-sm font-semibold">Reviewed notes</h2><span className="font-mono text-xs text-ink-secondary">{reviewedCount}</span></header>{reviewed.length ? <ul className="divide-y divide-border-hairline">{reviewed.map((note) => <Note key={note.id} note={note} />)}</ul> : <p className="px-4 py-6 text-sm text-ink-secondary sm:px-6">No reviewed notes yet.</p>}<Pages kind="reviewed" current={reviewedPage} total={reviewedCount} other={pendingPage} /></section></div>;
}
