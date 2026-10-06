"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Loader2, Trash2 } from "lucide-react";
import { AdminConfirmDialog } from "./AdminConfirmDialog";
import { readAdminResponse } from "@/app/lib/admin/read-admin-response";

export function DeleteTestimonialButton({ id, name }: { id: string; name: string }) {
  const router = useRouter();
  const [confirming, setConfirming] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");

  const remove = async (typed: string) => {
    if (busy || typed !== "DELETE") return;
    setBusy(true);
    setError("");
    try {
      const response = await fetch(`/api/admin/testimonials?${new URLSearchParams({ id })}`, { method: "DELETE" });
      const result = await readAdminResponse(response, "Testimonial deletion");
      if (!response.ok) throw new Error(result.error || "Could not delete this testimonial.");
      if (result.success !== true) throw new Error("Testimonial deletion could not be confirmed. Refresh the list before retrying.");
      setConfirming(false);
      const url = new URL(window.location.href);
      url.searchParams.set("notice", "deleted");
      if (result.warning) url.searchParams.set("cache", "stale");
      else url.searchParams.delete("cache");
      router.replace(`${url.pathname}${url.search}`);
      router.refresh();
    } catch (cause) {
      setConfirming(false);
      setError(cause instanceof Error ? cause.message : "Could not delete this testimonial.");
    } finally {
      setBusy(false);
    }
  };

  return <div className="flex flex-col items-end">
    <button type="button" onClick={() => setConfirming(true)} disabled={busy} aria-label={`Delete testimonial from ${name}`} className="inline-flex size-11 items-center justify-center rounded-lg text-ink-secondary hover:bg-red-950/30 hover:text-red-300 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-current disabled:opacity-50">{busy ? <Loader2 aria-hidden className="size-4 animate-spin" /> : <Trash2 aria-hidden className="size-4" />}</button>
    {error && <p role="alert" className="max-w-sm break-words text-sm text-red-300">{error}</p>}
    <AdminConfirmDialog open={confirming} title="Permanently delete testimonial?" description={`The testimonial from ${name} will be removed. This cannot be undone.`} confirmLabel="Delete permanently" confirmText="DELETE" destructive pending={busy} onClose={() => setConfirming(false)} onConfirm={(typed) => void remove(typed)} />
  </div>;
}
