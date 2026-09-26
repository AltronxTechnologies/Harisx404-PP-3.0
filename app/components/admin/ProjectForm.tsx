"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Image from "next/image";
import { useForm, Controller } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { TiptapEditor } from "./TiptapEditor";
import { MediaPickerModal } from "./MediaPickerModal";
import { Image as ImageIcon, Loader2, Sparkles, ArrowUp, ArrowDown, Trash2, UploadCloud } from "lucide-react";

type GalleryImage = { mediaId: string; url: string; caption: string; altText: string };

const sectionFields = [
  { key: "why_built", label: "Why I built this", hint: "The problem and your motivation." },
  { key: "key_decisions", label: "Key decisions", hint: "Important technical or design tradeoffs." },
  { key: "results", label: "Results", hint: "Measured outcomes or what shipped. Leave blank if not known." },
  { key: "lessons_learned", label: "What I learned", hint: "What you would carry into the next project." },
] as const;

type CaseStudySections = Record<(typeof sectionFields)[number]["key"], string>;
const emptySections: CaseStudySections = { why_built: "", key_decisions: "", results: "", lessons_learned: "" };

const projectSchema = z.object({
  title: z.string().min(1, "Title is required"),
  slug: z.string().min(1, "Slug is required"),
  description: z.string().optional(),
  tagline: z.string().max(160, "Keep the short description within 160 characters").optional(),
  category: z.string().trim().min(1, "At least one category is required").max(60),
  year: z.string().optional().or(z.literal("")),
  latest_update_label: z.string().max(32).optional(),
  source_note: z.string().max(80).optional(),
  case_study_sections: z.object({
    why_built: z.string().max(10000),
    key_decisions: z.string().max(10000),
    results: z.string().max(10000),
    lessons_learned: z.string().max(10000),
  }),
  tech_stack: z.string().optional().or(z.literal("")),
  tags: z.string().optional().or(z.literal("")),
  features: z.string().optional().or(z.literal("")),
  content: z.string().optional(),
  status: z.enum(["draft", "published", "archived"]),
  cover_image_url: z.string().url("At least one image is required; choose a cover").refine((url) => /^https?:\/\//i.test(url), "Use an HTTP or HTTPS image URL"),
  cover_image_id: z.string().uuid().optional().or(z.literal("")),
  live_url: z.string().url("Must be a valid URL").optional().or(z.literal("")),
  github_url: z.string().url("Must be a valid URL").optional().or(z.literal("")),
  start_date: z.string().optional().or(z.literal("")),
  end_date: z.string().optional().or(z.literal("")),
  featured: z.boolean().optional(),
});

type ProjectFormValues = z.infer<typeof projectSchema>;

interface ProjectFormProps {
  initialData?: Partial<Omit<ProjectFormValues, "tech_stack" | "features" | "tags">> & {
    id?: string;
    tech_stack?: string[] | string | null;
    features?: string[] | string | null;
    tags?: string[] | string | null;
    galleryImages?: GalleryImage[];
    latest_update_label?: string | null;
    source_note?: string | null;
    case_study_sections?: Partial<CaseStudySections> | null;
  };
}

export function ProjectForm({ initialData }: ProjectFormProps) {
  const router = useRouter();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState("");
  const [isMediaPickerOpen, setIsMediaPickerOpen] = useState(false);
  const [mediaPickerTarget, setMediaPickerTarget] = useState<"cover" | "gallery" | "replace-gallery">("cover");
  const [replacingIndex, setReplacingIndex] = useState(0);
  const [mediaPickerTab, setMediaPickerTab] = useState<"library" | "upload">("library");
  const [galleryImages, setGalleryImages] = useState<GalleryImage[]>(initialData?.galleryImages ?? []);
  const [isGenerating, setIsGenerating] = useState(false);

  const {
    register,
    handleSubmit,
    control,
    setValue,
    getValues,
    watch,
    formState: { errors },
  } = useForm<ProjectFormValues>({
    resolver: zodResolver(projectSchema),
    defaultValues: {
      title: initialData?.title ?? "",
      slug: initialData?.slug ?? "",
      description: initialData?.description ?? "",
      tagline: initialData?.tagline ?? "",
      category: initialData?.category ?? "Web App",
      year: initialData?.year ?? "",
      latest_update_label: initialData?.latest_update_label ?? "",
      source_note: initialData?.source_note ?? "",
      case_study_sections: { ...emptySections, ...initialData?.case_study_sections },
      tech_stack: Array.isArray(initialData?.tech_stack)
        ? initialData.tech_stack.join("\n")
        : initialData?.tech_stack ?? "",
      tags: Array.isArray(initialData?.tags)
        ? initialData.tags.join(", ")
        : initialData?.tags ?? "",
      features: Array.isArray(initialData?.features)
        ? initialData.features.join("\n")
        : initialData?.features ?? "",
      content: initialData?.content ?? "",
      status: (initialData?.status as ProjectFormValues["status"]) ?? "draft",
      cover_image_url: initialData?.cover_image_url ?? "",
      cover_image_id: initialData?.cover_image_id ?? "",
      live_url: initialData?.live_url ?? "",
      github_url: initialData?.github_url ?? "",
      start_date: initialData?.start_date ?? "",
      end_date: initialData?.end_date ?? "",
      featured: initialData?.featured ?? false,
    },
  });
  const coverUrl = watch("cover_image_url") || "";
  const coverField = register("cover_image_url");

  const onSubmit = async (data: ProjectFormValues) => {
    setIsSubmitting(true);
    setErrorMsg("");
    try {
      const payload = {
        ...data,
        tech_stack: (data.tech_stack || "")
          .split(/\r?\n/)
          .map((t) => t.trim())
          .filter(Boolean),
        tags: (data.tags || "")
          .split(",")
          .map((t) => t.trim())
          .filter(Boolean),
        features: (data.features || "")
          .split("\n")
          .map((f) => f.trim())
          .filter(Boolean),
        gallery: galleryImages.map(({ mediaId, caption }) => ({ mediaId, caption })),
      };
      const res = await fetch("/api/admin/projects", {
        method: initialData?.id ? "PUT" : "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(initialData?.id ? { id: initialData.id, ...payload } : payload),
      });

      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.error || "Failed to save project");
      }

      router.push("/admin/projects");
      router.refresh();
    } catch (err: any) {
      setErrorMsg(err.message);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleGenerateFromGithub = async () => {
    const github_url = getValues("github_url");
    if (!github_url) {
      alert("Please enter a GitHub URL first.");
      return;
    }
    
    setIsGenerating(true);
    setErrorMsg("");
    try {
      const res = await fetch("/api/ai/project-from-github", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ github_url })
      });
      
      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.error || "Failed to generate");
      }
      
      const { result } = await res.json();
      
      if (result.summary) setValue("description", result.summary, { shouldValidate: true });
      if (result.description) setValue("content", result.description, { shouldValidate: true });
      if (result.tags && result.tags.length > 0) {
        // Merge AI-suggested tags into the tags field (deduped).
        const existing = (getValues("tags") || "")
          .split(",")
          .map((t: string) => t.trim())
          .filter(Boolean);
        const merged = Array.from(new Set([...existing, ...result.tags]));
        setValue("tags", merged.join(", "), { shouldValidate: true });
      }
    } catch (err: any) {
      console.error(err);
      setErrorMsg(`AI Generation Failed: ${err.message}`);
    } finally {
      setIsGenerating(false);
    }
  };

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-8">
      {errorMsg && (
        <div className="rounded-lg bg-red-50 p-4 text-sm text-red-500 dark:bg-red-950/30">
          {errorMsg}
        </div>
      )}
      
      <div className="grid gap-6 md:grid-cols-2">
        <div className="space-y-2">
          <label className="text-sm font-medium">Title</label>
          <input
            {...register("title")}
            className="w-full rounded-xl border border-border-hairline bg-surface-base px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-accent-signal"
            placeholder="Project Title"
          />
          {errors.title && <p className="text-xs text-red-500">{errors.title.message}</p>}
        </div>

        <div className="space-y-2">
          <label className="text-sm font-medium">Slug</label>
          <input
            {...register("slug")}
            className="w-full rounded-xl border border-border-hairline bg-surface-base px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-accent-signal"
            placeholder="project-slug"
          />
          {errors.slug && <p className="text-xs text-red-500">{errors.slug.message}</p>}
        </div>
      </div>

      <div className="space-y-2">
        <label className="text-sm font-medium">Short Description</label>
        <textarea
          {...register("description")}
          rows={2}
          className="w-full rounded-xl border border-border-hairline bg-surface-base px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-accent-signal"
          placeholder="A brief 1-2 sentence description..."
        />
      </div>

        <div className="space-y-2">
          <div className="flex justify-between gap-3"><label className="text-sm font-medium">Card / page summary (Optional)</label><span className="text-xs text-ink-secondary">{watch("tagline")?.length ?? 0}/160</span></div>
          <input
            {...register("tagline")}
            maxLength={160}
            className="w-full rounded-xl border border-border-hairline bg-surface-base px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-accent-signal"
            placeholder="A concise description for the homepage and case study..."
          />
          {errors.tagline && <p className="text-xs text-red-500">{errors.tagline.message}</p>}
      </div>

      <div className="grid gap-6 md:grid-cols-3">
        <div className="space-y-2">
          <label className="text-sm font-medium">Categories</label>
          <input
            {...register("category")}
            className="w-full rounded-xl border border-border-hairline bg-surface-base px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-accent-signal"
            maxLength={60}
            placeholder="Cybersecurity / Networking, AI/ML..."
          />
          <p className="text-xs text-ink-secondary">Separate categories with commas or spaced slashes; AI/ML stays one category.</p>
          {errors.category && <p className="text-xs text-red-500">{errors.category.message}</p>}
        </div>

        <div className="space-y-2">
          <label className="text-sm font-medium">Built (Optional)</label>
          <input
            {...register("year")}
            maxLength={20}
            className="w-full rounded-xl border border-border-hairline bg-surface-base px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-accent-signal"
            placeholder="Q2 2026 or 2025"
          />
        </div>

        <div className="space-y-2">
          <label className="text-sm font-medium">Tech stack (one per line)</label>
          <textarea
            {...register("tech_stack")}
            rows={3}
            className="w-full rounded-xl border border-border-hairline bg-surface-base px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-accent-signal"
            placeholder={"Next.js\nTypeScript\nSupabase"}
          />
        </div>
      </div>

      <div className="space-y-2">
        <label className="text-sm font-medium">Latest project update (Optional)</label>
        <input {...register("latest_update_label")} maxLength={32} className="w-full rounded-xl border border-border-hairline bg-surface-base px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-accent-signal" placeholder="Q3 2026" />
        <p className="text-xs text-ink-secondary">Set this when you update the project itself, not when you edit this page.</p>
      </div>

      <div className="space-y-2">
        <label className="text-sm font-medium">Tags (comma-separated)</label>
        <textarea
          {...register("tags")}
          rows={3}
          className="w-full rounded-xl border border-border-hairline bg-surface-base px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-accent-signal"
          placeholder="Web, Cybersecurity, AI/ML, Networking, SaaS..."
        />
        <p className="text-xs text-ink-secondary">
          Add as many comma-separated tags as you need. All are searchable and filterable; project cards show up to three.
        </p>
      </div>

      <div className="space-y-2">
        <label className="text-sm font-medium">Key features / highlights (one per line)</label>
        <textarea
          {...register("features")}
          rows={4}
          className="w-full rounded-xl border border-border-hairline bg-surface-base px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-accent-signal"
          placeholder={"Realtime dashboard with live charts\nRole-based access control"}
        />
      </div>

      <div className="grid gap-6 md:grid-cols-3">
        <div className="space-y-2">
          <label className="text-sm font-medium">Publication status</label>
          <select
            {...register("status")}
            className="w-full rounded-xl border border-border-hairline bg-surface-base px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-accent-signal"
          >
            <option value="draft">Draft</option>
            <option value="published">Published</option>
            <option value="archived">Archived</option>
          </select>
        </div>

        <div className="space-y-2 flex flex-col justify-end">
          <label className="flex items-center gap-2 cursor-pointer text-sm font-medium p-2 border border-border-hairline rounded-xl bg-surface-base hover:bg-surface-raised transition-colors">
            <input
              type="checkbox"
              {...register("featured")}
              className="rounded text-accent-signal focus:ring-accent-signal bg-surface-base border-border-hairline h-4 w-4"
            />
            Featured Project
          </label>
        </div>
      </div>

      <div className="grid gap-6 md:grid-cols-2">
        <div className="space-y-2">
          <label htmlFor="project-live-url" className="text-sm font-medium">Visit / live project URL (Optional)</label>
          <input
            id="project-live-url"
            {...register("live_url")}
            className="w-full rounded-xl border border-border-hairline bg-surface-base px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-accent-signal"
            placeholder="https://..."
          />
          {errors.live_url && <p className="text-xs text-red-500">{errors.live_url.message}</p>}
          <p className="text-xs text-ink-secondary">Leave blank for a local or CLI project; Visit will show None.</p>
        </div>

        <div className="space-y-2">
          <label htmlFor="project-source-name" className="block text-sm font-medium">Source name (Optional)</label>
          <input id="project-source-name" {...register("source_note")} maxLength={80} className="w-full rounded-xl border border-border-hairline bg-surface-base px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-accent-signal" placeholder="GitHub repository, Source code, Private repository..." />
          <p className="text-xs text-ink-secondary">With a URL, this becomes blue link text. Without a URL, it describes unavailable source; leave blank to show None.</p>
          <div className="flex items-center justify-between">
            <label htmlFor="project-source-url" className="text-sm font-medium">Source URL (Optional)</label>
            <button
              type="button"
              onClick={handleGenerateFromGithub}
              disabled={isGenerating}
              className="text-xs flex items-center gap-1 text-accent-signal hover:text-accent-signal/80 transition-colors disabled:opacity-50"
            >
              {isGenerating ? <Loader2 className="w-3 h-3 animate-spin" /> : <Sparkles className="w-3 h-3" />}
              Generate from README
            </button>
          </div>
          <input
            id="project-source-url"
            {...register("github_url")}
            className="w-full rounded-xl border border-border-hairline bg-surface-base px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-accent-signal"
            placeholder="https://github.com/your-name/project-repo"
          />
          <p className="text-xs text-ink-secondary">Link to this project&apos;s public repository, not your profile. Leave blank when the source is private.</p>
          {errors.github_url && <p className="text-xs text-red-500">{errors.github_url.message}</p>}
        </div>
      </div>
      
      <div className="grid gap-6 md:grid-cols-2">
        <div className="space-y-2">
          <label className="text-sm font-medium">Start Date (Optional)</label>
          <input
            type="date"
            {...register("start_date")}
            className="w-full rounded-xl border border-border-hairline bg-surface-base px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-accent-signal"
          />
        </div>

        <div className="space-y-2">
          <label className="text-sm font-medium">End Date (Optional)</label>
          <input
            type="date"
            {...register("end_date")}
            className="w-full rounded-xl border border-border-hairline bg-surface-base px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-accent-signal"
          />
        </div>
      </div>

      <div className="space-y-3">
        <h2 className="text-sm font-medium">Project images</h2>
        <p className="text-xs text-ink-secondary">At least one image is required. The cover appears first in the project carousel; add as many more images as you need. Reorder or replace them below.</p>
        {coverUrl && z.string().url().safeParse(coverUrl).success ? (
          <div className="relative isolate flex h-48 items-center justify-center overflow-hidden rounded-xl border border-border-hairline bg-neutral-100 dark:bg-white/[0.04]">
            {/* A direct preview supports manually entered image hosts outside Next's remote allowlist. */}
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={coverUrl} alt="" aria-hidden className="absolute inset-0 h-full w-full object-cover opacity-25 blur-xl" />
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={coverUrl} alt="Current project cover preview" className="relative z-10 h-full w-full object-contain" />
          </div>
        ) : <p className="rounded-xl border border-dashed border-border-hairline px-4 py-6 text-sm text-ink-secondary">No cover selected.</p>}
        <div className="flex flex-wrap gap-2">
          <button type="button" onClick={() => { setMediaPickerTarget("cover"); setMediaPickerTab("upload"); setIsMediaPickerOpen(true); }} className="inline-flex min-h-11 items-center gap-2 rounded-xl border border-border-hairline px-3 text-sm text-text-primary hover:bg-surface-base"><UploadCloud className="size-4" aria-hidden />{coverUrl ? "Upload replacement" : "Upload cover"}</button>
          <button type="button" onClick={() => { setMediaPickerTarget("cover"); setMediaPickerTab("library"); setIsMediaPickerOpen(true); }} className="inline-flex min-h-11 items-center gap-2 rounded-xl border border-border-hairline px-3 text-sm text-text-primary hover:bg-surface-base"><ImageIcon className="size-4" aria-hidden />Choose from library</button>
          {coverUrl && <button type="button" disabled={galleryImages.length === 0} onClick={() => { const [nextCover, ...remaining] = galleryImages; setValue("cover_image_url", nextCover.url, { shouldDirty: true, shouldValidate: true }); setValue("cover_image_id", nextCover.mediaId, { shouldDirty: true }); setGalleryImages(remaining); }} className="inline-flex min-h-11 items-center gap-2 rounded-xl border border-border-hairline px-3 text-sm text-red-600 hover:bg-red-50 disabled:cursor-not-allowed disabled:opacity-50 dark:text-red-400 dark:hover:bg-red-950/30"><Trash2 className="size-4" aria-hidden />Remove cover</button>}
        </div>
        <p className="text-xs text-ink-secondary">Removing the cover promotes the next image. Add another image first if this is the only one. Changes take effect when you save and do not delete shared media-library images.</p>
        <label htmlFor="project-cover-url" className="block text-xs text-ink-secondary">Or enter a cover image URL</label>
        <input id="project-cover-url" {...coverField} onChange={(event) => { coverField.onChange(event); setValue("cover_image_id", "", { shouldDirty: true }); }} className="w-full rounded-xl border border-border-hairline bg-surface-base px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-accent-signal" placeholder="https://..." />
        <input type="hidden" {...register("cover_image_id")} />
        {errors.cover_image_url && <p className="text-xs text-red-500">{errors.cover_image_url.message}</p>}
      </div>

      <div className="space-y-3">
        <div className="flex items-center justify-between gap-4">
          <h3 className="text-sm font-medium">More carousel images</h3>
          <button
            type="button"
            onClick={() => { setMediaPickerTarget("gallery"); setMediaPickerTab("library"); setIsMediaPickerOpen(true); }}
            className="inline-flex items-center gap-2 rounded-xl border border-border-hairline bg-surface-base px-3 py-2 text-sm hover:bg-surface-raised"
          >
            <ImageIcon className="h-4 w-4" /> Add from Media Library
          </button>
        </div>
        {galleryImages.length === 0 && <p className="text-sm text-ink-secondary">No additional images yet.</p>}
        <div className="space-y-3">
          {galleryImages.map((image, index) => (
            <div key={image.mediaId} className="flex flex-col gap-3 rounded-xl border border-border-hairline bg-surface-base p-3 sm:flex-row sm:items-center">
              <Image src={image.url} alt={image.altText || image.caption || "Project gallery image"} width={128} height={96} className="h-24 w-full rounded-lg object-cover sm:w-32" />
              <div className="min-w-0 flex-1 space-y-1">
                <label htmlFor={`gallery-caption-${image.mediaId}`} className="text-xs text-ink-secondary">Caption</label>
                <input
                  id={`gallery-caption-${image.mediaId}`}
                  value={image.caption}
                  onChange={(event) => setGalleryImages((images) => images.map((item) => item.mediaId === image.mediaId ? { ...item, caption: event.target.value } : item))}
                  className="w-full rounded-lg border border-border-hairline bg-surface-raised px-3 py-2 text-sm"
                  placeholder="Optional caption"
                />
                {image.altText && <p className="text-xs text-ink-secondary">Alt text: {image.altText}</p>}
                <button type="button" onClick={() => { setValue("cover_image_url", image.url, { shouldDirty: true, shouldValidate: true }); setValue("cover_image_id", image.mediaId, { shouldDirty: true }); setGalleryImages((images) => images.filter((item) => item.mediaId !== image.mediaId)); }} className="text-left text-xs text-accent-signal underline underline-offset-2">Make cover (first image)</button>
              </div>
              <div className="flex gap-1">
                <button type="button" aria-label={`Replace image ${index + 2}`} onClick={() => { setReplacingIndex(index); setMediaPickerTarget("replace-gallery"); setMediaPickerTab("upload"); setIsMediaPickerOpen(true); }} className="rounded-lg p-2 hover:bg-surface-raised"><UploadCloud className="h-4 w-4" /></button>
                <button type="button" aria-label={`Move image ${index + 1} up`} disabled={index === 0} onClick={() => setGalleryImages((images) => { const next = [...images]; [next[index - 1], next[index]] = [next[index], next[index - 1]]; return next; })} className="rounded-lg p-2 hover:bg-surface-raised disabled:opacity-40"><ArrowUp className="h-4 w-4" /></button>
                <button type="button" aria-label={`Move image ${index + 1} down`} disabled={index === galleryImages.length - 1} onClick={() => setGalleryImages((images) => { const next = [...images]; [next[index], next[index + 1]] = [next[index + 1], next[index]]; return next; })} className="rounded-lg p-2 hover:bg-surface-raised disabled:opacity-40"><ArrowDown className="h-4 w-4" /></button>
                <button type="button" aria-label={`Remove image ${index + 1}`} onClick={() => setGalleryImages((images) => images.filter((item) => item.mediaId !== image.mediaId))} className="rounded-lg p-2 text-red-500 hover:bg-surface-raised"><Trash2 className="h-4 w-4" /></button>
              </div>
            </div>
          ))}
        </div>
      </div>

      <MediaPickerModal
        isOpen={isMediaPickerOpen}
        initialTab={mediaPickerTab}
        onClose={() => setIsMediaPickerOpen(false)}
        onSelect={(media) => {
          if (mediaPickerTarget === "cover") {
            setValue("cover_image_url", media.secure_url || media.url, { shouldDirty: true, shouldValidate: true });
            setValue("cover_image_id", media.id, { shouldDirty: true });
            setGalleryImages((images) => images.filter((image) => image.mediaId !== media.id));
          } else if (mediaPickerTarget === "replace-gallery") {
            if (media.id === getValues("cover_image_id")) return;
            setGalleryImages((images) => images.some((image, index) => image.mediaId === media.id && index !== replacingIndex)
              ? images
              : images.map((image, index) => index === replacingIndex ? { mediaId: media.id, url: media.secure_url || media.url, caption: image.caption, altText: media.alt_text || "" } : image));
          } else {
            if (media.id === getValues("cover_image_id")) return;
            setGalleryImages((images) => images.some((image) => image.mediaId === media.id)
              ? images
              : [...images, { mediaId: media.id, url: media.secure_url || media.url, caption: "", altText: media.alt_text || "" }]);
          }
        }}
      />

      <div className="space-y-2">
        <label className="text-sm font-medium">Content / Case Study (Markdown)</label>
        <p className="text-xs text-ink-secondary">Optional overview. The focused sections below appear only when filled in; do not fabricate details.</p>
        <Controller
          name="content"
          control={control}
          render={({ field }) => (
            <div className="rounded-xl overflow-hidden border border-border-hairline bg-surface-base">
              <TiptapEditor
                value={field.value || ""}
                onChange={(markdown) => field.onChange(markdown)}
              />
            </div>
          )}
        />
      </div>

      <div className="space-y-5 border-t border-border-hairline pt-6">
        <div><h2 className="text-lg font-medium">Case study sections</h2><p className="text-xs text-ink-secondary">Write only what applies to this project. Markdown is supported.</p></div>
        {sectionFields.map(({ key, label, hint }) => (
          <div key={key} className="space-y-2">
            <label htmlFor={`case-study-${key}`} className="text-sm font-medium">{label} (Optional)</label>
            <textarea id={`case-study-${key}`} {...register(`case_study_sections.${key}`)} rows={4} maxLength={10000} className="w-full rounded-xl border border-border-hairline bg-surface-base px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-accent-signal" placeholder={hint} />
          </div>
        ))}
      </div>

      <div className="flex justify-end gap-4">
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
          Save Project
        </button>
      </div>
    </form>
  );
}
