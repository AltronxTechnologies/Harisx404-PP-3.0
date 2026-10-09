"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { ArrowDown, ArrowUp, Plus, X } from "lucide-react";
import { readAdminResponse } from "@/app/lib/admin/read-admin-response";

export type FeaturedProjectOption = {
  id: string;
  title: string;
  slug: string;
  status: string;
  featured: boolean;
  display_order: number | null;
  updated_at: string;
};

export function FeaturedProjectsManager({ projects }: { projects: FeaturedProjectOption[] }) {
  const router = useRouter();
  const initialIds = projects.filter((project) => project.status === "published" && project.featured)
    .sort((a, b) => (a.display_order ?? 0) - (b.display_order ?? 0) || a.id.localeCompare(b.id))
    .map((project) => project.id);
  const [selectedIds, setSelectedIds] = useState(initialIds);
  const [savedIds, setSavedIds] = useState(initialIds);
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState("");
  const [hasError, setHasError] = useState(false);
  const byId = new Map(projects.map((project) => [project.id, project]));
  const available = projects.filter((project) => project.status === "published" && !selectedIds.includes(project.id))
    .sort((a, b) => a.title.localeCompare(b.title));
  const changed = selectedIds.join(",") !== savedIds.join(",");

  const move = (index: number, nextIndex: number) => {
    const next = [...selectedIds];
    [next[index], next[nextIndex]] = [next[nextIndex], next[index]];
    setSelectedIds(next);
    setMessage("");
    setHasError(false);
  };

  const save = async () => {
    if (!changed || busy) return;
    setBusy(true);
    setMessage("");
    setHasError(false);
    try {
      const response = await fetch("/api/admin/projects/featured", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ids: selectedIds,
          expected: projects.map(({ id, updated_at }) => ({ id, updated_at })),
        }),
      });
      const result = await readAdminResponse(response, "Featured projects");
      if (!response.ok || result.success !== true) throw new Error(result.error || "Selection could not be confirmed. Refresh before retrying.");
      setSavedIds([...selectedIds]);
      setMessage(result.warning || "Home selection saved.");
      router.refresh();
    } catch (error) {
      setHasError(true);
      setMessage(error instanceof Error ? error.message : "Selection could not be confirmed. Refresh before retrying.");
    } finally {
      setBusy(false);
    }
  };

  return <section aria-labelledby="featured-projects-heading" className="space-y-4 rounded-xl border border-border-hairline bg-surface-raised p-4 sm:p-5">
    <div>
      <h2 id="featured-projects-heading" className="text-lg font-semibold text-ink-primary">Featured on Home</h2>
      <p className="mt-1 text-sm text-ink-secondary">Choose published projects and set their order on Home. No projects appear there until you select them.</p>
    </div>
    <p className="text-xs text-ink-secondary">{selectedIds.length} selected{changed ? " (unsaved changes)" : ""}</p>
    {selectedIds.length === 0 ? <p className="rounded-xl border border-dashed border-border-hairline p-4 text-sm text-ink-secondary">No featured projects selected.</p> :
      <ol className="space-y-2">{selectedIds.map((id, index) => {
        const project = byId.get(id);
        return <li key={id} className="flex min-w-0 flex-wrap items-center gap-3 rounded-xl border border-border-hairline bg-surface-base p-3">
          <span className="flex size-9 shrink-0 items-center justify-center rounded-lg border border-border-hairline font-mono text-xs text-ink-primary" aria-label={`Home position ${index + 1}`}>{index + 1}</span>
          <span className="min-w-0 flex-1 break-words text-sm font-medium text-ink-primary">{project?.title || "Project no longer available"}</span>
          <div className="flex items-center gap-1">
            <button type="button" disabled={busy || index === 0} onClick={() => move(index, index - 1)} aria-label={`Move ${project?.title} up`} className="inline-flex size-11 items-center justify-center rounded-lg text-ink-secondary hover:bg-surface-raised focus-visible:outline focus-visible:outline-2 focus-visible:outline-current disabled:opacity-40"><ArrowUp className="size-4" aria-hidden /></button>
            <button type="button" disabled={busy || index === selectedIds.length - 1} onClick={() => move(index, index + 1)} aria-label={`Move ${project?.title} down`} className="inline-flex size-11 items-center justify-center rounded-lg text-ink-secondary hover:bg-surface-raised focus-visible:outline focus-visible:outline-2 focus-visible:outline-current disabled:opacity-40"><ArrowDown className="size-4" aria-hidden /></button>
            <button type="button" disabled={busy} onClick={() => { setSelectedIds((ids) => ids.filter((value) => value !== id)); setMessage(""); setHasError(false); }} aria-label={`Remove ${project?.title} from Home`} className="inline-flex size-11 items-center justify-center rounded-lg text-red-300 hover:bg-red-950/30 focus-visible:outline focus-visible:outline-2 focus-visible:outline-current disabled:opacity-40"><X className="size-4" aria-hidden /></button>
          </div>
        </li>;
      })}</ol>}
    {available.length > 0 && <div className="space-y-2 border-t border-border-hairline pt-4">
      <h3 className="text-sm font-medium text-ink-primary">Available published projects</h3>
      <div className="grid gap-2 sm:grid-cols-2">{available.map((project) => <button key={project.id} type="button" disabled={busy} onClick={() => { setSelectedIds((ids) => [...ids, project.id]); setMessage(""); setHasError(false); }} className="flex min-h-11 min-w-0 items-center gap-2 rounded-xl border border-border-hairline px-3 text-left text-sm text-ink-primary hover:bg-surface-base focus-visible:outline focus-visible:outline-2 focus-visible:outline-current disabled:opacity-40"><Plus className="size-4 shrink-0" aria-hidden /><span className="min-w-0 break-words">{project.title}</span></button>)}</div>
    </div>}
    {projects.length > 0 && projects.every((project) => project.status !== "published") && <p className="text-sm text-ink-secondary">Publish a project before adding it to Home.</p>}
    {message && <p role={hasError ? "alert" : "status"} className="text-sm text-ink-secondary">{message}</p>}
    <div className="flex flex-wrap justify-end gap-2">
      {changed && <button type="button" disabled={busy} onClick={() => { setSelectedIds([...savedIds]); setMessage(""); setHasError(false); }} className="min-h-11 rounded-xl border border-border-hairline px-4 text-sm text-ink-secondary hover:bg-surface-base disabled:opacity-40">Discard changes</button>}
      <button type="button" disabled={!changed || busy} onClick={() => void save()} className="min-h-11 rounded-xl bg-accent-signal px-5 text-sm font-medium text-white hover:bg-accent-signal/90 disabled:opacity-40">{busy ? "Saving..." : "Save Home selection"}</button>
    </div>
  </section>;
}
