"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { ArrowDown, ArrowUp } from "lucide-react";
import { readAdminResponse } from "@/app/lib/admin/read-admin-response";
import { AdminConfirmDialog } from "./AdminConfirmDialog";
import { useAdminNavigationGuard } from "./useAdminNavigationGuard";

type ProjectOption = {
  id: string;
  title: string;
  status: string;
  index_order?: number | null;
  updated_at: string;
};

export function ProjectIndexOrderManager({ projects }: { projects: ProjectOption[] }) {
  const router = useRouter();
  const published = projects.filter((project) => project.status === "published")
    .sort((a, b) => (a.index_order ?? 0) - (b.index_order ?? 0) || a.id.localeCompare(b.id));
  const initialIds = published.map((project) => project.id);
  const [ids, setIds] = useState(initialIds);
  const [savedIds, setSavedIds] = useState(initialIds);
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState("");
  const [hasError, setHasError] = useState(false);
  const [listMaxHeight, setListMaxHeight] = useState<number>();
  const listRef = useRef<HTMLOListElement>(null);
  const byId = new Map(published.map((project) => [project.id, project]));
  const changed = ids.join(",") !== savedIds.join(",");
  const { leaveTarget, setLeaveTarget, confirmLeave } = useAdminNavigationGuard(changed || busy);

  useEffect(() => {
    if (!changed && !busy) return;
    const warn = (event: BeforeUnloadEvent) => { event.preventDefault(); event.returnValue = ""; };
    window.addEventListener("beforeunload", warn);
    return () => window.removeEventListener("beforeunload", warn);
  }, [changed, busy]);

  useEffect(() => {
    const list = listRef.current;
    if (!list || ids.length <= 5) { setListMaxHeight(undefined); return; }
    const rows = Array.from(list.children).slice(0, 5) as HTMLElement[];
    const measure = () => {
      const first = rows[0].getBoundingClientRect();
      const fifth = rows[4].getBoundingClientRect();
      if (fifth.bottom > first.top) setListMaxHeight(Math.ceil(fifth.bottom - first.top));
    };
    measure();
    const observer = new ResizeObserver(measure);
    rows.forEach((row) => observer.observe(row));
    return () => observer.disconnect();
  }, [ids]);

  const move = (position: number, nextPosition: number) => {
    const next = [...ids];
    [next[position], next[nextPosition]] = [next[nextPosition], next[position]];
    setIds(next);
    setMessage("");
    setHasError(false);
  };

  const save = async () => {
    if (!changed || busy) return;
    setBusy(true);
    setMessage("");
    setHasError(false);
    try {
      const response = await fetch("/api/admin/projects/order", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ids, expected: projects.map(({ id, updated_at }) => ({ id, updated_at })) }),
      });
      const result = await readAdminResponse(response, "Project order");
      if (!response.ok || result.success !== true) throw new Error(result.error || "Order could not be confirmed. Reload before retrying.");
      setSavedIds([...ids]);
      setMessage(result.warning || "Projects page order saved.");
      router.refresh();
    } catch (error) {
      setHasError(true);
      setMessage(error instanceof Error ? error.message : "Order could not be confirmed. Reload before retrying.");
    } finally {
      setBusy(false);
    }
  };

  return <section aria-labelledby="project-index-order-heading" className="space-y-4 rounded-xl border border-border-hairline bg-surface-raised p-4 sm:p-5">
    <AdminConfirmDialog open={Boolean(leaveTarget)} title="Leave without saving?" description="Your Projects page order has unsaved changes." confirmLabel="Discard and leave" onClose={() => setLeaveTarget(null)} onConfirm={() => confirmLeave((destination) => router.push(destination))} pending={busy} />
    <div>
      <h2 id="project-index-order-heading" className="text-lg font-semibold text-ink-primary">Projects page order</h2>
      <p className="mt-1 text-sm text-ink-secondary">Arrange published projects on the Projects page. New projects appear first automatically. This does not change Featured on Home.</p>
    </div>
    {published.length ? <ol ref={listRef} aria-label="Projects page order list" tabIndex={0} style={listMaxHeight ? { maxHeight: listMaxHeight } : undefined} className="space-y-2 overflow-y-auto pr-1">{ids.map((id, position) => {
      const project = byId.get(id);
      return <li key={id} className="flex min-w-0 items-center gap-3 rounded-xl border border-border-hairline bg-surface-base p-3">
        <span className="flex size-9 shrink-0 items-center justify-center rounded-lg border border-border-hairline font-mono text-xs text-ink-primary" aria-label={`Projects page position ${position + 1}`}>{position + 1}</span>
        <span className="min-w-0 flex-1 break-words text-sm font-medium text-ink-primary">{project?.title || "Project no longer available"}</span>
        <div className="flex shrink-0 items-center gap-1">
          <button type="button" disabled={busy || position === 0} onClick={() => move(position, position - 1)} aria-label={`Move ${project?.title} up on Projects page`} className="inline-flex size-11 items-center justify-center rounded-lg text-ink-secondary hover:bg-surface-raised focus-visible:outline focus-visible:outline-2 focus-visible:outline-current disabled:opacity-40"><ArrowUp className="size-4" aria-hidden /></button>
          <button type="button" disabled={busy || position === ids.length - 1} onClick={() => move(position, position + 1)} aria-label={`Move ${project?.title} down on Projects page`} className="inline-flex size-11 items-center justify-center rounded-lg text-ink-secondary hover:bg-surface-raised focus-visible:outline focus-visible:outline-2 focus-visible:outline-current disabled:opacity-40"><ArrowDown className="size-4" aria-hidden /></button>
        </div>
      </li>;
    })}</ol> : <p className="text-sm text-ink-secondary">Publish a project to arrange the Projects page.</p>}
    {message && <p role={hasError ? "alert" : "status"} className="text-sm text-ink-secondary">{message}</p>}
    <div className="flex flex-wrap justify-end gap-2">
      {changed && <button type="button" disabled={busy} onClick={() => { setIds([...savedIds]); setMessage(""); setHasError(false); }} className="min-h-11 rounded-xl border border-border-hairline px-4 text-sm text-ink-secondary hover:bg-surface-base disabled:opacity-40">Discard changes</button>}
      <button type="button" disabled={!changed || busy} onClick={() => void save()} className="min-h-11 rounded-xl bg-accent-signal px-5 text-sm font-medium text-white hover:bg-accent-signal/90 disabled:opacity-40">{busy ? "Saving..." : "Save Projects order"}</button>
    </div>
  </section>;
}
