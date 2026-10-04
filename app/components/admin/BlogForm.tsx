"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import dynamic from "next/dynamic";
import { useForm, Controller } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { Loader2, Plus, X, Image as ImageIcon } from "lucide-react";
import { MediaPickerModal } from "./MediaPickerModal";
import { AdminConfirmDialog } from "./AdminConfirmDialog";
import { canUseVisualBlogEditor } from "@/app/lib/admin/blog-visual-eligibility";
import { normalizeBlogSlug, serializeBlogPublishDate, toLocalBlogDateTime } from "@/app/lib/blog-defaults";
import { isAllowedBlogImageUrl } from "@/app/components/blog/blogImage";

const TiptapEditor = dynamic(() => import("./TiptapEditor").then((module) => module.TiptapEditor), { ssr: false });
const BlogCodeEditor = dynamic(() => import("./BlogCodeEditor").then((module) => module.BlogCodeEditor), { ssr: false });
const BlogUnsavedPreview = dynamic(() => import("./BlogUnsavedPreview").then((module) => module.BlogUnsavedPreview), { ssr: false, loading: () => <p role="status" className="p-6 text-center text-sm text-ink-secondary">Loading preview...</p> });

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
  related_blog_post_ids: z.array(z.string().uuid()).max(3, "Choose no more than three posts").refine((ids) => new Set(ids).size === ids.length, "Choose different posts"),
});

type BlogFormValues = z.infer<typeof blogSchema>;

interface BlogFormProps {
  initialData?: BlogFormValues & { id?: string; updated_at?: string; editor_mode?: "source" | "rich" };
  availablePosts: Array<{ id: string; title: string; slug: string; status: string; published_at: string | null }>;
}

export function BlogForm({ initialData, availablePosts }: BlogFormProps) {
  const router = useRouter();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState("");
  const [tagInput, setTagInput] = useState("");
  const [relatedSearch, setRelatedSearch] = useState("");
  const [isMediaPickerOpen, setIsMediaPickerOpen] = useState(false);
  const [confirmation, setConfirmation] = useState<{ title: string; description: string; label: string; data: BlogFormValues; publishedAt: string; content: string } | null>(null);
  const [leaveTarget, setLeaveTarget] = useState<"list" | "preview" | null>(null);
  const [editorMode, setEditorMode] = useState<"rich" | "source" | "preview">(
    initialData?.id && (initialData.editor_mode !== "rich" || !canUseVisualBlogEditor(initialData.content)) ? "source" : "rich"
  );
  const [modeError, setModeError] = useState("");
  const [previewSnapshot, setPreviewSnapshot] = useState<Pick<BlogFormValues, "title" | "summary" | "content" | "cover_image_url" | "published_at" | "status"> | null>(null);
  const slugEdited = useRef(Boolean(initialData?.id));
  const richContentEdited = useRef(false);
  const richEditor = editorMode === "rich";

  const {
    register,
    handleSubmit,
    control,
    watch,
    setValue,
    getValues,
    setError,
    clearErrors,
    formState: { errors, isDirty },
  } = useForm<BlogFormValues>({
    resolver: zodResolver(blogSchema),
    defaultValues: initialData ? {
      ...initialData,
      summary: initialData.summary || "",
      cover_image_url: initialData.cover_image_url || "",
      cover_image_id: initialData.cover_image_id || "",
      canonical_url: initialData.canonical_url || "",
      published_at: toLocalBlogDateTime(initialData.published_at),
      related_blog_post_ids: initialData.related_blog_post_ids ?? [],
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
      related_blog_post_ids: [],
    },
  });

  const tags = watch("tags") || [];
  const status = watch("status");
  const selectedRelatedIds = watch("related_blog_post_ids") || [];
  const relatedOptions = availablePosts.filter((item) => item.id !== initialData?.id && `${item.title} ${item.slug}`.toLowerCase().includes(relatedSearch.trim().toLowerCase()));
  const scheduled = status === "published" && Date.parse(watch("published_at") || "") > Date.now();
  const publishingNow = status === "published" && initialData?.status === "published" && !watch("published_at") && Date.parse(initialData.published_at || "") > Date.now();

  const refreshPreview = () => {
    const data = getValues();
    setPreviewSnapshot({
      title: data.title,
      summary: data.summary,
      content: data.content,
      cover_image_url: data.cover_image_url,
      published_at: data.published_at ? serializeBlogPublishDate(data.published_at, initialData?.published_at) : "",
      status: data.status,
    });
  };

  const switchMode = (next: "rich" | "source" | "preview") => {
    if (next === editorMode) return true;
    if (next === "rich" && !canUseVisualBlogEditor(getValues("content") || "")) {
      setModeError("This MDX uses syntax the visual editor cannot preserve safely. Edit it in MDX / Code or use Preview to inspect the rendered article.");
      return false;
    }
    setModeError("");
    setEditorMode(next);
    if (next === "preview") refreshPreview();
    return true;
  };

  useEffect(() => {
    if (!isDirty && !tagInput.trim()) return;
    const warn = (event: BeforeUnloadEvent) => {
      event.preventDefault();
      event.returnValue = "";
    };
    window.addEventListener("beforeunload", warn);
    return () => window.removeEventListener("beforeunload", warn);
  }, [isDirty, tagInput]);

  const leave = (target: "list" | "preview") => {
    if (isSubmitting) return;
    if (isDirty || tagInput.trim()) setLeaveTarget(target);
    else router.push(target === "list" ? "/admin/blogs" : `/admin/blogs/${initialData?.id}/preview`);
  };

  const addTag = () => {
    const value = tagInput.trim();
    if (!value || tags.includes(value)) return;
    if (value.length > 50 || !/[\p{L}\p{N}]/u.test(value) || tags.length >= 25) {
      setError("tags", { message: "Use up to 25 tags of at most 50 characters, each with a letter or number." });
      return;
    }
    clearErrors("tags");
    setValue("tags", [...tags, value], { shouldDirty: true });
    setTagInput("");
  };

  const removeTag = (tagToRemove: string) => {
    setValue("tags", tags.filter(tag => tag !== tagToRemove), { shouldDirty: true });
  };

  const savePost = async (data: BlogFormValues, publishedAt: string, content: string) => {
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

  const onSubmit = async (data: BlogFormValues) => {
    const publishedAt = data.status === "published" && !data.published_at
      ? new Date().toISOString()
      : serializeBlogPublishDate(data.published_at, initialData?.published_at);
    const content = richEditor && initialData?.id && !richContentEdited.current && data.content === initialData.content ? initialData.content : data.content;
    const publicationChanged = Boolean(initialData?.id && initialData.status === "published" && publishedAt !== initialData.published_at);
    if ((data.status !== initialData?.status || publicationChanged) && (data.status === "published" || initialData?.status === "published")) {
      setConfirmation(data.status === "draft"
        ? { title: "Unpublish this post?", description: "It will leave the public Blog and return to drafts. You can publish it again later.", label: "Move to draft", data, publishedAt, content }
        : publishedAt && Date.parse(publishedAt) > Date.now()
          ? { title: "Schedule this post?", description: "It will become public automatically at the selected time.", label: "Schedule post", data, publishedAt, content }
          : { title: "Publish this post?", description: "It will become visible on the public Blog as soon as it is saved.", label: "Publish now", data, publishedAt, content });
      return;
    }
    await savePost(data, publishedAt, content);
  };

  return (
    <>
    <form onSubmit={handleSubmit(onSubmit)} className="min-w-0 space-y-8">
      {errorMsg && (
        <div role="alert" className="rounded-2xl border border-red-500/30 bg-red-950/30 p-4 text-sm text-red-300">
          {errorMsg}
        </div>
      )}
      
      <div className="grid gap-6 md:grid-cols-2">
        <div className="space-y-2">
          <label htmlFor="blog-title" className="text-sm font-medium">Title</label>
          <input
            {...register("title", {
              onChange: (event) => {
                if (!slugEdited.current) setValue("slug", normalizeBlogSlug(event.target.value), { shouldDirty: true });
              },
            })}
            id="blog-title"
            aria-invalid={Boolean(errors.title)}
            aria-describedby={errors.title ? "blog-title-error" : undefined}
            className="w-full rounded-xl border border-border-hairline bg-surface-base px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-accent-signal"
            placeholder="Post Title"
          />
          {errors.title && <p id="blog-title-error" role="alert" className="text-xs text-red-500">{errors.title.message}</p>}
        </div>

        <div className="space-y-2">
          <label htmlFor="blog-slug" className="text-sm font-medium">Slug</label>
          <input
            {...register("slug", { onChange: () => { slugEdited.current = true; } })}
            id="blog-slug"
            aria-invalid={Boolean(errors.slug)}
            aria-describedby={errors.slug ? "blog-slug-error" : undefined}
            className="w-full rounded-xl border border-border-hairline bg-surface-base px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-accent-signal"
            placeholder="post-slug"
          />
          {errors.slug && <p id="blog-slug-error" role="alert" className="text-xs text-red-500">{errors.slug.message}</p>}
        </div>
      </div>

      <div className="space-y-2">
        <label htmlFor="blog-summary" className="text-sm font-medium">Summary</label>
        <textarea
          {...register("summary")}
          id="blog-summary"
          aria-invalid={Boolean(errors.summary)}
          aria-describedby={errors.summary ? "blog-summary-error" : undefined}
          rows={3}
          className="w-full rounded-xl border border-border-hairline bg-surface-base px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-accent-signal"
          placeholder="Optional: generated from the article on first save"
        />
        {errors.summary && <p id="blog-summary-error" role="alert" className="text-xs text-red-500">{errors.summary.message}</p>}
      </div>

      <div className="grid gap-6 md:grid-cols-2">
        <div className="space-y-2">
          <label htmlFor="blog-status" className="text-sm font-medium">Status</label>
          <select
            {...register("status")}
            id="blog-status"
            aria-invalid={Boolean(errors.status)}
            aria-describedby={errors.status ? "blog-status-error" : undefined}
            className="w-full rounded-xl border border-border-hairline bg-surface-base px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-accent-signal"
          >
            <option value="draft">Draft</option>
            <option value="published">Published</option>
          </select>
          <p className="text-xs text-ink-secondary">Publishing without a future date makes this post public when saved.</p>
          {errors.status && <p id="blog-status-error" role="alert" className="text-xs text-red-500">{errors.status.message}</p>}
        </div>

        <div className="space-y-2">
          <label htmlFor="blog-published-at" className="text-sm font-medium">Publish Date (Optional)</label>
          <input
            type="datetime-local"
            {...register("published_at")}
            id="blog-published-at"
            aria-invalid={Boolean(errors.published_at)}
            aria-describedby={errors.published_at ? "blog-published-at-error" : "blog-published-at-hint"}
            className="w-full rounded-xl border border-border-hairline bg-surface-base px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-accent-signal"
          />
          <p id="blog-published-at-hint" className="text-xs text-ink-secondary">Times use your local timezone. Clear this field to publish immediately when the status is Published.</p>
          {errors.published_at && <p id="blog-published-at-error" role="alert" className="text-xs text-red-500">{errors.published_at.message}</p>}
        </div>
      </div>

      <div className="grid grid-cols-[minmax(0,1fr)] gap-6 md:grid-cols-2">
        <div className="min-w-0 space-y-2">
          <label htmlFor="blog-cover-url" className="text-sm font-medium">Cover Image</label>
          <div className="flex gap-2">
            <input
              {...register("cover_image_url", { onChange: () => setValue("cover_image_id", "", { shouldDirty: true }) })}
              id="blog-cover-url"
              aria-invalid={Boolean(errors.cover_image_url)}
              aria-describedby={errors.cover_image_url ? "blog-cover-url-error" : undefined}
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
          {errors.cover_image_url && <p id="blog-cover-url-error" role="alert" className="text-xs text-red-500">{errors.cover_image_url.message}</p>}
          
          <MediaPickerModal
            isOpen={isMediaPickerOpen}
            onClose={() => setIsMediaPickerOpen(false)}
            onSelect={(media) => {
              setValue("cover_image_url", media.secure_url || media.url, { shouldDirty: true, shouldValidate: true });
              setValue("cover_image_id", media.id, { shouldDirty: true });
            }}
          />
        </div>

        <div className="min-w-0 space-y-2">
          <label htmlFor="blog-canonical-url" className="text-sm font-medium">Canonical URL (SEO)</label>
          <input
            {...register("canonical_url")}
            id="blog-canonical-url"
            aria-invalid={Boolean(errors.canonical_url)}
            aria-describedby={errors.canonical_url ? "blog-canonical-url-error" : undefined}
            className="min-w-0 w-full rounded-xl border border-border-hairline bg-surface-base px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-accent-signal"
            placeholder="https://..."
          />
          {errors.canonical_url && <p id="blog-canonical-url-error" role="alert" className="text-xs text-red-500">{errors.canonical_url.message}</p>}
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
            aria-invalid={Boolean(errors.tags)}
            aria-describedby={errors.tags ? "blog-tags-error" : undefined}
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
        {errors.tags && <p id="blog-tags-error" role="alert" className="text-xs text-red-500">{errors.tags.message}</p>}
      </div>

      <fieldset aria-describedby={errors.related_blog_post_ids ? "blog-related-error" : undefined} className="space-y-3 rounded-xl border border-border-hairline p-4">
        <legend className="px-1 text-sm font-medium">Related posts</legend>
        <p className="text-xs text-ink-secondary">Choose up to three live published posts. They appear in the order selected. Leave empty to hide the section.</p>
        <p className="text-xs font-medium text-ink-secondary">Selected {selectedRelatedIds.length} / 3</p>
        {selectedRelatedIds.length > 0 && <ol className="space-y-1">
          {selectedRelatedIds.map((id, index) => {
            const chosen = availablePosts.find((item) => item.id === id);
            return <li key={id} className="flex items-center justify-between gap-3 rounded-lg bg-surface-base px-3 py-2 text-sm text-ink-primary">
              <span className="min-w-0 break-words">{index + 1}. {chosen?.title || "Post no longer available"}</span>
              <button type="button" onClick={() => setValue("related_blog_post_ids", selectedRelatedIds.filter((value) => value !== id), { shouldDirty: true, shouldValidate: true })} className="shrink-0 text-xs text-ink-secondary underline underline-offset-2 hover:text-ink-primary">Remove</button>
            </li>;
          })}
        </ol>}
        <label htmlFor="related-blog-search" className="sr-only">Search posts for related links</label>
        <input id="related-blog-search" type="search" value={relatedSearch} onChange={(event) => setRelatedSearch(event.target.value)} placeholder="Search all posts..." className="w-full rounded-lg border border-border-hairline bg-surface-base px-3 py-2 text-sm text-ink-primary focus:outline-none focus:ring-2 focus:ring-accent-signal" />
        <div className="max-h-56 space-y-1 overflow-y-auto">
          {relatedOptions.map((item) => {
            const selected = selectedRelatedIds.includes(item.id);
            const live = item.status === "published" && !!item.published_at && Date.parse(item.published_at) <= Date.now();
            const disabled = !selected && (!live || selectedRelatedIds.length >= 3);
            return <label key={item.id} className={`flex items-center gap-3 rounded-lg border border-border-hairline px-3 py-2 text-sm ${disabled ? "cursor-not-allowed opacity-50" : "cursor-pointer hover:bg-surface-base"}`}>
              <input type="checkbox" checked={selected} disabled={disabled} onChange={() => setValue("related_blog_post_ids", selected ? selectedRelatedIds.filter((id) => id !== item.id) : [...selectedRelatedIds, item.id], { shouldDirty: true, shouldValidate: true })} className="size-4 shrink-0 rounded border-border-hairline text-accent-signal focus:ring-accent-signal" />
              <span className="min-w-0 flex-1 break-words text-ink-primary">{item.title}</span>
              <span className="shrink-0 text-xs text-ink-secondary">{selected ? `#${selectedRelatedIds.indexOf(item.id) + 1}` : live ? "published" : item.status === "published" ? "scheduled" : item.status}</span>
            </label>;
          })}
          {relatedOptions.length === 0 && <p className="px-3 py-4 text-sm text-ink-secondary">No matching posts.</p>}
        </div>
        {errors.related_blog_post_ids && <p id="blog-related-error" role="alert" className="text-xs text-red-500">{errors.related_blog_post_ids.message}</p>}
      </fieldset>

      <div className="space-y-2">
        <div className="flex flex-wrap items-end justify-between gap-3">
          <div>
            <p className="text-sm font-medium">Content</p>
            <p className="mt-1 text-xs text-ink-secondary">Write visually, edit MDX directly, or inspect an unsaved article preview.</p>
          </div>
          <div role="tablist" aria-label="Blog writing mode" className="inline-flex flex-wrap gap-1 rounded-2xl border border-border-hairline bg-surface-base p-1">
            {(["rich", "source", "preview"] as const).map((mode) => (
              <button key={mode} type="button" id={`blog-mode-${mode}`} role="tab" tabIndex={editorMode === mode ? 0 : -1} aria-selected={editorMode === mode} aria-controls="blog-editor-panel" onClick={() => switchMode(mode)} onKeyDown={(event) => {
                if (event.key !== "ArrowLeft" && event.key !== "ArrowRight") return;
                event.preventDefault();
                const tabs = ["rich", "source", "preview"] as const;
                const next = tabs[(tabs.indexOf(editorMode) + (event.key === "ArrowRight" ? 1 : 2)) % tabs.length];
                if (switchMode(next)) document.getElementById(`blog-mode-${next}`)?.focus();
              }} className={`min-h-11 rounded-xl px-4 text-sm font-medium transition-colors focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-white ${editorMode === mode ? "bg-white text-[#101013]" : "text-ink-secondary hover:bg-white/10 hover:text-white"}`}>
                {mode === "rich" ? "Visual Editor" : mode === "source" ? "MDX / Code" : "Preview"}
              </button>
            ))}
          </div>
        </div>
        {modeError && <p role="alert" className="rounded-xl border border-amber-500/30 bg-amber-950/20 p-3 text-sm text-amber-200">{modeError}</p>}
        <p className="text-xs text-ink-secondary">{editorMode === "preview" ? "This is a snapshot of the unsaved article. Refresh after changing fields." : richEditor ? "Switch to MDX / Code to inspect the exact source before saving." : "MDX / Code preserves custom components. Visual editing is available only when the source can be safely represented."} Switching tabs never saves or publishes content.</p>
        <div id="blog-editor-panel" role="tabpanel" aria-labelledby={`blog-mode-${editorMode}`} className="min-w-0">
        {editorMode === "preview" ? (
          <div className="min-w-0 rounded-2xl border border-border-primary bg-bg-primary p-3 sm:p-5">
            <div className="mb-4 flex flex-wrap items-center justify-between gap-3 border-b border-border-primary pb-4">
              <p className="text-sm text-ink-secondary">Unsaved preview using the public article renderer.</p>
              <button type="button" onClick={refreshPreview} className="min-h-11 rounded-full border border-border-primary px-4 text-sm font-medium text-ink-primary transition-colors hover:bg-white/10">Refresh preview</button>
            </div>
            {previewSnapshot && <BlogUnsavedPreview snapshot={previewSnapshot} isNew={!initialData?.id} />}
          </div>
        ) : <Controller
          name="content"
          control={control}
          render={({ field }) => (
            editorMode === "source" ? (
              <BlogCodeEditor value={field.value || ""} onChange={field.onChange} errorId={errors.content ? "blog-content-error" : undefined} />
            ) : (
              <TiptapEditor value={field.value} errorId={errors.content ? "blog-content-error" : undefined} onChange={(value) => {
                richContentEdited.current = true;
                field.onChange(value);
              }} label="Blog article content" blogTools />
            )
          )}
        />}
        </div>
        {errors.content && <p id="blog-content-error" role="alert" className="text-xs text-red-500">{errors.content.message}</p>}
      </div>

      <div className="flex flex-wrap justify-end gap-4">
        {initialData?.id && (
            <Link
              href={`/admin/blogs/${initialData.id}/preview`}
              onClick={(event) => { if (isDirty || tagInput.trim()) { event.preventDefault(); leave("preview"); } }}
            className="inline-flex min-h-11 items-center rounded-xl px-4 py-2 text-sm font-medium text-accent-signal underline focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent-signal"
          >
            Preview saved post
          </Link>
        )}
        <button
          type="button"
          onClick={() => leave("list")}
          className="min-h-11 rounded-xl px-4 py-2 text-sm font-medium text-ink-secondary hover:bg-surface-base transition-colors"
        >
          Cancel
        </button>
        <button
          type="submit"
          disabled={isSubmitting}
          className="inline-flex items-center justify-center rounded-xl bg-accent-signal px-6 py-2 text-sm font-medium text-white shadow hover:bg-accent-signal/90 focus:outline-none disabled:opacity-50 transition-all"
        >
          {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
          {publishingNow ? "Publish Now" : status === "published" && initialData?.status !== "published"
            ? scheduled ? "Schedule Post" : "Publish Post"
            : status === "draft" && initialData?.status === "published"
              ? "Unpublish Post"
              : status === "draft" && !initialData?.id ? "Save Draft" : "Save Post"}
        </button>
      </div>
    </form>
    <AdminConfirmDialog
      open={confirmation !== null}
      title={confirmation?.title || "Confirm publication"}
      description={confirmation?.description || ""}
      confirmLabel={confirmation?.label || "Confirm"}
      cancelLabel="Keep editing"
      pending={isSubmitting}
      onClose={() => setConfirmation(null)}
      onConfirm={() => {
        if (!confirmation) return;
        setConfirmation(null);
        void savePost(confirmation.data, confirmation.publishedAt, confirmation.content);
      }}
    />
    <AdminConfirmDialog
      open={leaveTarget !== null}
      title={leaveTarget === "preview" ? "Open saved preview?" : "Discard unsaved changes?"}
      description={leaveTarget === "preview" ? "The preview shows only the last saved version. Unsaved edits will not appear there." : "Your changes on this page have not been saved and will be lost."}
      confirmLabel={leaveTarget === "preview" ? "Open saved preview" : "Discard changes"}
      cancelLabel="Keep editing"
      destructive={leaveTarget === "list"}
      onClose={() => setLeaveTarget(null)}
      onConfirm={() => {
        const target = leaveTarget;
        setLeaveTarget(null);
        if (target) router.push(target === "list" ? "/admin/blogs" : `/admin/blogs/${initialData?.id}/preview`);
      }}
    />
    </>
  );
}
