"use client";

import { useState, useEffect } from "react";
import { Loader2, Save } from "lucide-react";
import { useForm } from "react-hook-form";

type SiteSettings = {
  site_name: string;
  seo_description: string;
  seo_keywords: string;
  github_url: string;
  twitter_url: string;
  linkedin_url: string;
  email_address: string;
};

export default function AdminSettingsPage() {
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [message, setMessage] = useState({ type: "", text: "" });

  const { register, handleSubmit, reset } = useForm<SiteSettings>();

  useEffect(() => {
    fetch("/api/admin/settings")
      .then((res) => res.json())
      .then((data) => {
        reset(data);
        setIsLoading(false);
      })
      .catch((err) => {
        console.error(err);
        setMessage({ type: "error", text: "Failed to load site settings." });
        setIsLoading(false);
      });
  }, [reset]);

  const onSubmit = async (data: SiteSettings) => {
    setIsSaving(true);
    setMessage({ type: "", text: "" });
    try {
      const res = await fetch("/api/admin/settings", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });

      if (!res.ok) throw new Error("Failed to save changes");
      
      setMessage({ type: "success", text: "Settings saved successfully!" });
    } catch (err: any) {
      setMessage({ type: "error", text: err.message });
    } finally {
      setIsSaving(false);
    }
  };

  if (isLoading) {
    return (
      <div className="flex h-64 items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-accent-signal" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-medium tracking-tight text-ink-primary">Global Site Settings</h1>
      </div>

      {message.text && (
        <div className={`rounded-xl p-4 text-sm ${message.type === "success" ? "bg-green-50 text-green-700 dark:bg-green-950/30" : "bg-red-50 text-red-500 dark:bg-red-950/30"}`}>
          {message.text}
        </div>
      )}

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-8">
        
        <div className="rounded-2xl border border-border-hairline bg-surface-raised p-6 space-y-4">
          <h2 className="text-lg font-medium text-ink-primary">General Settings</h2>
          <div className="space-y-4">
            <div>
              <label className="mb-2 block text-sm font-medium">Site Name</label>
              <input
                {...register("site_name")}
                className="w-full rounded-xl border border-border-hairline bg-surface-base px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-accent-signal"
              />
            </div>
            <div>
              <label className="mb-2 block text-sm font-medium">SEO Description (Meta)</label>
              <textarea
                {...register("seo_description")}
                rows={3}
                className="w-full rounded-xl border border-border-hairline bg-surface-base px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-accent-signal"
              />
            </div>
            <div>
              <label className="mb-2 block text-sm font-medium">SEO Keywords</label>
              <input
                {...register("seo_keywords")}
                placeholder="Comma separated..."
                className="w-full rounded-xl border border-border-hairline bg-surface-base px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-accent-signal"
              />
            </div>
          </div>
        </div>

        <div className="rounded-2xl border border-border-hairline bg-surface-raised p-6 space-y-4">
          <h2 className="text-lg font-medium text-ink-primary">Social Links & Contact</h2>
          <div className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="mb-2 block text-sm font-medium">GitHub URL</label>
                <input
                  {...register("github_url")}
                  className="w-full rounded-xl border border-border-hairline bg-surface-base px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-accent-signal"
                />
              </div>
              <div>
                <label className="mb-2 block text-sm font-medium">Twitter URL</label>
                <input
                  {...register("twitter_url")}
                  className="w-full rounded-xl border border-border-hairline bg-surface-base px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-accent-signal"
                />
              </div>
              <div>
                <label className="mb-2 block text-sm font-medium">LinkedIn URL</label>
                <input
                  {...register("linkedin_url")}
                  className="w-full rounded-xl border border-border-hairline bg-surface-base px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-accent-signal"
                />
              </div>
              <div>
                <label className="mb-2 block text-sm font-medium">Contact Email</label>
                <input
                  {...register("email_address")}
                  type="email"
                  className="w-full rounded-xl border border-border-hairline bg-surface-base px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-accent-signal"
                />
              </div>
            </div>
          </div>
        </div>

        <div className="flex justify-end">
          <button
            type="submit"
            disabled={isSaving}
            className="inline-flex items-center justify-center rounded-xl bg-accent-signal px-6 py-2 text-sm font-medium text-white shadow hover:bg-accent-signal/90 focus:outline-none disabled:opacity-50 transition-all"
          >
            {isSaving ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Save className="mr-2 h-4 w-4" />}
            Save Settings
          </button>
        </div>
      </form>
    </div>
  );
}
