"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Check, Archive } from "lucide-react";
import { readAdminResponse } from "@/app/lib/admin/read-admin-response";
import { AdminConfirmDialog } from "./AdminConfirmDialog";

export function TestimonialModerationActions({ id }: { id: string }) {
  const router = useRouter();
  const [busy, setBusy] = useState(false);
  const [confirming, setConfirming] = useState<"published" | "archived" | null>(null);
  const [error, setError] = useState("");

  const setStatus = async (status: "published" | "archived") => {
    if (busy) return;
    setBusy(true);
    setError("");
    try {
      const response = await fetch("/api/admin/testimonials", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id, status }),
      });
      const result = await readAdminResponse(response, "Testimonial moderation");
      if (!response.ok) throw new Error(result.error || "Could not moderate this testimonial.");
      if (result.data?.id !== id) throw new Error("Moderation could not be confirmed. Refresh the list before retrying.");
      setConfirming(null);
      const url = new URL(window.location.href);
      url.searchParams.set("notice", status === "published" ? "published" : "archived");
      if (result.warning) url.searchParams.set("cache", "stale");
      else url.searchParams.delete("cache");
      router.replace(`${url.pathname}${url.search}`);
      router.refresh();
    } catch (cause) {
      setConfirming(null);
      setError(cause instanceof Error ? cause.message : "Could not moderate this testimonial.");
    } finally {
      setBusy(false);
    }
  };

  return <div className="flex min-w-0 flex-col gap-2">
    <div className="flex flex-wrap gap-2">
      <button type="button" onClick={() => setConfirming("published")} disabled={busy} className="inline-flex min-h-11 items-center gap-2 rounded-xl bg-accent-signal px-4 text-sm font-medium text-white hover:opacity-90 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-white disabled:opacity-50"><Check aria-hidden className="size-4" />Approve</button>
      <button type="button" onClick={() => setConfirming("archived")} disabled={busy} className="inline-flex min-h-11 items-center gap-2 rounded-xl border border-border-hairline px-4 text-sm font-medium text-ink-primary hover:bg-surface-base focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-white disabled:opacity-50"><Archive aria-hidden className="size-4" />Reject</button>
    </div>
    {error && <p role="alert" className="max-w-sm break-words text-sm text-red-300">{error} <button type="button" onClick={() => router.refresh()} className="min-h-11 font-medium underline underline-offset-2">Refresh list</button></p>}
    <AdminConfirmDialog open={confirming !== null} title={confirming === "archived" ? "Reject testimonial?" : "Publish testimonial?"} description={confirming === "archived" ? "This submission will be archived and remain hidden from the public homepage." : "This submission will become visible in the public homepage carousel."} confirmLabel={confirming === "archived" ? "Reject submission" : "Publish testimonial"} pending={busy} onClose={() => setConfirming(null)} onConfirm={() => { if (confirming) void setStatus(confirming); }} />
  </div>;
}
