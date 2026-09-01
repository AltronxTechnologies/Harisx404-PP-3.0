"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Eye, EyeOff, Loader2 } from "lucide-react";

/** Per-question show/hide toggle used in the admin FAQ list. */
export function FaqVisibilityToggle({ id, isVisible }: { id: string; isVisible: boolean }) {
  const [busy, setBusy] = useState(false);
  const router = useRouter();

  const toggle = async () => {
    setBusy(true);
    try {
      const res = await fetch("/api/admin/faqs", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id, is_visible: !isVisible }),
      });
      if (!res.ok) throw new Error("Failed to update visibility");
      router.refresh();
    } catch (err) {
      console.error(err);
      alert("Failed to update visibility");
    } finally {
      setBusy(false);
    }
  };

  return (
    <button
      onClick={toggle}
      disabled={busy}
      title={isVisible ? "Visible on homepage — click to hide" : "Hidden — click to show"}
      className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-0.5 text-xs font-semibold transition-colors disabled:opacity-50 ${
        isVisible
          ? "bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400"
          : "bg-neutral-100 text-neutral-600 dark:bg-neutral-800 dark:text-neutral-400"
      }`}
    >
      {busy ? (
        <Loader2 className="h-3 w-3 animate-spin" />
      ) : isVisible ? (
        <Eye className="h-3 w-3" />
      ) : (
        <EyeOff className="h-3 w-3" />
      )}
      {isVisible ? "Visible" : "Hidden"}
    </button>
  );
}

/** Whole-section switch: shows/hides the entire FAQ section (kicker,
    heading and questions) on the homepage via site_settings. */
export function FaqSectionToggle({ enabled }: { enabled: boolean }) {
  const [busy, setBusy] = useState(false);
  const router = useRouter();

  const toggle = async () => {
    setBusy(true);
    try {
      const res = await fetch("/api/admin/settings", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ show_faq_section: enabled ? "false" : "true" }),
      });
      if (!res.ok) throw new Error("Failed to update section visibility");
      router.refresh();
    } catch (err) {
      console.error(err);
      alert("Failed to update section visibility");
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="flex items-center justify-between rounded-xl border border-border-hairline bg-surface-raised px-5 py-4 shadow-sm">
      <div>
        <p className="text-sm font-medium text-ink-primary">FAQ section on homepage</p>
        <p className="text-xs text-ink-secondary">
          {enabled
            ? "The section (kicker, heading and questions) is live on the homepage."
            : "The entire section is hidden from the homepage."}
        </p>
      </div>
      <button
        onClick={toggle}
        disabled={busy}
        role="switch"
        aria-checked={enabled}
        className={`relative inline-flex h-6 w-11 shrink-0 items-center rounded-full transition-colors disabled:opacity-50 ${
          enabled ? "bg-green-500" : "bg-neutral-300 dark:bg-neutral-700"
        }`}
      >
        <span
          className={`inline-block h-4 w-4 transform rounded-full bg-white shadow transition-transform ${
            enabled ? "translate-x-6" : "translate-x-1"
          }`}
        />
        {busy && (
          <Loader2 className="absolute -left-6 h-4 w-4 animate-spin text-ink-secondary" />
        )}
      </button>
    </div>
  );
}
