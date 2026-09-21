"use client";

import { useState } from "react";
import { zodResolver } from "@hookform/resolvers/zod";
import { Loader2 } from "lucide-react";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import * as z from "zod";
import type { BuildlogSettings } from "@/app/buildlog/types";

const schema = z.object({
  kicker: z.string().trim().min(2).max(80),
  heading: z.string().trim().min(2).max(100),
  heading_accent: z.string().trim().min(1).max(60),
  description: z.string().trim().min(10).max(300),
  archive_label: z.string().trim().min(2).max(60),
  seo_title: z.string().trim().min(2).max(100),
  seo_description: z.string().trim().min(10).max(300),
});

const inputClass =
  "mt-2 w-full rounded-xl border border-border-hairline bg-surface-base px-3 py-2.5 text-sm text-ink-primary outline-none transition-colors focus:border-accent-signal focus:ring-2 focus:ring-accent-signal/20";

export function BuildlogSettingsForm({ initialData }: { initialData: BuildlogSettings }) {
  const router = useRouter();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [serverError, setServerError] = useState("");
  const [saved, setSaved] = useState(false);
  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<BuildlogSettings>({
    resolver: zodResolver(schema),
    defaultValues: initialData,
  });

  const save = async (values: BuildlogSettings) => {
    setIsSubmitting(true);
    setServerError("");
    setSaved(false);
    try {
      const response = await fetch("/api/admin/buildlog/settings", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(values),
      });
      const result = await response.json();
      if (!response.ok) throw new Error(result.error || "Failed to save Buildlog settings.");
      setSaved(true);
      router.refresh();
    } catch (error) {
      setServerError(error instanceof Error ? error.message : "Failed to save Buildlog settings.");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <form onSubmit={handleSubmit(save)} className="space-y-6">
      {serverError && (
        <div role="alert" className="rounded-xl bg-red-50 p-4 text-sm text-red-600 dark:bg-red-950/30 dark:text-red-300">
          {serverError}
        </div>
      )}
      {saved && (
        <div role="status" className="rounded-xl bg-emerald-50 p-4 text-sm text-emerald-700 dark:bg-emerald-950/30 dark:text-emerald-300">
          Buildlog page settings saved.
        </div>
      )}

      <div className="grid gap-6 md:grid-cols-2">
        <label className="text-sm font-medium">
          Hero kicker
          <input {...register("kicker")} className={inputClass} />
          {errors.kicker && <span role="alert" className="mt-1.5 block text-xs text-red-500">{errors.kicker.message}</span>}
        </label>
        <label className="text-sm font-medium">
          Archive label
          <input {...register("archive_label")} className={inputClass} />
          {errors.archive_label && <span role="alert" className="mt-1.5 block text-xs text-red-500">{errors.archive_label.message}</span>}
        </label>
      </div>

      <div className="grid gap-6 md:grid-cols-2">
        <label className="text-sm font-medium">
          Heading
          <input {...register("heading")} className={inputClass} />
          {errors.heading && <span role="alert" className="mt-1.5 block text-xs text-red-500">{errors.heading.message}</span>}
        </label>
        <label className="text-sm font-medium">
          Gradient accent
          <input {...register("heading_accent")} className={inputClass} />
          {errors.heading_accent && <span role="alert" className="mt-1.5 block text-xs text-red-500">{errors.heading_accent.message}</span>}
        </label>
      </div>

      <label className="block text-sm font-medium">
        Supporting description
        <textarea {...register("description")} rows={4} maxLength={300} className={`${inputClass} resize-y`} />
        {errors.description && <span role="alert" className="mt-1.5 block text-xs text-red-500">{errors.description.message}</span>}
      </label>

      <div className="border-t border-border-hairline pt-6">
        <h2 className="text-base font-semibold">Search metadata</h2>
        <p className="mt-1 text-xs text-ink-secondary">
          Used for browser titles, search engines, and shared links.
        </p>
        <div className="mt-5 grid gap-6 md:grid-cols-2">
          <label className="text-sm font-medium">
            SEO title
            <input {...register("seo_title")} className={inputClass} />
            {errors.seo_title && <span role="alert" className="mt-1.5 block text-xs text-red-500">{errors.seo_title.message}</span>}
          </label>
          <label className="text-sm font-medium">
            SEO description
            <textarea {...register("seo_description")} rows={3} maxLength={300} className={`${inputClass} resize-y`} />
            {errors.seo_description && <span role="alert" className="mt-1.5 block text-xs text-red-500">{errors.seo_description.message}</span>}
          </label>
        </div>
      </div>

      <div className="flex justify-end border-t border-border-hairline pt-6">
        <button type="submit" disabled={isSubmitting} className="inline-flex min-w-40 items-center justify-center rounded-xl bg-accent-signal px-6 py-2.5 text-sm font-medium text-white shadow transition-opacity hover:opacity-90 disabled:cursor-wait disabled:opacity-50">
          {isSubmitting && <Loader2 className="mr-2 size-4 animate-spin" />}
          Save page settings
        </button>
      </div>
    </form>
  );
}
