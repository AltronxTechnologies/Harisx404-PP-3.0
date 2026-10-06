"use client";

import { useState } from "react";
import { Check, Loader2, RotateCcw, Trash2, Archive } from "lucide-react";
import { useRouter } from "next/navigation";
import { readAdminResponse } from "@/app/lib/admin/read-admin-response";
import { AdminConfirmDialog } from "./AdminConfirmDialog";

type Decision = "pending" | "published" | "archived" | "delete";

export function CommunityWallModerationActions({ id, status, updatedAt, creatorName }: { id: string; status: "pending" | "published" | "archived"; updatedAt: string; creatorName: string }) {
  const router = useRouter();
  const [busy, setBusy] = useState(false);
  const [confirming, setConfirming] = useState<Decision | null>(null);
  const [error, setError] = useState("");

  const perform = async (decision: Decision, typed: string) => {
    if (busy || (decision === "delete" && typed !== "DELETE")) return;
    setBusy(true);
    setError("");
    try {
      const response = decision === "delete"
        ? await fetch(`/api/admin/community-wall?${new URLSearchParams({ id, updated_at: updatedAt })}`, { method: "DELETE" })
        : await fetch("/api/admin/community-wall", {
            method: "PATCH",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ id, status: decision, updated_at: updatedAt }),
          });
      const result = await readAdminResponse(response, "Community Wall moderation");
      if (!response.ok) throw new Error(result.error || "Moderation could not be completed. Refresh this note before retrying.");
      setConfirming(null);
      const url = new URL(window.location.href);
      url.searchParams.set("notice", decision === "delete" ? "deleted" : decision);
      if (result.warning) url.searchParams.set("cache", "stale");
      else url.searchParams.delete("cache");
      router.replace(`${url.pathname}${url.search}`);
      router.refresh();
    } catch (cause) {
      setConfirming(null);
      setError(cause instanceof Error ? cause.message : "Moderation could not be completed. Refresh the note before retrying.");
    } finally {
      setBusy(false);
    }
  };

  const labels: Record<Decision, { title: string; description: string; button: string }> = {
    published: { title: "Publish Community Wall note?", description: `The note from ${creatorName} will be visible on the public wall.`, button: "Publish note" },
    archived: { title: "Archive Community Wall note?", description: `The note from ${creatorName} will be hidden from the public wall but kept in Admin.`, button: "Archive note" },
    pending: { title: "Return note to review?", description: `The note from ${creatorName} will be hidden from the public wall until reviewed again.`, button: "Return to review" },
    delete: { title: "Permanently delete Community Wall note?", description: `The note from ${creatorName} and its record will be removed. This cannot be undone.`, button: "Delete permanently" },
  };

  return (
    <div className="flex min-w-0 flex-col items-start gap-2 lg:items-end">
      <div className="flex flex-wrap gap-2 lg:justify-end">
        {status !== "published" && <button type="button" onClick={() => setConfirming("published")} disabled={busy} className="inline-flex min-h-11 items-center gap-2 rounded-xl bg-accent-signal px-4 text-sm font-medium text-white hover:opacity-90 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-white disabled:opacity-50"><Check aria-hidden className="size-4" />Publish</button>}
        {status !== "archived" && <button type="button" onClick={() => setConfirming("archived")} disabled={busy} className="inline-flex min-h-11 items-center gap-2 rounded-xl border border-border-hairline px-4 text-sm font-medium text-ink-primary hover:bg-surface-base focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-white disabled:opacity-50"><Archive aria-hidden className="size-4" />Archive</button>}
        {status !== "pending" && <button type="button" onClick={() => setConfirming("pending")} disabled={busy} aria-label={`Return ${creatorName}'s note to pending review`} className="inline-flex size-11 items-center justify-center rounded-xl border border-border-hairline text-ink-secondary hover:bg-surface-base hover:text-ink-primary focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-white disabled:opacity-50"><RotateCcw aria-hidden className="size-4" /></button>}
        <button type="button" onClick={() => setConfirming("delete")} disabled={busy} aria-label={`Delete ${creatorName}'s Community Wall note`} className="inline-flex size-11 items-center justify-center rounded-xl border border-border-hairline text-red-300 hover:bg-red-950/30 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-white disabled:opacity-50">{busy ? <Loader2 aria-hidden className="size-4 animate-spin" /> : <Trash2 aria-hidden className="size-4" />}</button>
      </div>
      {error && <p role="alert" className="max-w-md break-words text-sm text-red-300">{error} <button type="button" onClick={() => router.refresh()} className="min-h-11 font-medium underline underline-offset-2">Refresh list</button></p>}
      <AdminConfirmDialog open={confirming !== null} title={labels[confirming ?? "delete"].title} description={labels[confirming ?? "delete"].description} confirmLabel={labels[confirming ?? "delete"].button} confirmText={confirming === "delete" ? "DELETE" : undefined} destructive={confirming === "delete"} pending={busy} onClose={() => setConfirming(null)} onConfirm={(typed) => { if (confirming) void perform(confirming, typed); }} />
    </div>
  );
}
