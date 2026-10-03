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
  const [loadFailed, setLoadFailed] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [message, setMessage] = useState({ type: "", text: "" });

  const { register, handleSubmit, reset } = useForm<SiteSettings>();

  useEffect(() => {
    fetch("/api/admin/settings")
      .then((res) => {
        if (!res.ok) throw new Error("Unable to load site settings");
        return res.json();
      })
      .then((data) => {
        reset(data);
        setIsLoading(false);
      })
      .catch((err) => {
        console.error(err);
        setLoadFailed(true);
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

      const result = await res.json();
      if (!res.ok) throw new Error(result.error || "Failed to save changes");

      setMessage(result.warning ? { type: "warning", text: result.warning } : { type: "success", text: "Settings saved successfully!" });
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

  if (loadFailed) {
    return (
      <div className="space-y-4">
        <h1 className="text-2xl font-medium text-text-primary">Site settings unavailable</h1>
        <p role="alert" className="text-sm text-red-700 dark:text-red-400">Settings could not be loaded. No changes have been made.</p>
        <button type="button" onClick={() => window.location.reload()} className="inline-flex min-h-11 items-center rounded-full border border-border-primary px-5 text-sm font-medium text-text-primary focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-current">Retry loading</button>
      </div>
    );
  }

  return (
    <div className="min-w-0 space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-medium tracking-tight text-text-primary">Global Site Settings</h1>
      </div>

      {message.text && (
        <div role={message.type === "error" ? "alert" : "status"} className={`rounded-xl p-4 text-sm ${message.type === "success" ? "bg-green-50 text-green-700 dark:bg-green-950/30" : message.type === "warning" ? "bg-amber-50 text-amber-800 dark:bg-amber-950/30 dark:text-amber-300" : "bg-red-50 text-red-700 dark:bg-red-950/30 dark:text-red-400"}`}>
          {message.text}
        </div>
      )}

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-8">
        
        <div className="rounded-2xl border border-border-primary bg-white p-6 dark:bg-white/[0.03] space-y-4">
          <h2 className="text-lg font-medium text-text-primary">General Settings</h2>
          <div className="space-y-4">
            <div>
              <label htmlFor="site_name" className="mb-2 block text-sm font-medium">Site Name</label>
              <input
                id="site_name"
                {...register("site_name")}
                className="min-h-11 w-full rounded-xl border border-border-primary bg-bg-primary px-3 py-2 text-sm text-text-primary focus:outline-none focus-visible:ring-2 focus-visible:ring-text-primary/40"
              />
            </div>
            <div>
              <label htmlFor="seo_description" className="mb-2 block text-sm font-medium">SEO Description (Meta)</label>
              <textarea
                id="seo_description"
                {...register("seo_description")}
                rows={3}
                className="w-full rounded-xl border border-border-primary bg-bg-primary px-3 py-2 text-sm text-text-primary focus:outline-none focus-visible:ring-2 focus-visible:ring-text-primary/40"
              />
            </div>
            <div>
              <label htmlFor="seo_keywords" className="mb-2 block text-sm font-medium">SEO Keywords</label>
              <input
                id="seo_keywords"
                {...register("seo_keywords")}
                placeholder="Comma separated..."
                className="min-h-11 w-full rounded-xl border border-border-primary bg-bg-primary px-3 py-2 text-sm text-text-primary focus:outline-none focus-visible:ring-2 focus-visible:ring-text-primary/40"
              />
            </div>
          </div>
        </div>

        <div className="rounded-2xl border border-border-primary bg-white p-6 dark:bg-white/[0.03] space-y-4">
          <h2 className="text-lg font-medium text-text-primary">Social Links & Contact</h2>
          <div className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label htmlFor="github_url" className="mb-2 block text-sm font-medium">GitHub URL</label>
                <input
                  id="github_url"
                  {...register("github_url")}
                  className="min-h-11 w-full rounded-xl border border-border-primary bg-bg-primary px-3 py-2 text-sm text-text-primary focus:outline-none focus-visible:ring-2 focus-visible:ring-text-primary/40"
                />
              </div>
              <div>
                <label htmlFor="twitter_url" className="mb-2 block text-sm font-medium">X / Twitter URL</label>
                <input
                  id="twitter_url"
                  {...register("twitter_url")}
                  className="min-h-11 w-full rounded-xl border border-border-primary bg-bg-primary px-3 py-2 text-sm text-text-primary focus:outline-none focus-visible:ring-2 focus-visible:ring-text-primary/40"
                />
              </div>
              <div>
                <label htmlFor="linkedin_url" className="mb-2 block text-sm font-medium">LinkedIn URL</label>
                <input
                  id="linkedin_url"
                  {...register("linkedin_url")}
                  className="min-h-11 w-full rounded-xl border border-border-primary bg-bg-primary px-3 py-2 text-sm text-text-primary focus:outline-none focus-visible:ring-2 focus-visible:ring-text-primary/40"
                />
              </div>
              <div>
                <label htmlFor="email_address" className="mb-2 block text-sm font-medium">Contact Email</label>
                <input
                  id="email_address"
                  {...register("email_address")}
                  type="email"
                  className="min-h-11 w-full rounded-xl border border-border-primary bg-bg-primary px-3 py-2 text-sm text-text-primary focus:outline-none focus-visible:ring-2 focus-visible:ring-text-primary/40"
                />
              </div>
            </div>
          </div>
        </div>

        <div className="flex justify-end">
          <button
            type="submit"
            disabled={isSaving}
            className="inline-flex min-h-11 items-center justify-center rounded-full bg-text-primary px-6 py-2 text-sm font-medium text-bg-primary transition-colors hover:opacity-85 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-text-primary disabled:opacity-50"
          >
            {isSaving ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Save className="mr-2 h-4 w-4" />}
            Save Settings
          </button>
        </div>
      </form>
    </div>
  );
}
