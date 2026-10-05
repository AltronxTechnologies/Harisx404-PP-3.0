"use client";

import { useState } from "react";
import { Trash2, Loader2 } from "lucide-react";
import { useRouter } from "next/navigation";
import { AdminConfirmDialog } from "./AdminConfirmDialog";

export function DeleteProjectButton({ id, name, slug, updatedAt }: { id: string; name: string; slug: string; updatedAt: string }) {
  const [isDeleting, setIsDeleting] = useState(false);
  const [confirming, setConfirming] = useState(false);
  const [error, setError] = useState("");
  const router = useRouter();

  const handleDelete = async (typed: string) => {
    if (isDeleting || typed !== slug) return;
    setIsDeleting(true);
    setError("");
    try {
      const query = new URLSearchParams({ id, updated_at: updatedAt });
      const res = await fetch(`/api/admin/projects?${query}`, {
        method: "DELETE",
      });
      if (res.ok) {
        setConfirming(false);
        router.refresh();
      } else {
        const result = await res.json();
        setError(result.error || "Could not delete project. Try again.");
        setConfirming(false);
      }
    } catch {
      setError("Could not delete project. Try again.");
      setConfirming(false);
    } finally {
      setIsDeleting(false);
    }
  };

  return (
    <>
    {error && <span role="alert" className="max-w-52 text-left text-xs text-red-300">{error}</span>}
    <button type="button"
      onClick={() => setConfirming(true)}
      disabled={isDeleting}
      className="inline-flex size-11 items-center justify-center rounded-lg text-ink-secondary transition-colors hover:bg-red-50 hover:text-red-600 focus-visible:outline focus-visible:outline-2 focus-visible:outline-current disabled:opacity-50 dark:hover:bg-red-950/30"
      aria-label={`Delete ${name}`}
    >
      {isDeleting ? <Loader2 className="h-4 w-4 animate-spin" /> : <Trash2 className="h-4 w-4" />}
    </button>
    <AdminConfirmDialog open={confirming} title="Permanently delete project?" description={`This removes “${name}” and its project relationships. Shared media-library files are not deleted.`} confirmLabel="Delete project" confirmText={slug} destructive pending={isDeleting} onClose={() => setConfirming(false)} onConfirm={(value) => void handleDelete(value)} />
    </>
  );
}
