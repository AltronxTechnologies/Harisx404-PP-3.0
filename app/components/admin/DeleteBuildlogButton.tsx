"use client";

import { useState } from "react";
import { Loader2, Trash2 } from "lucide-react";
import { useRouter } from "next/navigation";
import { AdminConfirmDialog } from "./AdminConfirmDialog";

export function DeleteBuildlogButton({ id, name, updatedAt }: { id: string; name: string; updatedAt: string }) {
  const router = useRouter();
  const [isDeleting, setIsDeleting] = useState(false);
  const [error, setError] = useState("");
  const [confirming, setConfirming] = useState(false);

  const remove = async (typed: string) => {
    if (isDeleting || typed !== name) return;
    setIsDeleting(true);
    setError("");
    try {
      const query = new URLSearchParams({ id, updated_at: updatedAt });
      const response = await fetch(`/api/admin/buildlog?${query}`, { method: "DELETE" });
      const body = await response.json();
      if (!response.ok) throw new Error(body.error || "Could not delete this project.");
      setConfirming(false);
      const url = new URL(window.location.href);
      url.searchParams.set("notice", "deleted");
      if (body.warning) url.searchParams.set("cache", "stale");
      else url.searchParams.delete("cache");
      router.replace(`${url.pathname}${url.search}`);
      router.refresh();
    } catch (error) {
      setConfirming(false);
      setError(error instanceof Error ? error.message : "Could not delete this project.");
    } finally {
      setIsDeleting(false);
    }
  };

  return (
    <div className="inline-flex flex-col items-end">
      <button type="button" onClick={() => setConfirming(true)} disabled={isDeleting} aria-label={`Delete ${name}`} className="inline-flex size-11 items-center justify-center rounded-lg text-ink-secondary transition-colors hover:bg-red-50 hover:text-red-500 focus-visible:outline focus-visible:outline-2 focus-visible:outline-current disabled:opacity-50 dark:hover:bg-red-950/30">
        {isDeleting ? <Loader2 className="size-4 animate-spin" /> : <Trash2 className="size-4" />}
      </button>
      {error && <span role="alert" className="mt-1 text-xs text-red-500">{error}</span>}
      <AdminConfirmDialog open={confirming} title="Permanently delete Buildlog project?" description={`This removes “${name}” and its release items. This cannot be undone.`} confirmLabel="Delete project" confirmText={name} destructive pending={isDeleting} onClose={() => setConfirming(false)} onConfirm={(value) => void remove(value)} />
    </div>
  );
}
