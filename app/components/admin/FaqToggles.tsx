"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Eye, EyeOff, Loader2 } from "lucide-react";
import { readAdminResponse } from "@/app/lib/admin/read-admin-response";
import { AdminConfirmDialog } from "./AdminConfirmDialog";

/** Per-question show/hide toggle used in the admin FAQ list. */
export function FaqVisibilityToggle({ id, isVisible, question }: { id: string; isVisible: boolean; question: string }) {
  const [busy, setBusy] = useState(false);
  const [confirming, setConfirming] = useState(false);
  const [error, setError] = useState("");
  const router = useRouter();

  const toggle = async () => {
    setBusy(true);
    setError("");
    try {
      const res = await fetch("/api/admin/faqs", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id, is_visible: !isVisible }),
      });
      const result = await readAdminResponse(res, "FAQ visibility");
      if (!res.ok) throw new Error(result.error || "Failed to update FAQ visibility");
      if (result.data?.id !== id) throw new Error("FAQ visibility could not be confirmed. Refresh the list before retrying.");
      setConfirming(false);
      const url = new URL(window.location.href);
      url.searchParams.set("notice", "updated");
      if (result.warning) url.searchParams.set("cache", "stale");
      else url.searchParams.delete("cache");
      router.replace(`${url.pathname}${url.search}`);
      router.refresh();
    } catch (err) {
      setConfirming(false);
      setError(err instanceof Error ? err.message : "Failed to update FAQ visibility");
    } finally {
      setBusy(false);
    }
  };

  return <div className="flex min-w-0 flex-col items-start gap-2">
    <button
      type="button"
      onClick={() => setConfirming(true)}
      disabled={busy}
      aria-label={`${isVisible ? "Hide" : "Show"} FAQ: ${question}`}
      aria-pressed={isVisible}
      className={`inline-flex min-h-11 items-center gap-2 rounded-xl px-3 text-sm font-medium transition-colors focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-current disabled:opacity-50 ${
        isVisible
          ? "bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400"
          : "bg-neutral-100 text-neutral-600 dark:bg-neutral-800 dark:text-neutral-400"
      }`}
    >
      {busy ? (
        <Loader2 aria-hidden className="size-4 animate-spin" />
      ) : isVisible ? (
        <Eye aria-hidden className="size-4" />
      ) : (
        <EyeOff aria-hidden className="size-4" />
      )}
      {isVisible ? "Visible" : "Hidden"}
    </button>
    {error && <p role="alert" className="max-w-sm break-words text-sm text-red-300">{error}</p>}
    <AdminConfirmDialog open={confirming} title={isVisible ? "Hide FAQ from homepage?" : "Show FAQ on homepage?"} description={`“${question}” will ${isVisible ? "no longer appear" : "be visible"} in the homepage FAQ section.`} confirmLabel={isVisible ? "Hide FAQ" : "Show FAQ"} pending={busy} onClose={() => setConfirming(false)} onConfirm={() => void toggle()} />
  </div>;
}

/** Whole-section switch: shows/hides the entire FAQ section (kicker,
    heading and questions) on the homepage via site_settings. */
export function FaqSectionToggle({ enabled }: { enabled: boolean }) {
  const [busy, setBusy] = useState(false);
  const [confirming, setConfirming] = useState(false);
  const [error, setError] = useState("");
  const router = useRouter();

  const toggle = async () => {
    setBusy(true);
    setError("");
    try {
      const res = await fetch("/api/admin/faqs", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ show_faq_section: !enabled }),
      });
      const result = await readAdminResponse(res, "FAQ section visibility");
      if (!res.ok) throw new Error(result.error || "Failed to update FAQ section visibility");
      if (result.success !== true) throw new Error("FAQ section visibility could not be confirmed. Refresh before retrying.");
      setConfirming(false);
      const url = new URL(window.location.href);
      url.searchParams.set("notice", "updated");
      if (result.warning) url.searchParams.set("cache", "stale");
      else url.searchParams.delete("cache");
      router.replace(`${url.pathname}${url.search}`);
      router.refresh();
    } catch (err) {
      setConfirming(false);
      setError(err instanceof Error ? err.message : "Failed to update FAQ section visibility");
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="flex flex-wrap items-center justify-between gap-4 rounded-2xl border border-border-hairline bg-surface-raised px-5 py-4 shadow-sm">
      <div className="min-w-0 flex-1">
        <p className="text-sm font-medium text-ink-primary">FAQ section on homepage</p>
        <p className="text-xs text-ink-secondary">
          {enabled
            ? "The section (kicker, heading and questions) is live on the homepage."
            : "The entire section is hidden from the homepage."}
        </p>
      </div>
      <button
        type="button"
        onClick={() => setConfirming(true)}
        disabled={busy}
        role="switch"
        aria-label="Show FAQ section on homepage"
        aria-checked={enabled}
        className="relative inline-flex size-11 shrink-0 items-center justify-center rounded-xl focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-current disabled:opacity-50"
      >
        <span aria-hidden className={`flex h-6 w-11 items-center rounded-full transition-colors ${enabled ? "bg-green-500" : "bg-neutral-300 dark:bg-neutral-700"}`}>
          <span className={`inline-block h-4 w-4 rounded-full bg-white shadow ${enabled ? "ml-6" : "ml-1"}`} />
        </span>
        {busy && (
          <Loader2 className="absolute -left-6 h-4 w-4 animate-spin text-ink-secondary" />
        )}
      </button>
      {error && <p role="alert" className="w-full break-words text-sm text-red-300">{error}</p>}
      <AdminConfirmDialog open={confirming} title={enabled ? "Hide the homepage FAQ section?" : "Show the homepage FAQ section?"} description={enabled ? "The full FAQ section will disappear from the homepage. Questions stay saved in Admin." : "The section and its visible questions will return to the homepage."} confirmLabel={enabled ? "Hide section" : "Show section"} pending={busy} onClose={() => setConfirming(false)} onConfirm={() => void toggle()} />
    </div>
  );
}
