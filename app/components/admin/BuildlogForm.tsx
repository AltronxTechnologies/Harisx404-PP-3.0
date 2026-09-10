"use client";

import { useState } from "react";
import { zodResolver } from "@hookform/resolvers/zod";
import { ArrowDown, ArrowUp, Loader2, Plus, Trash2 } from "lucide-react";
import { useRouter } from "next/navigation";
import { useFieldArray, useForm } from "react-hook-form";
import * as z from "zod";
import type { BuildlogProjectAdmin } from "@/app/buildlog/types";

const itemSchema = z.object({
  id: z.string().optional(),
  title: z.string().trim().min(2, "Item title is required.").max(160),
  description: z.string().trim().max(400).optional(),
  badge: z.string().trim().min(1, "Badge is required.").max(40),
  done: z.boolean(),
  display_order: z.number(),
});

const optionalHttpsUrl = z.string().trim().refine((value) => {
  if (!value) return true;
  try {
    return new URL(value).protocol === "https:";
  } catch {
    return false;
  }
}, "Enter a valid HTTPS URL.");

const formSchema = z.object({
  name: z.string().trim().min(2, "Project name is required.").max(100),
  tagline: z.string().trim().min(2, "Tagline is required.").max(120),
  info: z.string().trim().min(10, "Add a short project summary.").max(360),
  current_version: z.string().trim().min(1, "Version is required.").max(40),
  github_url: optionalHttpsUrl,
  live_url: optionalHttpsUrl,
  display_order: z.coerce.number().int().min(0).max(10000),
  status: z.enum(["draft", "published", "archived"]),
  is_demo: z.boolean(),
  items: z.array(itemSchema).min(1, "Add at least one release item.").max(50),
});

type FormValues = z.infer<typeof formSchema>;

const inputClass =
  "mt-2 w-full rounded-xl border border-border-hairline bg-surface-base px-3 py-2.5 text-sm text-ink-primary outline-none transition-colors focus:border-accent-signal focus:ring-2 focus:ring-accent-signal/20";

const emptyItem = (order: number): FormValues["items"][number] => ({
  title: "",
  description: "",
  badge: "planned",
  done: false,
  display_order: order,
});

export function BuildlogForm({ initialData }: { initialData?: BuildlogProjectAdmin }) {
  const router = useRouter();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [serverError, setServerError] = useState("");
  const {
    register,
    control,
    handleSubmit,
    formState: { errors },
  } = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: initialData
      ? {
          ...initialData,
          github_url: initialData.github_url || "",
          live_url: initialData.live_url || "",
          items: initialData.items.map((item) => ({
            ...item,
            description: item.description || "",
          })),
        }
      : {
          name: "",
          tagline: "",
          info: "",
          current_version: "v1.0",
          github_url: "",
          live_url: "",
          display_order: 0,
          status: "draft",
          is_demo: false,
          items: [emptyItem(0)],
        },
  });
  const { fields, append, remove, swap } = useFieldArray({ control, name: "items" });

  const onSubmit = async (values: FormValues) => {
    setIsSubmitting(true);
    setServerError("");
    try {
      const items = values.items.map((item, index) => ({
        ...item,
        description: item.description || null,
        display_order: index,
      }));
      const project = {
        ...values,
        github_url: values.github_url || null,
        live_url: values.live_url || null,
        items,
      };
      const response = await fetch("/api/admin/buildlog", {
        method: initialData?.id ? "PUT" : "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(initialData?.id ? { id: initialData.id, ...project } : project),
      });
      const result = await response.json();
      if (!response.ok) throw new Error(result.error || "Failed to save Buildlog project.");
      router.push("/admin/buildlog");
      router.refresh();
    } catch (error) {
      setServerError(error instanceof Error ? error.message : "Failed to save Buildlog project.");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-8">
      {serverError && (
        <div role="alert" className="rounded-xl bg-red-50 p-4 text-sm text-red-600 dark:bg-red-950/30 dark:text-red-300">
          {serverError}
        </div>
      )}

      <div className="grid gap-6 md:grid-cols-2">
        <label className="text-sm font-medium">
          Project name
          <input {...register("name")} className={inputClass} placeholder="This Website" />
          {errors.name && <span role="alert" className="mt-1.5 block text-xs text-red-500">{errors.name.message}</span>}
        </label>
        <label className="text-sm font-medium">
          Tagline
          <input {...register("tagline")} className={inputClass} placeholder="Portfolio & blog." />
          {errors.tagline && <span role="alert" className="mt-1.5 block text-xs text-red-500">{errors.tagline.message}</span>}
        </label>
      </div>

      <label className="block text-sm font-medium">
        Project summary
        <textarea {...register("info")} rows={3} maxLength={360} className={`${inputClass} resize-y`} />
        {errors.info && <span role="alert" className="mt-1.5 block text-xs text-red-500">{errors.info.message}</span>}
      </label>

      <div className="grid gap-6 md:grid-cols-2">
        <label className="text-sm font-medium">
          GitHub repository URL
          <input type="url" {...register("github_url")} className={inputClass} placeholder="https://github.com/username/project" />
          <span className="mt-1.5 block text-xs font-normal text-ink-secondary">Optional. Leave blank for private or unavailable repositories.</span>
          {errors.github_url && <span role="alert" className="mt-1.5 block text-xs text-red-500">{errors.github_url.message}</span>}
        </label>
        <label className="text-sm font-medium">
          Live project URL
          <input type="url" {...register("live_url")} className={inputClass} placeholder="https://project.example.com" />
          <span className="mt-1.5 block text-xs font-normal text-ink-secondary">Optional. Displayed only when a deployed project is available.</span>
          {errors.live_url && <span role="alert" className="mt-1.5 block text-xs text-red-500">{errors.live_url.message}</span>}
        </label>
      </div>

      <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
        <label className="text-sm font-medium">
          Current version
          <input {...register("current_version")} className={inputClass} placeholder="v1.0" />
        </label>
        <label className="text-sm font-medium">
          Display order
          <input type="number" {...register("display_order")} className={inputClass} />
        </label>
        <label className="text-sm font-medium">
          Status
          <select {...register("status")} className={inputClass}>
            <option value="draft">Draft</option>
            <option value="published">Published</option>
            <option value="archived">Archived</option>
          </select>
        </label>
        <label className="mt-7 flex items-center gap-3 rounded-xl border border-border-hairline bg-surface-base px-3 py-2.5 text-sm font-medium">
          <input type="checkbox" {...register("is_demo")} className="size-4 rounded border-border-hairline" />
          Demo record
        </label>
      </div>

      <fieldset className="space-y-4">
        <div className="flex flex-wrap items-center justify-between gap-3 border-b border-border-hairline pb-4">
          <div>
            <legend className="text-base font-semibold">Release items</legend>
            <p className="mt-1 text-xs text-ink-secondary">Order, status, badge, and public release notes.</p>
          </div>
          <button
            type="button"
            onClick={() => append(emptyItem(fields.length))}
            className="inline-flex items-center rounded-xl border border-border-hairline px-3 py-2 text-sm font-medium text-ink-secondary hover:bg-surface-base hover:text-ink-primary"
          >
            <Plus className="mr-2 size-4" /> Add item
          </button>
        </div>

        {fields.map((field, index) => (
          <div key={field.id} className="rounded-2xl border border-border-hairline bg-surface-base p-4">
            <input type="hidden" {...register(`items.${index}.id`)} />
            <input type="hidden" value={index} {...register(`items.${index}.display_order`, { valueAsNumber: true })} />
            <div className="mb-4 flex items-center justify-between gap-3">
              <span className="font-mono text-xs text-ink-secondary">ITEM {String(index + 1).padStart(2, "0")}</span>
              <div className="flex items-center gap-1">
                <button type="button" disabled={index === 0} onClick={() => swap(index, index - 1)} aria-label={`Move item ${index + 1} up`} className="rounded-lg p-2 text-ink-secondary hover:bg-surface-raised disabled:opacity-30"><ArrowUp className="size-4" /></button>
                <button type="button" disabled={index === fields.length - 1} onClick={() => swap(index, index + 1)} aria-label={`Move item ${index + 1} down`} className="rounded-lg p-2 text-ink-secondary hover:bg-surface-raised disabled:opacity-30"><ArrowDown className="size-4" /></button>
                <button type="button" disabled={fields.length === 1} onClick={() => remove(index)} aria-label={`Remove item ${index + 1}`} className="rounded-lg p-2 text-ink-secondary hover:bg-red-50 hover:text-red-500 disabled:opacity-30 dark:hover:bg-red-950/30"><Trash2 className="size-4" /></button>
              </div>
            </div>
            <div className="grid gap-4 md:grid-cols-[minmax(0,1fr)_140px]">
              <label className="text-sm font-medium">
                Title
                <input {...register(`items.${index}.title`)} className={inputClass} />
              </label>
              <label className="text-sm font-medium">
                Badge
                <input {...register(`items.${index}.badge`)} className={inputClass} placeholder="v1.0" />
              </label>
            </div>
            <label className="mt-4 block text-sm font-medium">
              Description
              <textarea {...register(`items.${index}.description`)} rows={2} maxLength={400} className={`${inputClass} resize-y`} />
            </label>
            <label className="mt-4 flex items-center gap-3 text-sm font-medium">
              <input type="checkbox" {...register(`items.${index}.done`)} className="size-4 rounded border-border-hairline" />
              Shipped
            </label>
            {errors.items?.[index] && <p role="alert" className="mt-3 text-xs text-red-500">Complete the required item fields.</p>}
          </div>
        ))}
        {errors.items?.root && <p role="alert" className="text-xs text-red-500">{errors.items.root.message}</p>}
      </fieldset>

      <div className="flex justify-end gap-3 border-t border-border-hairline pt-6">
        <button type="button" onClick={() => router.back()} className="rounded-xl px-4 py-2.5 text-sm font-medium text-ink-secondary hover:bg-surface-base">Cancel</button>
        <button type="submit" disabled={isSubmitting} className="inline-flex min-w-40 items-center justify-center rounded-xl bg-accent-signal px-6 py-2.5 text-sm font-medium text-white shadow hover:opacity-90 disabled:cursor-wait disabled:opacity-50">
          {isSubmitting && <Loader2 className="mr-2 size-4 animate-spin" />}
          {initialData?.id ? "Update project" : "Create project"}
        </button>
      </div>
    </form>
  );
}
