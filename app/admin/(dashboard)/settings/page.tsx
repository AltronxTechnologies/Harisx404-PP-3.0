"use client";

import { useState, useEffect } from "react";
import { Loader2, Save, RotateCcw } from "lucide-react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useRouter } from "next/navigation";
import { readAdminResponse } from "@/app/lib/admin/read-admin-response";
import { AdminConfirmDialog } from "@/app/components/admin/AdminConfirmDialog";
import { useAdminNavigationGuard } from "@/app/components/admin/useAdminNavigationGuard";

const secureUrl = z.string().trim().max(2048).refine((value) => {
  if (!value) return true;
  try {
    const url = new URL(value);
    return url.protocol === "https:" && !!url.hostname && !url.username && !url.password;
  } catch { return false; }
}, "Use a valid HTTPS URL without embedded credentials");
const settingsSchema = z.object({
  site_name: z.string().trim().min(1, "Site name is required").max(120),
  seo_description: z.string().trim().max(500),
  github_url: secureUrl,
  twitter_url: secureUrl,
  linkedin_url: secureUrl,
  email_address: z.union([z.literal(""), z.string().trim().email("Enter a valid email address").max(320)]),
});
type SiteSettings = z.infer<typeof settingsSchema>;

export default function AdminSettingsPage() {
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(true);
  const [loadFailed, setLoadFailed] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [message, setMessage] = useState({ type: "", text: "" });

  const { register, handleSubmit, reset, setError, watch, formState: { errors, isDirty } } = useForm<SiteSettings>({ resolver: zodResolver(settingsSchema) });
  const descriptionLength = watch("seo_description")?.length ?? 0;
  const { leaveTarget, setLeaveTarget, confirmLeave } = useAdminNavigationGuard(isDirty);
  useEffect(() => {
    if (!isDirty) return;
    const warn = (event: BeforeUnloadEvent) => { event.preventDefault(); event.returnValue = ""; };
    window.addEventListener("beforeunload", warn);
    return () => window.removeEventListener("beforeunload", warn);
  }, [isDirty]);
  const errorProps = (name: keyof SiteSettings) => ({
    "aria-invalid": Boolean(errors[name]),
    "aria-describedby": `${name}-help${errors[name] ? ` ${name}-error` : ""}`,
  });
  const FieldError = ({ name }: { name: keyof SiteSettings }) => errors[name]
    ? <p id={`${name}-error`} role="alert" className="mt-1 text-xs text-red-300">{errors[name]?.message}</p>
    : null;

  useEffect(() => {
    const controller = new AbortController();
    fetch("/api/admin/settings", { signal: controller.signal })
      .then((res) => {
        if (!res.ok) throw new Error("Unable to load site settings");
        return res.json();
      })
      .then((data) => {
        const parsed = settingsSchema.safeParse(data);
        if (!parsed.success) throw new Error("Invalid site settings response");
        reset(parsed.data);
        setIsLoading(false);
      })
      .catch(() => {
        if (controller.signal.aborted) return;
        setLoadFailed(true);
        setIsLoading(false);
      });
    return () => controller.abort();
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

      const result = await readAdminResponse(res, "Site settings");
      if (!res.ok) {
        if (result.fields) {
          for (const [name, messages] of Object.entries(result.fields)) {
            if (name in settingsSchema.shape && Array.isArray(messages) && typeof messages[0] === "string") {
              setError(name as keyof SiteSettings, { message: messages[0] });
            }
          }
        }
        throw new Error(result.error || "Failed to save changes");
      }

      if (result.success !== true) throw new Error("Settings save could not be confirmed. Refresh status before retrying.");
      reset(data);
      setMessage(result.warning ? { type: "warning", text: result.warning } : { type: "success", text: "Settings saved." });
    } catch (err) {
      setMessage({ type: "error", text: err instanceof Error ? err.message : "Failed to save settings." });
    } finally {
      setIsSaving(false);
    }
  };

  if (isLoading) {
    return (
      <div role="status" className="flex h-64 items-center justify-center gap-3 text-sm text-ink-secondary">
        <Loader2 aria-hidden className="h-6 w-6 animate-spin text-accent-signal" /> Loading settings...
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
      <div>
        <h1 className="text-3xl font-medium tracking-tight text-text-primary">Global Site Settings</h1>
        <p className="mt-2 text-sm text-ink-secondary">Manage the shared site title, description and assistant contact details. Changes to static page copy and navigation require a code update.</p>
      </div>

      {message.text && (
        <div role={message.type === "error" ? "alert" : "status"} className={`rounded-xl p-4 text-sm ${message.type === "success" ? "bg-green-50 text-green-700 dark:bg-green-950/30 dark:text-green-300" : message.type === "warning" ? "bg-amber-50 text-amber-800 dark:bg-amber-950/30 dark:text-amber-300" : "bg-red-50 text-red-700 dark:bg-red-950/30 dark:text-red-400"}`}>
          {message.text}
        </div>
      )}

      <form noValidate onSubmit={handleSubmit(onSubmit)} className="space-y-8">
        <fieldset disabled={isSaving} className="min-w-0 space-y-8 border-0 p-0 disabled:opacity-70">
        <div className="rounded-2xl border border-border-primary bg-white p-6 dark:bg-white/[0.03] space-y-4">
          <div><h2 className="text-lg font-medium text-text-primary">Site identity and metadata</h2><p className="mt-1 text-sm text-ink-secondary">These values are used by the shared page metadata. Individual pages may have their own titles and descriptions.</p></div>
          <div className="space-y-4">
            <div>
              <label htmlFor="site_name" className="mb-2 block text-sm font-medium">Site Name</label>
              <input
                id="site_name"
                {...register("site_name")}
                {...errorProps("site_name")}
                maxLength={120}
                autoComplete="organization"
                className="min-h-11 w-full rounded-xl border border-border-primary bg-bg-primary px-3 py-2 text-sm text-text-primary focus:outline-none focus-visible:ring-2 focus-visible:ring-text-primary/40"
              />
              <p id="site_name-help" className="mt-1 text-xs text-ink-secondary">Used in the default browser title and shared social previews.</p>
              <FieldError name="site_name" />
            </div>
            <div>
              <label htmlFor="seo_description" className="mb-2 block text-sm font-medium">SEO Description (Meta)</label>
              <textarea
                id="seo_description"
                {...register("seo_description")}
                {...errorProps("seo_description")}
                rows={3}
                maxLength={500}
                className="w-full rounded-xl border border-border-primary bg-bg-primary px-3 py-2 text-sm text-text-primary focus:outline-none focus-visible:ring-2 focus-visible:ring-text-primary/40"
              />
              <p id="seo_description-help" className="mt-1 text-xs text-ink-secondary">Default search and social preview description. {descriptionLength}/500 characters.</p>
              <FieldError name="seo_description" />
            </div>
          </div>
        </div>

        <div className="rounded-2xl border border-border-primary bg-white p-6 dark:bg-white/[0.03] space-y-4">
          <div><h2 className="text-lg font-medium text-text-primary">Assistant contact details</h2><p className="mt-1 text-sm text-ink-secondary">The site assistant uses these links and email as reference information. They do not update static navigation or social buttons.</p></div>
          <div className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label htmlFor="github_url" className="mb-2 block text-sm font-medium">GitHub URL</label>
                <input
                  id="github_url"
                  {...register("github_url")}
                  {...errorProps("github_url")}
                  type="url"
                  maxLength={2048}
                  autoComplete="url"
                  className="min-h-11 w-full rounded-xl border border-border-primary bg-bg-primary px-3 py-2 text-sm text-text-primary focus:outline-none focus-visible:ring-2 focus-visible:ring-text-primary/40"
                />
                <p id="github_url-help" className="mt-1 text-xs text-ink-secondary">Optional HTTPS profile URL.</p>
                <FieldError name="github_url" />
              </div>
              <div>
                <label htmlFor="twitter_url" className="mb-2 block text-sm font-medium">X / Twitter URL</label>
                <input
                  id="twitter_url"
                  {...register("twitter_url")}
                  {...errorProps("twitter_url")}
                  type="url"
                  maxLength={2048}
                  autoComplete="url"
                  className="min-h-11 w-full rounded-xl border border-border-primary bg-bg-primary px-3 py-2 text-sm text-text-primary focus:outline-none focus-visible:ring-2 focus-visible:ring-text-primary/40"
                />
                <p id="twitter_url-help" className="mt-1 text-xs text-ink-secondary">Optional HTTPS profile URL.</p>
                <FieldError name="twitter_url" />
              </div>
              <div>
                <label htmlFor="linkedin_url" className="mb-2 block text-sm font-medium">LinkedIn URL</label>
                <input
                  id="linkedin_url"
                  {...register("linkedin_url")}
                  {...errorProps("linkedin_url")}
                  type="url"
                  maxLength={2048}
                  autoComplete="url"
                  className="min-h-11 w-full rounded-xl border border-border-primary bg-bg-primary px-3 py-2 text-sm text-text-primary focus:outline-none focus-visible:ring-2 focus-visible:ring-text-primary/40"
                />
                <p id="linkedin_url-help" className="mt-1 text-xs text-ink-secondary">Optional HTTPS profile URL.</p>
                <FieldError name="linkedin_url" />
              </div>
              <div>
                <label htmlFor="email_address" className="mb-2 block text-sm font-medium">Contact Email</label>
                <input
                  id="email_address"
                  {...register("email_address")}
                  {...errorProps("email_address")}
                  type="email"
                  maxLength={320}
                  autoComplete="email"
                  className="min-h-11 w-full rounded-xl border border-border-primary bg-bg-primary px-3 py-2 text-sm text-text-primary focus:outline-none focus-visible:ring-2 focus-visible:ring-text-primary/40"
                />
                <p id="email_address-help" className="mt-1 text-xs text-ink-secondary">Optional address shared with the site assistant.</p>
                <FieldError name="email_address" />
              </div>
            </div>
          </div>
        </div>

        </fieldset>
        <div className="flex flex-wrap items-center justify-end gap-3">
          <button type="button" onClick={() => { reset(); setMessage({ type: "", text: "" }); }} disabled={isSaving || !isDirty} className="inline-flex min-h-11 items-center justify-center gap-2 rounded-full border border-border-primary px-5 text-sm font-medium text-text-primary focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-current disabled:opacity-50"><RotateCcw aria-hidden className="size-4" />Discard changes</button>
          <button
            type="submit"
            disabled={isSaving || !isDirty}
            className="inline-flex min-h-11 items-center justify-center rounded-full bg-text-primary px-6 py-2 text-sm font-medium text-bg-primary transition-colors hover:opacity-85 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-text-primary disabled:opacity-50"
          >
            {isSaving ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Save className="mr-2 h-4 w-4" />}
            Save Settings
          </button>
        </div>
      </form>
      <AdminConfirmDialog open={leaveTarget !== null} title="Discard unsaved settings?" description="Your global site settings have not been saved." confirmLabel="Discard changes" destructive onClose={() => setLeaveTarget(null)} onConfirm={() => confirmLeave(router.push)} />
    </div>
  );
}
