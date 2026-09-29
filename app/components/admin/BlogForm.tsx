"use client";

import { useRef, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import dynamic from "next/dynamic";
import { useForm, Controller } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { Loader2, Plus, X, Image as ImageIcon } from "lucide-react";
import { MediaPickerModal } from "./MediaPickerModal";
import { normalizeBlogSlug } from "@/app/lib/blog-defaults";

const TiptapEditor = dynamic(() => import("./TiptapEditor").then((module) => module.TiptapEditor), { ssr: false });

const blogSchema = z.object({
  title: z.string().min(1, "Title is required"),
  slug: z.string().min(1, "Slug is required"),
  summary: z.string().optional(),
  content: z.string().min(1, "Content is required"),
  status: z.enum(["draft", "published"]),
  cover_image_url: z
    .string()
    .refine(
      (value) => !value || value.startsWith("/blog/") || /^https:\/\//.test(value),
      "Must be a local Blog image or HTTPS URL",
    )
    .optional(),
  cover_image_id: z.string().optional(),
  canonical_url: z.string().url("Must be a valid URL").optional().or(z.literal("")),
  published_at: z.string().optional(),
  tags: z.array(z.string()).optional(),
});

type BlogFormValues = z.infer<typeof blogSchema>;

interface BlogFormProps {
  initialData?: BlogFormValues & { id?: string; updated_at?: string };
}

function toLocalDateTime(value?: string) {
  if (!value) return "";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "";
  const offset = date.getTimezoneOffset() * 60_000;
  return new Date(date.getTime() - offset).toISOString().slice(0, 16);
}

export function BlogForm({ initialData }: BlogFormProps) {
  const router = useRouter();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState("");
  const [tagInput, setTagInput] = useState("");
  const [isMediaPickerOpen, setIsMediaPickerOpen] = useState(false);
  const slugEdited = useRef(Boolean(initialData?.id));

  const {
    register,
    handleSubmit,
    control,
    watch,
    setValue,
    formState: { errors },
  } = useForm<BlogFormValues>({
    resolver: zodResolver(blogSchema),
    defaultValues: initialData ? {
      ...initialData,
      published_at: toLocalDateTime(initialData.published_at),
    } : {
      title: "",
      slug: "",
      summary: "",
      content: "",
      status: "draft",
      cover_image_url: "",
      cover_image_id: "",
      canonical_url: "",
      published_at: "",
      tags: [],
    },
  });

  const tags = watch("tags") || [];

  const addTag = () => {
    if (tagInput.trim() && !tags.includes(tagInput.trim())) {
      setValue("tags", [...tags, tagInput.trim()]);
      setTagInput("");
    }
  };

  const removeTag = (tagToRemove: string) => {
    setValue("tags", tags.filter(tag => tag !== tagToRemove));
  };

  const onSubmit = async (data: BlogFormValues) => {
    setIsSubmitting(true);
    setErrorMsg("");
    try {
      const res = await fetch("/api/admin/blogs", {
        method: initialData?.id ? "PUT" : "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(
          initialData?.id
            ? {
                id: initialData.id,
                updated_at: initialData.updated_at,
                ...data,
                published_at: data.published_at
                  ? new Date(data.published_at).toISOString()
                  : "",
              }
            : {
                ...data,
                published_at: data.published_at
                  ? new Date(data.published_at).toISOString()
                  : "",
              },
        ),
      });

      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.error || "Failed to save blog post");
      }

      router.push("/admin/blogs?saved=1");
      router.refresh();
    } catch (err: any) {
      setErrorMsg(err.message);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-8">
      {errorMsg && (
        <div role="alert" className="rounded-lg bg-red-50 p-4 text-sm text-red-500 dark:bg-red-950/30">
          {errorMsg}
        </div>
      )}
      
      <div className="grid gap-6 md:grid-cols-2">
        <div className="space-y-2">
          <label htmlFor="blog-title" className="text-sm font-medium">Title</label>
          <input
            {...register("title", {
              onChange: (event) => {
                if (!slugEdited.current) setValue("slug", normalizeBlogSlug(event.target.value));
              },
            })}
            id="blog-title"
            className="w-full rounded-xl border border-border-hairline bg-surface-base px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-accent-signal"
            placeholder="Post Title"
          />
          {errors.title && <p className="text-xs text-red-500">{errors.title.message}</p>}
        </div>

        <div className="space-y-2">
          <label htmlFor="blog-slug" className="text-sm font-medium">Slug</label>
          <input
            {...register("slug", { onChange: () => { slugEdited.current = true; } })}
            id="blog-slug"
            className="w-full rounded-xl border border-border-hairline bg-surface-base px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-accent-signal"
            placeholder="post-slug"
          />
          {errors.slug && <p className="text-xs text-red-500">{errors.slug.message}</p>}
        </div>
      </div>

      <div className="space-y-2">
        <label htmlFor="blog-summary" className="text-sm font-medium">Summary</label>
        <textarea
          {...register("summary")}
          id="blog-summary"
          rows={3}
          className="w-full rounded-xl border border-border-hairline bg-surface-base px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-accent-signal"
          placeholder="Optional: generated from the article on first save"
        />
      </div>

      <div className="grid gap-6 md:grid-cols-2">
        <div className="space-y-2">
          <label htmlFor="blog-status" className="text-sm font-medium">Status</label>
          <select
            {...register("status")}
            id="blog-status"
            className="w-full rounded-xl border border-border-hairline bg-surface-base px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-accent-signal"
          >
            <option value="draft">Draft</option>
            <option value="published">Published</option>
          </select>
        </div>

        <div className="space-y-2">
          <label htmlFor="blog-published-at" className="text-sm font-medium">Publish Date (Optional)</label>
          <input
            type="datetime-local"
            {...register("published_at")}
            id="blog-published-at"
            className="w-full rounded-xl border border-border-hairline bg-surface-base px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-accent-signal"
          />
        </div>
      </div>

      <div className="grid gap-6 md:grid-cols-2">
        <div className="space-y-2">
          <label htmlFor="blog-cover-url" className="text-sm font-medium">Cover Image</label>
          <div className="flex gap-2">
            <input
              {...register("cover_image_url", { onChange: () => setValue("cover_image_id", "") })}
              id="blog-cover-url"
              className="flex-1 rounded-xl border border-border-hairline bg-surface-base px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-accent-signal"
              placeholder="https://... or choose from library"
            />
            <button
              type="button"
              onClick={() => setIsMediaPickerOpen(true)}
              className="px-3 py-2 bg-surface-raised border border-border-hairline rounded-xl hover:bg-surface-base transition-colors flex items-center gap-2 text-sm font-medium"
            >
              <ImageIcon className="h-4 w-4" /> Pick
            </button>
          </div>
          {errors.cover_image_url && <p className="text-xs text-red-500">{errors.cover_image_url.message}</p>}
          
          <MediaPickerModal
            isOpen={isMediaPickerOpen}
            onClose={() => setIsMediaPickerOpen(false)}
            onSelect={(media) => {
              setValue("cover_image_url", media.secure_url || media.url);
              setValue("cover_image_id", media.id);
            }}
          />
        </div>

        <div className="space-y-2">
          <label htmlFor="blog-canonical-url" className="text-sm font-medium">Canonical URL (SEO)</label>
          <input
            {...register("canonical_url")}
            id="blog-canonical-url"
            className="w-full rounded-xl border border-border-hairline bg-surface-base px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-accent-signal"
            placeholder="https://..."
          />
          {errors.canonical_url && <p className="text-xs text-red-500">{errors.canonical_url.message}</p>}
        </div>
      </div>

      <div className="space-y-2">
        <label htmlFor="blog-tag-input" className="text-sm font-medium">Tags</label>
        <div className="flex flex-wrap gap-2 mb-2">
          {tags.map(tag => (
            <span key={tag} className="inline-flex items-center gap-1 px-3 py-1 bg-surface-base border border-border-hairline rounded-full text-xs">
              {tag}
              <button type="button" onClick={() => removeTag(tag)} aria-label={`Remove ${tag} tag`} className="text-ink-secondary hover:text-red-500">
                <X className="h-3 w-3" />
              </button>
            </span>
          ))}
        </div>
        <div className="flex gap-2">
          <input
            type="text"
            id="blog-tag-input"
            value={tagInput}
            onChange={e => setTagInput(e.target.value)}
            onKeyDown={e => e.key === "Enter" && (e.preventDefault(), addTag())}
            className="flex-1 rounded-xl border border-border-hairline bg-surface-base px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-accent-signal"
            placeholder="Add a tag and press Enter"
          />
          <button
            type="button"
            onClick={addTag}
            aria-label="Add tag"
            className="px-4 py-2 bg-surface-raised border border-border-hairline rounded-xl hover:bg-surface-base transition-colors"
          >
            <Plus className="h-4 w-4" />
          </button>
        </div>
      </div>

      <div className="space-y-2">
        <label htmlFor={initialData?.id ? "blog-content-source" : undefined} className="text-sm font-medium">Content</label>
        {initialData?.id && (
          <p className="text-sm text-ink-secondary">
            Edit the original Markdown/MDX directly. The rich editor can remove embeds and custom formatting from existing articles.
          </p>
        )}
        <Controller
          name="content"
          control={control}
          render={({ field }) => (
            initialData?.id ? (
              <textarea
                {...field}
                id="blog-content-source"
                spellCheck={false}
                rows={22}
                className="w-full rounded-xl border border-border-hairline bg-surface-base p-4 font-mono text-sm leading-6 text-ink-primary focus:outline-none focus:ring-2 focus:ring-accent-signal"
              />
            ) : (
              <TiptapEditor value={field.value} onChange={field.onChange} label="Blog article content" blogTools />
            )
          )}
        />
        {errors.content && <p className="text-xs text-red-500">{errors.content.message}</p>}
      </div>

      <div className="flex justify-end gap-4">
        {initialData?.id && (
          <Link
            href={`/admin/blogs/${initialData.id}/preview`}
            className="rounded-xl px-4 py-2 text-sm font-medium text-accent-signal underline focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent-signal"
          >
            Preview saved post
          </Link>
        )}
        <button
          type="button"
          onClick={() => router.back()}
          className="rounded-xl px-4 py-2 text-sm font-medium text-ink-secondary hover:bg-surface-base transition-colors"
        >
          Cancel
        </button>
        <button
          type="submit"
          disabled={isSubmitting}
          className="inline-flex items-center justify-center rounded-xl bg-accent-signal px-6 py-2 text-sm font-medium text-white shadow hover:bg-accent-signal/90 focus:outline-none disabled:opacity-50 transition-all"
        >
          {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
          Save Post
        </button>
      </div>
    </form>
  );
}
