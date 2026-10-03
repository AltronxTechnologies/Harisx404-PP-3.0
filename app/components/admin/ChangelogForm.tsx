"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useForm, Controller } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { TiptapEditor } from "./TiptapEditor";
import { MediaPickerModal } from "./MediaPickerModal";
import { Image as ImageIcon, Loader2 } from "lucide-react";

const changelogSchema = z.object({
  title: z.string().trim().min(1, "Title is required").max(200),
  slug: z.string().trim().min(1, "Slug is required").max(200).regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/, "Use lowercase letters, numbers, and hyphens"),
  content: z.string().trim().min(1, "Content is required").max(200000),
  status: z.enum(["draft", "published", "archived"]),
  image_url: z.string().url("Must be a valid URL").optional().or(z.literal("")),
  published_at: z.string().optional().or(z.literal("")),
});

type ChangelogFormValues = z.infer<typeof changelogSchema>;

interface ChangelogFormProps {
  initialData?: ChangelogFormValues & { id?: string };
}

export function ChangelogForm({ initialData }: ChangelogFormProps) {
  const router = useRouter();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState("");
  const [isMediaPickerOpen, setIsMediaPickerOpen] = useState(false);

  const {
    register,
    handleSubmit,
    control,
    setValue,
    formState: { errors },
  } = useForm<ChangelogFormValues>({
    resolver: zodResolver(changelogSchema),
    defaultValues: initialData || {
      title: "",
      slug: "",
      content: "",
      status: "draft",
      image_url: "",
      published_at: new Date().toISOString().split("T")[0],
    },
  });

  const onSubmit = async (data: ChangelogFormValues) => {
    setIsSubmitting(true);
    setErrorMsg("");
    try {
      const res = await fetch("/api/admin/changelogs", {
        method: initialData?.id ? "PUT" : "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(initialData?.id ? { id: initialData.id, ...data } : data),
      });

      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.error || "Failed to save changelog");
      }

      router.push("/admin/changelogs");
      router.refresh();
    } catch (err: any) {
      setErrorMsg(err.message);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="min-w-0 space-y-8">
      {errorMsg && (
        <div role="alert" className="rounded-lg bg-red-50 p-4 text-sm text-red-500 dark:bg-red-950/30">
          {errorMsg}
        </div>
      )}
      
      <div className="grid gap-6 md:grid-cols-2">
        <div className="space-y-2">
          <label htmlFor="changelog-title" className="text-sm font-medium">Title</label>
          <input
            id="changelog-title"
            {...register("title")}
            className="min-h-11 w-full rounded-xl border border-border-hairline bg-surface-base px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-accent-signal"
            placeholder="Changelog Title"
          />
          {errors.title && <p className="text-xs text-red-500">{errors.title.message}</p>}
        </div>

        <div className="space-y-2">
          <label htmlFor="changelog-slug" className="text-sm font-medium">Slug</label>
          <input
            id="changelog-slug"
            {...register("slug")}
            className="min-h-11 w-full rounded-xl border border-border-hairline bg-surface-base px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-accent-signal"
            placeholder="changelog-slug"
          />
          {errors.slug && <p className="text-xs text-red-500">{errors.slug.message}</p>}
        </div>
      </div>

      <div className="grid gap-6 md:grid-cols-2">
        <div className="space-y-2">
          <label htmlFor="changelog-status" className="text-sm font-medium">Status</label>
          <select
            id="changelog-status"
            {...register("status")}
            className="min-h-11 w-full rounded-xl border border-border-hairline bg-surface-base px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-accent-signal"
          >
            <option value="draft">Draft</option>
            <option value="published">Published</option>
            <option value="archived">Archived</option>
          </select>
        </div>

        <div className="space-y-2">
          <label htmlFor="changelog-date" className="text-sm font-medium">Publish Date</label>
          <input
            id="changelog-date"
            type="date"
            {...register("published_at")}
            className="min-h-11 w-full rounded-xl border border-border-hairline bg-surface-base px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-accent-signal"
          />
        </div>
      </div>

      <div className="space-y-2">
        <label htmlFor="changelog-image-url" className="text-sm font-medium">Image URL (Optional)</label>
        <div className="flex min-w-0 gap-2">
          <input
            id="changelog-image-url"
            {...register("image_url")}
            className="min-h-11 min-w-0 flex-1 rounded-xl border border-border-hairline bg-surface-base px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-accent-signal"
            placeholder="https://..."
          />
          <button
            type="button"
            onClick={() => setIsMediaPickerOpen(true)}
            className="inline-flex size-11 shrink-0 items-center justify-center rounded-xl border border-border-hairline bg-surface-base text-ink-secondary transition-colors hover:bg-surface-raised hover:text-accent-signal focus-visible:outline focus-visible:outline-2 focus-visible:outline-current"
            aria-label="Choose from Media Library"
          >
            <ImageIcon className="h-5 w-5" />
          </button>
        </div>
      </div>

      <MediaPickerModal
        isOpen={isMediaPickerOpen}
        onClose={() => setIsMediaPickerOpen(false)}
        onSelect={(media) => {
          setValue("image_url", media.secure_url || media.url, { shouldValidate: true });
        }}
      />

      <div className="space-y-2">
        <p className="text-sm font-medium">Content (HTML)</p>
        <Controller
          name="content"
          control={control}
          render={({ field }) => (
            <div className="rounded-xl overflow-hidden border border-border-hairline bg-surface-base">
              <TiptapEditor
                value={field.value || ""}
                onChange={(html) => field.onChange(html)}
                label="Changelog content"
              />
            </div>
          )}
        />
        {errors.content && <p className="text-xs text-red-500">{errors.content.message}</p>}
      </div>

      <div className="flex justify-end gap-4">
        <button
          type="button"
          onClick={() => router.back()}
          className="min-h-11 rounded-xl px-4 py-2 text-sm font-medium text-ink-secondary hover:bg-surface-base transition-colors"
        >
          Cancel
        </button>
        <button
          type="submit"
          disabled={isSubmitting}
          className="inline-flex min-h-11 items-center justify-center rounded-xl bg-accent-signal px-6 py-2 text-sm font-medium text-white shadow hover:bg-accent-signal/90 focus:outline-none disabled:opacity-50 transition-all"
        >
          {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
          Save Changelog
        </button>
      </div>
    </form>
  );
}
