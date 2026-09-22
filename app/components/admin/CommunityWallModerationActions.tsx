"use client";

import { useState } from "react";
import { Check, Loader2, RotateCcw, Trash2, XCircle } from "lucide-react";
import { useRouter } from "next/navigation";

export function CommunityWallModerationActions({ id, status }: { id: string; status: string }) {
  const router = useRouter();
  const [busy, setBusy] = useState<string | null>(null);
  const [error, setError] = useState("");

  const update = async (next: "pending" | "published" | "archived") => {
    setBusy(next);
    setError("");
    try {
      const response = await fetch("/api/admin/community-wall", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id, status: next }),
      });
      const result = await response.json();
      if (!response.ok) throw new Error(result.error || "Moderation failed.");
      router.refresh();
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : "Moderation failed.");
    } finally {
      setBusy(null);
    }
  };

  const remove = async () => {
    if (!window.confirm("Delete this Community Wall note permanently?")) return;
    setBusy("delete");
    setError("");
    try {
      const response = await fetch(`/api/admin/community-wall?id=${encodeURIComponent(id)}`, { method: "DELETE" });
      const result = await response.json();
      if (!response.ok) throw new Error(result.error || "Delete failed.");
      router.refresh();
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : "Delete failed.");
    } finally {
      setBusy(null);
    }
  };

  return (
    <div className="flex flex-col items-end gap-1.5">
      <div className="flex flex-wrap justify-end gap-2">
        {status !== "published" && <button type="button" onClick={() => update("published")} disabled={busy !== null} className="inline-flex min-h-9 items-center gap-1.5 rounded-lg bg-emerald-600 px-3 text-xs font-semibold text-white hover:bg-emerald-700 disabled:opacity-50">{busy === "published" ? <Loader2 className="size-3.5 animate-spin" /> : <Check className="size-3.5" />}Approve</button>}
        {status !== "archived" && <button type="button" onClick={() => update("archived")} disabled={busy !== null} className="inline-flex min-h-9 items-center gap-1.5 rounded-lg border border-border-hairline px-3 text-xs font-semibold text-ink-secondary hover:border-amber-400 hover:text-amber-600 disabled:opacity-50">{busy === "archived" ? <Loader2 className="size-3.5 animate-spin" /> : <XCircle className="size-3.5" />}Archive</button>}
        {status !== "pending" && <button type="button" onClick={() => update("pending")} disabled={busy !== null} aria-label="Return note to pending review" className="inline-flex size-9 items-center justify-center rounded-lg border border-border-hairline text-ink-secondary hover:text-ink-primary disabled:opacity-50">{busy === "pending" ? <Loader2 className="size-3.5 animate-spin" /> : <RotateCcw className="size-3.5" />}</button>}
        <button type="button" onClick={remove} disabled={busy !== null} aria-label="Delete Community Wall note" className="inline-flex size-9 items-center justify-center rounded-lg text-ink-secondary hover:bg-red-50 hover:text-red-500 disabled:opacity-50 dark:hover:bg-red-950/30">{busy === "delete" ? <Loader2 className="size-3.5 animate-spin" /> : <Trash2 className="size-3.5" />}</button>
      </div>
      {error && <span role="alert" className="text-xs text-red-500">{error}</span>}
    </div>
  );
}
