"use client";

import { useState } from "react";
import { Trash2, Loader2 } from "lucide-react";
import { useRouter } from "next/navigation";

export function DeleteChangelogButton({ id, name }: { id: string; name: string }) {
  const [isDeleting, setIsDeleting] = useState(false);
  const [error, setError] = useState("");
  const router = useRouter();

  const handleDelete = async () => {
    if (!window.confirm(`Permanently delete ${name}? This cannot be undone.`)) return;
    setError("");
    setIsDeleting(true);
    try {
      const res = await fetch(`/api/admin/changelogs?id=${id}`, {
        method: "DELETE",
      });
      if (res.ok) {
        router.refresh();
      } else setError("Could not delete this changelog. Reload and try again.");
    } catch {
      setError("Could not delete this changelog. Reload and try again.");
    } finally {
      setIsDeleting(false);
    }
  };

  return (
    <div className="inline-flex flex-col items-end">
      <button
        type="button"
        onClick={handleDelete}
        disabled={isDeleting}
        className="inline-flex size-11 items-center justify-center rounded-lg text-ink-secondary transition-colors hover:bg-red-50 hover:text-red-600 focus-visible:outline focus-visible:outline-2 focus-visible:outline-current disabled:opacity-50 dark:hover:bg-red-950/30"
        aria-label={`Delete ${name}`}
      >
        {isDeleting ? <Loader2 className="h-4 w-4 animate-spin" /> : <Trash2 className="h-4 w-4" />}
      </button>
      {error && <span role="alert" className="mt-1 text-xs text-red-700 dark:text-red-400">{error}</span>}
    </div>
  );
}
