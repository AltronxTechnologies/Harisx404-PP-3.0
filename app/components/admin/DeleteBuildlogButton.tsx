"use client";

import { useState } from "react";
import { Loader2, Trash2 } from "lucide-react";
import { useRouter } from "next/navigation";

export function DeleteBuildlogButton({ id, name }: { id: string; name: string }) {
  const router = useRouter();
  const [isDeleting, setIsDeleting] = useState(false);
  const [error, setError] = useState("");

  const remove = async () => {
    if (!window.confirm(`Delete ${name}? This cannot be undone.`)) return;
    setIsDeleting(true);
    setError("");
    try {
      const response = await fetch(`/api/admin/buildlog?id=${encodeURIComponent(id)}`, { method: "DELETE" });
      if (!response.ok) throw new Error("Delete failed");
      router.refresh();
    } catch {
      setError("Could not delete this project.");
    } finally {
      setIsDeleting(false);
    }
  };

  return (
    <div className="inline-flex flex-col items-end">
      <button type="button" onClick={remove} disabled={isDeleting} aria-label={`Delete ${name}`} className="rounded-lg p-2 text-ink-secondary transition-colors hover:bg-red-50 hover:text-red-500 disabled:opacity-50 dark:hover:bg-red-950/30">
        {isDeleting ? <Loader2 className="size-4 animate-spin" /> : <Trash2 className="size-4" />}
      </button>
      {error && <span role="alert" className="mt-1 text-xs text-red-500">{error}</span>}
    </div>
  );
}
