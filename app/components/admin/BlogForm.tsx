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
import { normalizeBlogSlug, serializeBlogPublishDate, toLocalBlogDateTime } from "@/app/lib/blog-defaults";
import { isAllowedBlogImageUrl } from "@/app/components/blog/blogImage";

const TiptapEditor = dynamic(() => import("./TiptapEditor").then((module) => module.TiptapEditor), { ssr: false });

const blogSchema = z.object({
  title: z.string().min(1, "Title is required").max(200, "Title must be 200 characters or fewer"),
  slug: z.string().min(1, "Slug is required").max(300).refine((value) => normalizeBlogSlug(value).length <= 200, "Slug must be 200 characters or fewer"),
  summary: z.string().max(1000, "Summary must be 1000 characters or fewer").optional(),
  content: z.string().min(1, "Content is required").max(1_000_000, "Article is too long").refine((value) => value.trim().length > 0, "Content is required"),
  status: z.enum(["draft", "published"]),
  cover_image_url: z
    .string()
    .refine(
      (value) => !value || value.startsWith("/blog/") || isAllowedBlogImageUrl(value),
      "Choose a local Blog image or an approved HTTPS image host",
    )
    .optional(),
  cover_image_id: z.string().optional(),
  canonical_url: z.string().url("Must be a valid URL").refine((value) => {
    if (!value) return true;
    try {
      const url = new URL(value);
      return ["http:", "https:"].includes(url.protocol) && !url.username && !url.password;
    } catch {
      return false;
    }
  }, "Use an HTTP(S) URL without credentials").optional().or(z.literal("")),
  published_at: z.string().refine((value) => !value || !Number.isNaN(Date.parse(value)), "Choose a valid publish date").optional(),
  tags: z.array(z.string().trim().min(1).max(50)).max(25).optional(),
});

type BlogFormValues = z.infer<typeof blogSchema>;

interface BlogFormProps {
  initialData?: BlogFormValues & { id?: string; updated_at?: string; editor_mode?: "source" | "rich" };
}

export function BlogForm({ initialData }: BlogFormProps) {
  const router = useRouter();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState("");
  const [tagInput, setTagInput] = useState("");
  const [isMediaPickerOpen, setIsMediaPickerOpen] = useState(false);
  const slugEdited = useRef(Boolean(initialData?.id));
  const richContentEdited = useRef(false);
  const richEditor = !initialData?.id || initialData.editor_mode === "rich";

  const {
    register,
    handleSubmit,
    control,
    watch,
    setValue,
    setError,
    clearErrors,
    formState: { errors },
  } = useForm<BlogFormValues>({
    resolver: zodResolver(blogSchema),
    defaultValues: initialData ? {
      ...initialData,
      summary: initialData.summary || "",
      cover_image_url: initialData.cover_image_url || "",
      cover_image_id: initialData.cover_image_id || "",
      canonical_url: initialData.canonical_url || "",
      published_at: toLocalBlogDateTime(initialData.published_at),
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
  const status = watch("status");
  const scheduled = status === "published" && Date.parse(watch("published_at") || "") > Date.now();

  const addTag = () => {
    const value = tagInput.trim();
    if (!value || tags.includes(value)) return;
    if (value.length > 50 || !/[\p{L}\p{N}]/u.test(value) || tags.length >= 25) {
      setError("tags", { message: "Use up to 25 tags of at most 50 characters, each with a letter or number." });
      return;
    }
    clearErrors("tags");
    setValue("tags", [...tags, value]);
    setTagInput("");
  };

  const removeTag = (tagToRemove: string) => {
    setValue("tags", tags.filter(tag => tag !== tagToRemove));
  };

  const onSubmit = async (data: BlogFormValues) => {
    const publishedAt = serializeBlogPublishDate(data.published_at, initialData?.published_at);
    const content = richEditor && initialData?.id && !richContentEdited.current ? initialData.content : data.content;
    const publicationChanged = Boolean(initialData?.id && initialData.status === "published" && publishedAt !== initialData.published_at);
    if ((data.status !== initialData?.status || publicationChanged) && (data.status === "published" || initialData?.status === "published")) {
      const action = data.status === "draft"
        ? "Unpublish this post? It will disappear from the public Blog and return to drafts."
        : publishedAt && Date.parse(publishedAt) > Date.now()
          ? "Schedule this post? It will become public automatically at the selected time."
          : "Publish this post now? It will become public as soon as it is saved.";
      if (!window.confirm(action)) return;
    }
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
                 content,
                 published_at: publishedAt,
              }
            : {
                 ...data,
                 content,
                 published_at: publishedAt,
              },
        ),
      });

      if (!res.ok) {
        const err = await res.json();
        if (err.issues?.fieldErrors) {
          for (const [name, messages] of Object.entries(err.issues.fieldErrors)) {
            if (name in blogSchema.shape && Array.isArray(messages) && typeof messages[0] === "string") {
              setError(name as keyof BlogFormValues, { message: messages[0] });
            }
          }
        }
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
    <form onSubmit={handleSubmit(onSubmit)} className="min-w-0 space-y-8">
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
        {errors.summary && <p className="text-xs text-red-500">{errors.summary.message}</p>}
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
          <p className="text-xs text-ink-secondary">Publishing without a future date makes this post public when saved.</p>
        </div>

        <div className="space-y-2">
          <label htmlFor="blog-published-at" className="text-sm font-medium">Publish Date (Optional)</label>
          <input
            type="datetime-local"
            {...register("published_at")}
            id="blog-published-at"
            className="w-full rounded-xl border border-border-hairline bg-surface-base px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-accent-signal"
          />
          {errors.published_at && <p className="text-xs text-red-500">{errors.published_at.message}</p>}
        </div>
      </div>

      <div className="grid grid-cols-[minmax(0,1fr)] gap-6 md:grid-cols-2">
        <div className="min-w-0 space-y-2">
          <label htmlFor="blog-cover-url" className="text-sm font-medium">Cover Image</label>
          <div className="flex gap-2">
            <input
              {...register("cover_image_url", { onChange: () => setValue("cover_image_id", "") })}
              id="blog-cover-url"
              className="min-w-0 flex-1 rounded-xl border border-border-hairline bg-surface-base px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-accent-signal"
              placeholder="https://... or choose from library"
            />
            <button
              type="button"
              onClick={() => setIsMediaPickerOpen(true)}
              className="flex shrink-0 items-center gap-2 rounded-xl border border-border-hairline bg-surface-raised px-3 py-2 text-sm font-medium transition-colors hover:bg-surface-base"
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

        <div className="min-w-0 space-y-2">
          <label htmlFor="blog-canonical-url" className="text-sm font-medium">Canonical URL (SEO)</label>
          <input
            {...register("canonical_url")}
            id="blog-canonical-url"
            className="min-w-0 w-full rounded-xl border border-border-hairline bg-surface-base px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-accent-signal"
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
            className="min-w-0 flex-1 rounded-xl border border-border-hairline bg-surface-base px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-accent-signal"
            placeholder="Add a tag and press Enter"
          />
          <button
            type="button"
            onClick={addTag}
            aria-label="Add tag"
            className="shrink-0 rounded-xl border border-border-hairline bg-surface-raised px-4 py-2 transition-colors hover:bg-surface-base"
          >
            <Plus className="h-4 w-4" />
          </button>
        </div>
        {errors.tags && <p className="text-xs text-red-500">{errors.tags.message}</p>}
      </div>

      <div className="space-y-2">
        <label htmlFor={!richEditor ? "blog-content-source" : undefined} className="text-sm font-medium">Content</label>
        {!richEditor && (
          <p className="text-sm text-ink-secondary">
            Edit the original Markdown/MDX directly. The rich editor can remove embeds and custom formatting from existing articles.
          </p>
        )}
        <Controller
          name="content"
          control={control}
          render={({ field }) => (
            !richEditor ? (
              <textarea
                {...field}
                id="blog-content-source"
                spellCheck={false}
                rows={22}
                className="w-full rounded-xl border border-border-hairline bg-surface-base p-4 font-mono text-sm leading-6 text-ink-primary focus:outline-none focus:ring-2 focus:ring-accent-signal"
              />
            ) : (
              <TiptapEditor value={field.value} onChange={(value) => {
                richContentEdited.current = true;
                field.onChange(value);
              }} label="Blog article content" blogTools />
            )
          )}
        />
        {errors.content && <p className="text-xs text-red-500">{errors.content.message}</p>}
      </div>

      <div className="flex flex-wrap justify-end gap-4">
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
          {status === "published" && initialData?.status !== "published"
            ? scheduled ? "Schedule Post" : "Publish Post"
            : status === "draft" && initialData?.status === "published"
              ? "Unpublish Post"
              : status === "draft" && !initialData?.id ? "Save Draft" : "Save Post"}
        </button>
      </div>
    </form>
  );
}
