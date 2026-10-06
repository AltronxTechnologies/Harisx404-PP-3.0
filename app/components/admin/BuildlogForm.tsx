"use client";

import { useEffect, useState } from "react";
import { zodResolver } from "@hookform/resolvers/zod";
import { ArrowDown, ArrowUp, Loader2, Plus, Trash2 } from "lucide-react";
import { useRouter } from "next/navigation";
import { Controller, useFieldArray, useForm } from "react-hook-form";
import * as z from "zod";
import type { BuildlogProjectAdmin } from "@/app/buildlog/types";
import { parseSemanticVersion } from "@/app/buildlog/version";
import { AdminConfirmDialog } from "./AdminConfirmDialog";
import { readAdminResponse } from "@/app/lib/admin/read-admin-response";
import { BuildlogSelect } from "./BuildlogSelect";
import { useAdminNavigationGuard } from "./useAdminNavigationGuard";

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
  project_status: z.enum(["in_progress", "live", "completed"]),
  display_order: z.coerce.number({ invalid_type_error: "Display order is required." }).int().min(0).max(10000),
  status: z.enum(["draft", "published", "archived"]),
  is_demo: z.boolean(),
  items: z.array(itemSchema).min(1, "Add at least one release item.").max(50),
}).superRefine((project, context) => {
  if (project.is_demo && project.status === "published") {
    context.addIssue({
      code: "custom",
      path: ["status"],
      message: "Demo projects cannot be published.",
    });
  }
  if (project.project_status === "completed" && project.items.some((item) => !item.done)) {
    context.addIssue({
      code: "custom",
      path: ["project_status"],
      message: "Mark every release item as shipped before completing a project.",
    });
  }
  project.items.forEach((item, index) => {
    if (item.done && !parseSemanticVersion(item.badge)) {
      context.addIssue({
        code: "custom",
        path: ["items", index, "badge"],
        message: "Shipped items require a semantic version badge, for example v2.1.",
      });
    }
  });
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

const visibilityOptions = [
  { value: "draft", label: "Draft", hint: "Only visible in Admin" },
  { value: "published", label: "Published", hint: "Visible on the public Buildlog" },
  { value: "archived", label: "Archived", hint: "Hidden from visitors, retained in Admin" },
] as const;
const lifecycleOptions = [
  { value: "in_progress", label: "In progress", hint: "Work and planned updates continue" },
  { value: "live", label: "Live", hint: "A running product" },
  { value: "completed", label: "Completed", hint: "Every release item is shipped" },
] as const;

export function BuildlogForm({ initialData }: { initialData?: BuildlogProjectAdmin & { updated_at: string } }) {
  const router = useRouter();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [serverError, setServerError] = useState("");
  const [confirmation, setConfirmation] = useState<{ title: string; description: string; label: string; data: FormValues } | null>(null);
  const {
    register,
    control,
    handleSubmit,
    setError,
    formState: { errors, isDirty },
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
          project_status: "in_progress",
          display_order: 0,
          status: "draft",
          is_demo: false,
          items: [emptyItem(0)],
        },
  });
  const { fields, append, remove, swap } = useFieldArray({ control, name: "items" });
  const { leaveTarget, setLeaveTarget, confirmLeave } = useAdminNavigationGuard(isDirty);

  useEffect(() => {
    if (!isDirty) return;
    const warn = (event: BeforeUnloadEvent) => { event.preventDefault(); event.returnValue = ""; };
    window.addEventListener("beforeunload", warn);
    return () => window.removeEventListener("beforeunload", warn);
  }, [isDirty]);

  const save = async (values: FormValues) => {
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
        body: JSON.stringify(initialData?.id ? { id: initialData.id, updated_at: initialData.updated_at, ...project } : project),
      });
      const result = await readAdminResponse(response, "Buildlog project");
      if (!response.ok) {
        if (result.issues?.fieldErrors) {
          for (const [name, messages] of Object.entries(result.issues.fieldErrors)) {
            if (name in formSchema.innerType().shape && Array.isArray(messages) && typeof messages[0] === "string") {
              setError(name as keyof FormValues, { message: messages[0] });
            }
          }
        }
        throw new Error(result.error || "Failed to save Buildlog project.");
      }
      router.push(result.warning ? "/admin/buildlog?saved=1&cache=stale" : "/admin/buildlog?saved=1");
      router.refresh();
    } catch (error) {
      setServerError(error instanceof Error ? error.message : "Failed to save Buildlog project.");
    } finally {
      setIsSubmitting(false);
    }
  };

  const onSubmit = (values: FormValues) => {
    if (values.status !== initialData?.status && (values.status === "published" || initialData?.status === "published")) {
      setConfirmation(values.status === "published"
        ? { title: "Publish Buildlog project?", description: "Its release information will be visible on the public Buildlog as soon as it is saved.", label: "Publish project", data: values }
        : { title: "Unpublish Buildlog project?", description: "This project will leave the public Buildlog but remain editable in Admin.", label: "Unpublish project", data: values });
      return;
    }
    void save(values);
  };

  return (
    <>
    <form onSubmit={handleSubmit(onSubmit, () => setServerError("Check the highlighted fields before saving."))} className="min-w-0 space-y-8">
      {serverError && (
        <div role="alert" className="rounded-xl bg-red-50 p-4 text-sm text-red-600 dark:bg-red-950/30 dark:text-red-300">
          {serverError}
        </div>
      )}

      <fieldset disabled={isSubmitting} className="min-w-0 space-y-8 border-0 p-0 disabled:opacity-80">

      <div className="grid gap-6 md:grid-cols-2">
        <label className="text-sm font-medium">
          Project name
          <input {...register("name")} aria-invalid={Boolean(errors.name)} aria-describedby={errors.name ? "buildlog-name-error" : undefined} className={inputClass} placeholder="This Website" />
          {errors.name && <span id="buildlog-name-error" role="alert" className="mt-1.5 block text-xs text-red-500">{errors.name.message}</span>}
        </label>
        <label className="text-sm font-medium">
          Tagline
          <input {...register("tagline")} aria-invalid={Boolean(errors.tagline)} aria-describedby={errors.tagline ? "buildlog-tagline-error" : undefined} className={inputClass} placeholder="Portfolio & blog." />
          {errors.tagline && <span id="buildlog-tagline-error" role="alert" className="mt-1.5 block text-xs text-red-500">{errors.tagline.message}</span>}
        </label>
      </div>

      <label className="block text-sm font-medium">
        Project summary
        <textarea {...register("info")} aria-invalid={Boolean(errors.info)} aria-describedby={errors.info ? "buildlog-info-error" : undefined} rows={3} maxLength={360} className={`${inputClass} resize-y`} />
        {errors.info && <span id="buildlog-info-error" role="alert" className="mt-1.5 block text-xs text-red-500">{errors.info.message}</span>}
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

      <div className="grid gap-6 md:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-5">
        <label className="text-sm font-medium">
          Current version
          <input {...register("current_version")} className={inputClass} placeholder="v1.0" />
          {errors.current_version && <span role="alert" className="mt-1.5 block text-xs text-red-500">{errors.current_version.message}</span>}
        </label>
        <label className="text-sm font-medium">
          Display order
          <input type="number" {...register("display_order", { setValueAs: (value: string) => value === "" ? NaN : Number(value) })} aria-invalid={Boolean(errors.display_order)} aria-describedby={errors.display_order ? "buildlog-display-order-error" : undefined} className={inputClass} />
          {errors.display_order && <span id="buildlog-display-order-error" role="alert" className="mt-1.5 block text-xs text-red-500">{errors.display_order.message}</span>}
        </label>
        <div className="min-w-0">
          <Controller name="status" control={control} render={({ field }) => <BuildlogSelect id="buildlog-status" label="Visibility" value={field.value} onChange={field.onChange} options={visibilityOptions} errorId={errors.status ? "buildlog-status-error" : undefined} />} />
          {errors.status && <span id="buildlog-status-error" role="alert" className="mt-1.5 block text-xs text-red-500">{errors.status.message}</span>}
        </div>
        <div className="min-w-0">
          <Controller name="project_status" control={control} render={({ field }) => <BuildlogSelect id="buildlog-lifecycle" label="Project lifecycle" value={field.value} onChange={field.onChange} options={lifecycleOptions} errorId={errors.project_status ? "buildlog-lifecycle-error" : undefined} />} />
          {errors.project_status && <span id="buildlog-lifecycle-error" role="alert" className="mt-1.5 block text-xs text-red-500">{errors.project_status.message}</span>}
        </div>
        <label className="flex min-h-11 items-center gap-3 rounded-xl border border-border-hairline bg-surface-base px-3 py-2.5 text-sm font-medium md:mt-7">
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
            disabled={fields.length >= 50}
            className="inline-flex min-h-11 items-center rounded-xl border border-border-hairline px-3 py-2 text-sm font-medium text-ink-secondary hover:bg-surface-base hover:text-ink-primary disabled:opacity-50"
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
                 <button type="button" disabled={index === 0} onClick={() => swap(index, index - 1)} aria-label={`Move item ${index + 1} up`} className="flex size-11 items-center justify-center rounded-lg text-ink-secondary hover:bg-surface-raised disabled:opacity-30"><ArrowUp className="size-4" /></button>
                 <button type="button" disabled={index === fields.length - 1} onClick={() => swap(index, index + 1)} aria-label={`Move item ${index + 1} down`} className="flex size-11 items-center justify-center rounded-lg text-ink-secondary hover:bg-surface-raised disabled:opacity-30"><ArrowDown className="size-4" /></button>
                 <button type="button" disabled={fields.length === 1} onClick={() => remove(index)} aria-label={`Remove item ${index + 1}`} className="flex size-11 items-center justify-center rounded-lg text-ink-secondary hover:bg-red-50 hover:text-red-500 disabled:opacity-30 dark:hover:bg-red-950/30"><Trash2 className="size-4" /></button>
              </div>
            </div>
            <div className="grid gap-4 md:grid-cols-[minmax(0,1fr)_140px]">
              <label className="text-sm font-medium">
                Title
                <input {...register(`items.${index}.title`)} aria-invalid={Boolean(errors.items?.[index]?.title)} aria-describedby={errors.items?.[index]?.title ? `buildlog-item-${index}-title-error` : undefined} className={inputClass} />
                {errors.items?.[index]?.title && <span id={`buildlog-item-${index}-title-error`} role="alert" className="mt-1.5 block text-xs text-red-500">{errors.items[index]?.title?.message}</span>}
              </label>
              <label className="text-sm font-medium">
                Badge
                <input {...register(`items.${index}.badge`)} aria-invalid={Boolean(errors.items?.[index]?.badge)} aria-describedby={errors.items?.[index]?.badge ? `buildlog-item-${index}-badge-error` : undefined} className={inputClass} placeholder="v1.0" />
                {errors.items?.[index]?.badge && <span id={`buildlog-item-${index}-badge-error`} role="alert" className="mt-1.5 block text-xs text-red-500">{errors.items[index]?.badge?.message}</span>}
              </label>
            </div>
            <label className="mt-4 block text-sm font-medium">
              Description
              <textarea {...register(`items.${index}.description`)} aria-invalid={Boolean(errors.items?.[index]?.description)} aria-describedby={errors.items?.[index]?.description ? `buildlog-item-${index}-description-error` : undefined} rows={2} maxLength={400} className={`${inputClass} resize-y`} />
              {errors.items?.[index]?.description && <span id={`buildlog-item-${index}-description-error`} role="alert" className="mt-1.5 block text-xs text-red-500">{errors.items[index]?.description?.message}</span>}
            </label>
            <label className="mt-4 flex items-center gap-3 text-sm font-medium">
              <input type="checkbox" {...register(`items.${index}.done`)} className="size-4 rounded border-border-hairline" />
              Shipped
            </label>
          </div>
        ))}
        {errors.items?.root && <p role="alert" className="text-xs text-red-500">{errors.items.root.message}</p>}
      </fieldset>

      <div className="flex justify-end gap-3 border-t border-border-hairline pt-6">
        <button type="button" onClick={() => { if (isSubmitting) return; if (isDirty) setLeaveTarget("/admin/buildlog"); else router.push("/admin/buildlog"); }} className="min-h-11 rounded-xl px-4 py-2.5 text-sm font-medium text-ink-secondary hover:bg-surface-base">Cancel</button>
        <button type="submit" disabled={isSubmitting} className="inline-flex min-w-40 items-center justify-center rounded-xl bg-accent-signal px-6 py-2.5 text-sm font-medium text-white shadow hover:opacity-90 disabled:cursor-wait disabled:opacity-50">
          {isSubmitting && <Loader2 className="mr-2 size-4 animate-spin" />}
          {initialData?.id ? "Update project" : "Create project"}
        </button>
      </div>
      </fieldset>
    </form>
    <AdminConfirmDialog open={confirmation !== null} title={confirmation?.title || "Confirm publication"} description={confirmation?.description || ""} confirmLabel={confirmation?.label || "Confirm"} pending={isSubmitting} onClose={() => setConfirmation(null)} onConfirm={() => { const pending = confirmation; setConfirmation(null); if (pending) void save(pending.data); }} />
    <AdminConfirmDialog open={leaveTarget !== null} title="Discard unsaved Buildlog changes?" description="Project details and release-item changes on this page have not been saved." confirmLabel="Discard changes" destructive onClose={() => setLeaveTarget(null)} onConfirm={() => confirmLeave((target) => router.push(target))} />
    </>
  );
}
