"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import dynamic from "next/dynamic";
import { Listbox, ListboxButton, ListboxOption, ListboxOptions } from "@headlessui/react";
import { useForm, Controller } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { Check, ChevronDown, Loader2, Plus, X } from "lucide-react";
import { BlogImageManager, type BlogMediaItem } from "./BlogImageManager";
import { BlogDatePicker } from "./BlogDatePicker";
import { AdminConfirmDialog } from "./AdminConfirmDialog";
import { canUseVisualBlogEditor } from "@/app/lib/admin/blog-visual-eligibility";
import { blogCanonicalUrl, isValidBlogDate, normalizeBlogSlug, resolveBlogPublishDate, todayUtcDate } from "@/app/lib/blog-defaults";
import { isAllowedBlogImageUrl } from "@/app/components/blog/blogImage";
import { siteMetadata } from "@/app/data/siteMetadata";
import { useAdminNavigationGuard } from "./useAdminNavigationGuard";
import { readAdminResponse } from "@/app/lib/admin/read-admin-response";

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
  image_ids: z.array(z.string().uuid()).max(40).optional(),
  canonical_url: z.string().url("Must be a valid URL").refine((value) => {
    if (!value) return true;
    try {
      const url = new URL(value);
      return ["http:", "https:"].includes(url.protocol) && !url.username && !url.password;
    } catch {
      return false;
    }
  }, "Use an HTTP(S) URL without credentials").optional().or(z.literal("")),
  published_at: z.string().refine((value) => !value || isValidBlogDate(value), "Choose a valid calendar date").optional(),
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
  const [blogImages, setBlogImages] = useState<BlogMediaItem[]>([]);
  const uploadedImages = useRef(new Map<string, BlogMediaItem>());
  const [isUploadingImages, setIsUploadingImages] = useState(false);
  const [isCleaningImages, setIsCleaningImages] = useState(false);
  const [imageManagerAvailable, setImageManagerAvailable] = useState(false);
  const [confirmation, setConfirmation] = useState<{ title: string; description: string; label: string; data: BlogFormValues; publishedAt: string; content: string } | null>(null);
  const [leaveTarget, setLeaveTarget] = useState<"list" | "preview" | null>(null);
  const [editorMode, setEditorMode] = useState<"rich" | "source" | "preview">(
    initialData?.id && (initialData.editor_mode !== "rich" || !canUseVisualBlogEditor(initialData.content)) ? "source" : "rich"
  );
  const [modeError, setModeError] = useState("");
  const [previewSnapshot, setPreviewSnapshot] = useState<Pick<BlogFormValues, "title" | "slug" | "summary" | "content" | "published_at" | "status" | "tags" | "related_blog_post_ids" | "canonical_url"> | null>(null);
  const slugEdited = useRef(Boolean(initialData?.id));
  const canonicalEdited = useRef(Boolean(initialData?.canonical_url && initialData.canonical_url !== blogCanonicalUrl(initialData.slug, siteMetadata.siteUrl)));
  const publishDateEdited = useRef(false);
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
      canonical_url: initialData.canonical_url || blogCanonicalUrl(initialData.slug, siteMetadata.siteUrl),
      published_at: initialData.published_at?.slice(0, 10) || todayUtcDate(),
      related_blog_post_ids: initialData.related_blog_post_ids ?? [],
      image_ids: [],
    } : {
      title: "",
      slug: "",
      summary: "",
      content: "",
      status: "draft",
      cover_image_url: "",
      cover_image_id: "",
      canonical_url: "",
      published_at: todayUtcDate(),
      tags: [],
      related_blog_post_ids: [],
      image_ids: [],
    },
  });
  const { leaveTarget: navigationTarget, setLeaveTarget: setNavigationTarget, confirmLeave } = useAdminNavigationGuard(isDirty || Boolean(tagInput.trim()) || isUploadingImages);

  const tags = watch("tags") || [];
  const status = watch("status");
  const slug = watch("slug");
  const coverUrl = watch("cover_image_url") || "";
  const content = watch("content") || "";
  const ownCanonical = blogCanonicalUrl(slug || "", siteMetadata.siteUrl);
  const selectedRelatedIds = watch("related_blog_post_ids") || [];
  const relatedOptions = availablePosts.filter((item) => item.id !== initialData?.id && `${item.title} ${item.slug}`.toLowerCase().includes(relatedSearch.trim().toLowerCase()));
  const pickedDate = watch("published_at") || "";
  const scheduled = status === "published" && (publishDateEdited.current ? pickedDate > todayUtcDate() : Boolean(initialData?.published_at && Date.parse(initialData.published_at) > Date.now()));
  const publishingNow = status === "published" && initialData?.status === "published" && Boolean(initialData.published_at && Date.parse(initialData.published_at) > Date.now()) && !scheduled;

  useEffect(() => {
    if (!canonicalEdited.current && getValues("canonical_url") !== ownCanonical) {
      setValue("canonical_url", ownCanonical, { shouldDirty: Boolean(isDirty) });
    }
  }, [getValues, ownCanonical, setValue, isDirty]);

  const refreshPreview = () => {
    const data = getValues();
    setPreviewSnapshot({
      title: data.title,
      slug: data.slug,
      summary: data.summary,
      content: data.content,
      published_at: resolveBlogPublishDate({ date: data.published_at || "", edited: publishDateEdited.current, status: data.status, previous: initialData?.published_at, previousStatus: initialData?.status }),
      status: data.status,
      canonical_url: data.canonical_url || ownCanonical,
      tags: data.tags,
      related_blog_post_ids: data.related_blog_post_ids,
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
    if (!isDirty && !tagInput.trim() && !isUploadingImages) return;
    const warn = (event: BeforeUnloadEvent) => {
      event.preventDefault();
      event.returnValue = "";
    };
    window.addEventListener("beforeunload", warn);
    return () => window.removeEventListener("beforeunload", warn);
  }, [isDirty, tagInput, isUploadingImages]);

  const discardUploadedImages = async () => {
    if (isUploadingImages || isCleaningImages) {
      setErrorMsg("Wait for image uploads or cleanup to finish before leaving.");
      return false;
    }
    if (!uploadedImages.current.size) return true;
    setIsCleaningImages(true);
    setErrorMsg("");
    const removed = new Set<string>();
    try {
      for (const [id] of uploadedImages.current) {
        try {
          const response = await fetch(`/api/admin/media?id=${encodeURIComponent(id)}`, { method: "DELETE" });
          const result = await readAdminResponse(response, "Unsaved Blog image cleanup");
          if (!response.ok || result.success !== true) continue;
          uploadedImages.current.delete(id);
          removed.add(id);
        } catch { /* Keep failed files tracked for a retry. */ }
      }
      if (removed.size) {
        setBlogImages((current) => current.filter((image) => !removed.has(image.id)));
        setValue("image_ids", (getValues("image_ids") || []).filter((id) => !removed.has(id)), { shouldDirty: true });
        if (getValues("cover_image_id") && removed.has(getValues("cover_image_id")!)) {
          setValue("cover_image_id", "", { shouldDirty: true });
          setValue("cover_image_url", "", { shouldDirty: true });
        }
      }
      if (uploadedImages.current.size) {
        setErrorMsg(`${uploadedImages.current.size} uploaded image(s) could not be removed. The files remain in the Media Library. Review their references or retry leaving before closing this tab.`);
        return false;
      }
      return true;
    } finally {
      setIsCleaningImages(false);
    }
  };

  const leave = (target: "list" | "preview") => {
    if (isSubmitting || isCleaningImages) return;
    if (isDirty || tagInput.trim() || uploadedImages.current.size || isUploadingImages) setLeaveTarget(target);
    else router.push(target === "list" ? "/admin/blogs" : `/admin/blogs/${initialData?.id}/preview`);
  };

  const addTag = (raw = tagInput, current = tags) => {
    const additions = raw.split(",").map((tag) => tag.trim()).filter(Boolean);
    const next = [...current];
    for (const value of additions) {
      if (!/[\p{L}\p{N}]/u.test(value) || value.length > 50) {
        setError("tags", { message: "Each tag needs a letter or number and must be 50 characters or fewer." });
        return null;
      }
      if (!next.some((tag) => tag.toLocaleLowerCase() === value.toLocaleLowerCase())) next.push(value);
    }
    if (next.length > 10) {
      setError("tags", { message: "Choose no more than 10 tags." });
      return null;
    }
    clearErrors("tags");
    setValue("tags", next, { shouldDirty: true, shouldValidate: true });
    setTagInput("");
    return next;
  };

  const removeTag = (tagToRemove: string) => {
    setValue("tags", tags.filter(tag => tag !== tagToRemove), { shouldDirty: true, shouldValidate: true });
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
                  image_ids: imageManagerAvailable ? data.image_ids : undefined,
                  content,
                 published_at: publishedAt,
              }
            : {
                 ...data,
                 image_ids: imageManagerAvailable ? data.image_ids : undefined,
                 content,
                 published_at: publishedAt,
              },
        ),
      });

      const result = await readAdminResponse(res, "Blog post");
      if (!res.ok) {
        const err = result;
        if (err.issues?.fieldErrors) {
          for (const [name, messages] of Object.entries(err.issues.fieldErrors)) {
            if (name in blogSchema.shape && Array.isArray(messages) && typeof messages[0] === "string") {
              setError(name as keyof BlogFormValues, { message: messages[0] });
            }
          }
        }
        throw new Error(err.error || "Failed to save blog post");
      }
      if (!result?.id) throw new Error("Blog save could not be confirmed. Refresh the list before retrying.");

      uploadedImages.current.clear();
      router.push("/admin/blogs?saved=1");
      router.refresh();
    } catch (err: any) {
      setErrorMsg(err.message);
    } finally {
      setIsSubmitting(false);
    }
  };

  const onSubmit = async (data: BlogFormValues) => {
    if (data.status === "published" && !data.cover_image_url && !(initialData?.status === "published" && !initialData.cover_image_url)) {
      setError("cover_image_url", { message: "Choose a cover image before publishing." });
      return;
    }
    if (tagInput.trim()) {
      const next = addTag(tagInput, data.tags || []);
      if (!next) return;
      data = { ...data, tags: next };
    }
    data = { ...data, canonical_url: data.canonical_url || blogCanonicalUrl(data.slug, siteMetadata.siteUrl) };
    const publishedAt = resolveBlogPublishDate({ date: data.published_at || "", edited: publishDateEdited.current, status: data.status, previous: initialData?.published_at, previousStatus: initialData?.status });
    const content = richEditor && initialData?.id && !richContentEdited.current && data.content === initialData.content ? initialData.content : data.content;
    const publicationChanged = Boolean(initialData?.id && initialData.status === "published" && publishedAt !== initialData.published_at);
    if ((data.status !== initialData?.status || publicationChanged) && (data.status === "published" || initialData?.status === "published")) {
      setConfirmation(data.status === "draft"
        ? { title: "Unpublish this post?", description: "It will leave the public Blog and return to drafts. You can publish it again later.", label: "Move to draft", data, publishedAt, content }
        : publishedAt && Date.parse(publishedAt) > Date.now()
          ? { title: initialData?.status === "published" ? "Reschedule this post?" : "Schedule this post?", description: "It will become public automatically at the selected UTC date. Until then, it will not appear on the Blog.", label: "Schedule post", data, publishedAt, content }
          : initialData?.status === "published" && !publishingNow
            ? { title: "Update the publication date?", description: "This changes the date displayed on the live article. The post remains public.", label: "Update date", data, publishedAt, content }
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
          <p id="blog-status-label" className="text-sm font-medium">Status</p>
          <Controller name="status" control={control} render={({ field }) => <Listbox value={field.value} onChange={field.onChange}>
            <div className="relative">
              <ListboxButton id="blog-status" aria-labelledby="blog-status-label blog-status" aria-invalid={Boolean(errors.status)} aria-describedby={errors.status ? "blog-status-error" : "blog-status-hint"} className="flex min-h-11 w-full items-center justify-between rounded-xl border border-border-hairline bg-surface-base px-3 text-left text-sm focus-visible:outline focus-visible:outline-2 focus-visible:outline-white">
                <span>{field.value === "draft" ? "Draft / Private" : scheduled ? "Scheduled" : "Published / Public"}</span><ChevronDown className="size-4" aria-hidden />
              </ListboxButton>
              <ListboxOptions anchor="bottom" modal={false} className="z-50 w-[var(--button-width)] rounded-xl border border-[#55555e] bg-[#1b1b1f] p-1.5 shadow-2xl [--anchor-gap:6px] focus:outline-none">
                {(["draft", "published"] as const).map((choice) => <ListboxOption key={choice} value={choice} className="group flex min-h-11 cursor-pointer items-center justify-between rounded-lg px-3 text-sm text-white data-[focus]:bg-white/10">
                  <span>{choice === "draft" ? "Draft / Private" : "Published / Public"}</span><Check className="size-4 opacity-0 group-data-[selected]:opacity-100" aria-hidden />
                </ListboxOption>)}
              </ListboxOptions>
            </div>
          </Listbox>} />
          <p id="blog-status-hint" className="text-xs text-ink-secondary">Drafts are never shown publicly. Published posts appear immediately or on the selected future date.</p>
          {errors.status && <p id="blog-status-error" role="alert" className="text-xs text-red-500">{errors.status.message}</p>}
        </div>

        <div className="space-y-2">
          <p id="blog-published-at-label" className="text-sm font-medium">Publish Date (Optional)</p>
          <Controller name="published_at" control={control} render={({ field }) => <BlogDatePicker value={field.value || ""} onChange={(value) => { publishDateEdited.current = true; field.onChange(value); }} errorId={errors.published_at ? "blog-published-at-error" : undefined} />} />
          <p id="blog-published-at-hint" className="text-xs text-ink-secondary">Defaults to today. Publishing without changing it uses the current instant; a future date goes live at 00:00 UTC. Drafts stay private.</p>
          {errors.published_at && <p id="blog-published-at-error" role="alert" className="text-xs text-red-500">{errors.published_at.message}</p>}
        </div>
      </div>

      <div className="grid grid-cols-[minmax(0,1fr)] gap-6 md:grid-cols-2">
        <div className="min-w-0 space-y-2">
          <label htmlFor="blog-cover-url" className="text-sm font-medium">Cover image URL</label>
          <p className="text-xs text-ink-secondary">Choose a managed image below for the Blog card cover, or keep an existing external URL here.</p>
          <div>
            <input
              {...register("cover_image_url", { onChange: () => setValue("cover_image_id", "", { shouldDirty: true }) })}
              id="blog-cover-url"
              aria-invalid={Boolean(errors.cover_image_url)}
              aria-describedby={errors.cover_image_url ? "blog-cover-url-error" : undefined}
                className="min-h-11 w-full min-w-0 rounded-xl border border-border-hairline bg-surface-base px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-accent-signal"
              placeholder="https://... or choose from library"
            />
          </div>
          {errors.cover_image_url && <p id="blog-cover-url-error" role="alert" className="text-xs text-red-500">{errors.cover_image_url.message}</p>}
        </div>

        <div className="min-w-0 space-y-2">
          <label htmlFor="blog-canonical-url" className="text-sm font-medium">Canonical URL (SEO)</label>
          <input
            {...register("canonical_url", { onChange: (event) => { canonicalEdited.current = event.target.value !== ownCanonical; } })}
            id="blog-canonical-url"
            aria-invalid={Boolean(errors.canonical_url)}
            aria-describedby={errors.canonical_url ? "blog-canonical-url-error" : "blog-canonical-hint"}
            className="min-w-0 w-full rounded-xl border border-border-hairline bg-surface-base px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-accent-signal"
            placeholder="Enter a slug to create the canonical URL"
          />
          <p id="blog-canonical-hint" className="text-xs text-ink-secondary">Prefilled from your site domain and slug. Edit only when this article was first published elsewhere; an external canonical excludes it from sitemap and RSS.</p>
          <button type="button" onClick={() => { canonicalEdited.current = false; setValue("canonical_url", ownCanonical, { shouldDirty: true, shouldValidate: true }); }} className="min-h-11 text-sm text-ink-primary underline underline-offset-2">Reset to site URL</button>
          {errors.canonical_url && <p id="blog-canonical-url-error" role="alert" className="text-xs text-red-500">{errors.canonical_url.message}</p>}
        </div>
      </div>

      <BlogImageManager postId={initialData?.id} images={blogImages} onUploaded={(image) => uploadedImages.current.set(image.id, image)} onRemoved={(id) => uploadedImages.current.delete(id)} onUploadingChange={setIsUploadingImages} onImagesChange={(images, dirty = true) => {
        setBlogImages(images);
        setValue("image_ids", images.map((image) => image.id), { shouldDirty: dirty, shouldValidate: true });
      }} onAvailabilityChange={setImageManagerAvailable} coverUrl={coverUrl} content={content} onCoverChange={(image) => {
        const url = image?.secure_url || image?.url || "";
        setValue("cover_image_url", url, { shouldDirty: true, shouldValidate: true });
        setValue("cover_image_id", image?.id || "", { shouldDirty: true });
      }} />
      {errors.image_ids && <p role="alert" className="text-sm text-red-300">{errors.image_ids.message}</p>}

      <div className="space-y-2">
        <label htmlFor="blog-tag-input" className="text-sm font-medium">Tags</label>
          <p id="blog-tags-hint" className="text-xs text-ink-secondary">{tags.length} / 10 tags. Separate multiple tags with commas; they power Blog filters. {tags.length > 10 ? "This legacy post exceeds the new limit; existing tags are preserved, but reduce them to add new ones." : ""}</p>
          <div className="mb-2 flex flex-wrap gap-2">
            {tags.map(tag => (
             <span key={tag} className="inline-flex max-w-full items-center gap-1.5 rounded-full border border-border-hairline bg-surface-raised py-1 pl-3 pr-1 text-sm text-ink-primary">
               <span className="min-w-0 break-words">{tag}</span>
               <button type="button" onClick={() => removeTag(tag)} aria-label={`Remove ${tag} tag`} className="flex size-11 shrink-0 items-center justify-center rounded-full text-ink-secondary hover:bg-surface-base hover:text-ink-primary focus-visible:outline focus-visible:outline-2 focus-visible:outline-current">
                 <X aria-hidden className="size-4" />
              </button>
            </span>
          ))}
        </div>
        <div className="flex gap-2">
          <input
            type="text"
            id="blog-tag-input"
            aria-invalid={Boolean(errors.tags)}
            aria-describedby={`blog-tags-hint${errors.tags ? " blog-tags-error" : ""}`}
            value={tagInput}
            onChange={e => { const text = e.target.value; if (text.includes(",")) { setTagInput(text); addTag(text); } else setTagInput(text); }}
            onKeyDown={e => e.key === "Enter" && (e.preventDefault(), addTag())}
                className="min-h-11 min-w-0 flex-1 rounded-xl border border-border-hairline bg-surface-base px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-accent-signal"
            placeholder="Add tags, separated by commas"
          />
          <button
            type="button"
            onClick={() => addTag()}
            aria-label="Add tag"
            className="min-h-11 shrink-0 rounded-xl border border-border-hairline bg-surface-raised px-4 py-2 transition-colors hover:bg-surface-base focus-visible:outline focus-visible:outline-2 focus-visible:outline-current"
          >
            <Plus className="h-4 w-4" />
          </button>
        </div>
        {errors.tags && <p id="blog-tags-error" role="alert" className="text-xs text-red-500">{errors.tags.message}</p>}
      </div>

      <fieldset aria-describedby={errors.related_blog_post_ids ? "blog-related-error" : undefined} className="space-y-3 rounded-xl border border-border-hairline p-4">
        <legend className="px-1 text-sm font-medium">Related posts</legend>
        <p className="text-xs text-ink-secondary">Choose up to three live published posts. They appear in the order selected. Leave empty to hide the section.</p>
        <p className="text-xs font-medium text-ink-secondary">Selected {selectedRelatedIds.length} / 3. The first two appear on phones and tablets; all three appear on laptops.</p>
        {selectedRelatedIds.length > 0 && <ol className="space-y-1">
          {selectedRelatedIds.map((id, index) => {
            const chosen = availablePosts.find((item) => item.id === id);
            return <li key={id} className="flex items-center justify-between gap-3 rounded-lg bg-surface-base px-3 py-2 text-sm text-ink-primary">
              <span className="min-w-0 break-words">{index + 1}. {chosen?.title || "Post no longer available"}</span>
              <button type="button" onClick={() => setValue("related_blog_post_ids", selectedRelatedIds.filter((value) => value !== id), { shouldDirty: true, shouldValidate: true })} className="min-h-11 shrink-0 text-xs text-ink-secondary underline underline-offset-2 hover:text-ink-primary">Remove</button>
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
              return <label key={item.id} className={`flex min-h-11 items-center gap-3 rounded-lg border border-border-hairline px-3 py-2 text-sm ${disabled ? "cursor-not-allowed opacity-50" : "cursor-pointer hover:bg-surface-base"}`}>
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
            {previewSnapshot && <BlogUnsavedPreview snapshot={previewSnapshot} isNew={!initialData?.id} relatedPosts={availablePosts} />}
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
              data-admin-unguarded
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
          disabled={isSubmitting || isUploadingImages || isCleaningImages}
          className="inline-flex items-center justify-center rounded-xl bg-accent-signal px-6 py-2 text-sm font-medium text-white shadow hover:bg-accent-signal/90 focus:outline-none disabled:opacity-50 transition-all"
        >
          {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
          {publishingNow ? "Publish Now" : status === "draft" ? initialData?.status === "published" ? "Unpublish Post" : initialData?.id ? "Save Post" : "Save Draft"
            : scheduled ? "Schedule Post"
              : initialData?.status === "published" ? "Save Post" : "Publish Post"}
        </button>
      </div>
    </form>
    <AdminConfirmDialog
      open={confirmation !== null}
      title={confirmation?.title || "Confirm publication"}
      description={confirmation?.description || ""}
      confirmLabel={confirmation?.label || "Confirm"}
      cancelLabel="Keep editing"
      pending={isSubmitting || isUploadingImages || isCleaningImages}
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
      description={leaveTarget === "preview" ? "The preview shows only the last saved version. Unsaved edits will not appear there. Images uploaded in this session will be removed if they are unused." : "Your unsaved changes will be lost. Images uploaded in this session will be removed if they are unused."}
      confirmLabel={leaveTarget === "preview" ? "Open saved preview" : "Discard changes"}
      cancelLabel="Keep editing"
      destructive={leaveTarget === "list"}
      pending={isCleaningImages || isUploadingImages}
      onClose={() => setLeaveTarget(null)}
      onConfirm={() => {
        const target = leaveTarget;
        if (!target) return;
        void (async () => {
          const cleaned = await discardUploadedImages();
          setLeaveTarget(null);
          if (cleaned) router.push(target === "list" ? "/admin/blogs" : `/admin/blogs/${initialData?.id}/preview`);
        })();
      }}
    />
    <AdminConfirmDialog open={navigationTarget !== null} title="Discard unsaved Blog changes?" description="Your unsaved article, tags and image selections will be lost. Images uploaded in this session will be removed if they are unused." confirmLabel="Discard changes" cancelLabel="Keep editing" destructive pending={isCleaningImages || isUploadingImages} onClose={() => setNavigationTarget(null)} onConfirm={() => { void (async () => { const cleaned = await discardUploadedImages(); if (cleaned) confirmLeave(router.push); else setNavigationTarget(null); })(); }} />
    </>
  );
}
