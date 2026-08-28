"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Check, Loader2, XCircle } from "lucide-react";

/**
 * Approve / Reject controls for the testimonial moderation queue.
 * Approve → status 'published' (goes live, homepage revalidated).
 * Reject  → status 'archived' (kept for the record, never shown publicly).
 */
export function TestimonialModerationActions({ id }: { id: string }) {
  const router = useRouter();
  const [busy, setBusy] = useState<"approve" | "reject" | null>(null);

  const setStatus = async (
    action: "approve" | "reject",
    status: "published" | "archived",
  ) => {
    setBusy(action);
    try {
      const res = await fetch("/api/admin/testimonials", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id, status }),
      });
      if (res.ok) {
        router.refresh();
      } else {
        const body = await res.json().catch(() => null);
        alert(body?.error || `Failed to ${action} testimonial`);
      }
    } catch (err) {
      console.error(err);
      alert(`Error trying to ${action} testimonial`);
    } finally {
      setBusy(null);
    }
  };

  return (
    <div className="flex items-center gap-2">
      <button
        type="button"
        onClick={() => setStatus("approve", "published")}
        disabled={busy !== null}
        className="inline-flex items-center gap-1.5 rounded-lg bg-green-600 px-3 py-1.5 text-xs font-semibold text-white transition-colors hover:bg-green-700 disabled:opacity-50"
      >
        {busy === "approve" ? (
          <Loader2 className="h-3.5 w-3.5 animate-spin" />
        ) : (
          <Check className="h-3.5 w-3.5" />
        )}
        Approve
      </button>
      <button
        type="button"
        onClick={() => setStatus("reject", "archived")}
        disabled={busy !== null}
        className="inline-flex items-center gap-1.5 rounded-lg border border-border-hairline px-3 py-1.5 text-xs font-semibold text-ink-secondary transition-colors hover:border-red-400 hover:text-red-500 disabled:opacity-50"
      >
        {busy === "reject" ? (
          <Loader2 className="h-3.5 w-3.5 animate-spin" />
        ) : (
          <XCircle className="h-3.5 w-3.5" />
        )}
        Reject
      </button>
    </div>
  );
}
