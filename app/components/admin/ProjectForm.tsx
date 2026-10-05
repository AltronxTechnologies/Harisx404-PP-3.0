"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import Image from "next/image";
import { useForm, Controller } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { TiptapEditor } from "./TiptapEditor";
import { MediaPickerModal } from "./MediaPickerModal";
import { AdminConfirmDialog } from "./AdminConfirmDialog";
import { captionWordCount } from "@/app/lib/project-captions";
import { projectStages, projectStageLabels } from "@/app/lib/project-stage";
import { normalizeBlogSlug, isValidBlogDate } from "@/app/lib/blog-defaults";
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
  title: z.string().trim().min(1, "Title is required").max(200, "Title must be 200 characters or fewer"),
  slug: z.string().regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/, "Use lowercase letters, numbers and hyphens").max(200),
  description: z.string().max(10000).optional(),
  tagline: z.string().max(160, "Keep the short description within 160 characters").optional(),
  category: z.string().trim().min(1, "At least one category is required").max(60),
  year: z.string().optional().or(z.literal("")),
  latest_update_label: z.string().max(32).optional(),
  project_stage: z.enum(projectStages),
  expected_completion_label: z.string().trim().max(32).optional(),
  source_note: z.string().max(80).optional(),
  case_study_sections: z.object({
    cover_caption: z.string().max(200, "Keep the cover caption within 200 characters").refine((caption) => captionWordCount(caption) <= 30, "Keep the cover caption within 30 words"),
    cover_alt: z.string().trim().max(160, "Keep the cover description within 160 characters"),
    why_built: z.string().max(10000),
    key_decisions: z.string().max(10000),
    results: z.string().max(10000),
    lessons_learned: z.string().max(10000),
  }),
  tech_stack: z.string().refine((value) => value.split(/\r?\n/).filter((item) => item.trim()).every((item) => item.trim().length <= 100), "Each technology must be 100 characters or fewer").optional(),
  tags: z.string().refine((value) => value.split(",").filter((item) => item.trim()).every((item) => item.trim().length <= 100), "Each tag must be 100 characters or fewer").optional(),
  features: z.string().refine((value) => { const items = value.split(/\r?\n/).filter((item) => item.trim()); return items.length <= 100 && items.every((item) => item.trim().length <= 500); }, "Use at most 100 features, each within 500 characters").optional(),
  related_project_ids: z.array(z.string().uuid()).max(2, "Choose no more than two projects").refine((ids) => new Set(ids).size === ids.length, "Choose two different projects"),
  content: z.string().max(200000, "Case study must be 200,000 characters or fewer").optional(),
  status: z.enum(["draft", "published", "archived"]),
  cover_image_url: z.string().url("At least one image is required; choose a cover").refine((url) => /^https?:\/\//i.test(url), "Use an HTTP or HTTPS image URL"),
  cover_image_id: z.string().uuid().optional().or(z.literal("")),
  live_url: z.string().url("Must be a valid URL").optional().or(z.literal("")),
  github_url: z.string().url("Must be a valid URL").optional().or(z.literal("")),
  start_date: z.string().refine((date) => !date || isValidBlogDate(date), "Choose a valid start date").optional(),
  end_date: z.string().refine((date) => !date || isValidBlogDate(date), "Choose a valid end date").optional(),
  featured: z.boolean().optional(),
});

type ProjectFormValues = z.infer<typeof projectSchema>;

interface ProjectFormProps {
  availableProjects: Array<{ id: string; title: string; slug: string; status: string }>;
  initialData?: Partial<Omit<ProjectFormValues, "tech_stack" | "features" | "tags" | "related_project_ids" | "expected_completion_label">> & {
    id?: string;
    updated_at?: string;
    tech_stack?: string[] | string | null;
    features?: string[] | string | null;
    tags?: string[] | string | null;
    related_project_ids?: string[] | null;
    galleryImages?: GalleryImage[];
    latest_update_label?: string | null;
    expected_completion_label?: string | null;
    source_note?: string | null;
    case_study_sections?: Partial<CaseStudySections & { cover_caption: string; cover_alt: string }> | null;
  };
}

export function ProjectForm({ initialData, availableProjects }: ProjectFormProps) {
  const router = useRouter();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState("");
  const [isMediaPickerOpen, setIsMediaPickerOpen] = useState(false);
  const [mediaPickerTarget, setMediaPickerTarget] = useState<"cover" | "gallery" | "replace-gallery">("cover");
  const [replacingIndex, setReplacingIndex] = useState(0);
  const [mediaPickerTab, setMediaPickerTab] = useState<"library" | "upload">("library");
  const [galleryImages, setGalleryImages] = useState<GalleryImage[]>(initialData?.galleryImages ?? []);
  const [isGenerating, setIsGenerating] = useState(false);
  const [relatedSearch, setRelatedSearch] = useState("");
  const slugEdited = useRef(Boolean(initialData?.id));
  const [saveConfirmation, setSaveConfirmation] = useState<{ title: string; description: string; label: string; data: ProjectFormValues } | null>(null);
  const [leaveConfirmation, setLeaveConfirmation] = useState(false);

  const {
    register,
    handleSubmit,
    control,
    setValue,
    getValues,
    watch,
    setError,
    formState: { errors, isDirty },
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
      project_stage: initialData?.project_stage ?? "completed",
      expected_completion_label: initialData?.expected_completion_label ?? "",
      source_note: initialData?.source_note ?? "",
      case_study_sections: { ...emptySections, cover_caption: "", cover_alt: "", ...initialData?.case_study_sections },
      tech_stack: Array.isArray(initialData?.tech_stack)
        ? initialData.tech_stack.join("\n")
        : initialData?.tech_stack ?? "",
      tags: Array.isArray(initialData?.tags)
        ? initialData.tags.join(", ")
        : initialData?.tags ?? "",
      features: Array.isArray(initialData?.features)
        ? initialData.features.join("\n")
        : initialData?.features ?? "",
      related_project_ids: initialData?.related_project_ids ?? [],
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
  const completed = watch("project_stage") === "completed";
  const selectedRelatedIds = watch("related_project_ids") || [];
  const relatedOptions = availableProjects.filter((item) => item.id !== initialData?.id && `${item.title} ${item.slug}`.toLowerCase().includes(relatedSearch.trim().toLowerCase()));
  const coverCaption = watch("case_study_sections.cover_caption") || "";
  const coverField = register("cover_image_url");
  const galleryDirty = JSON.stringify(galleryImages) !== JSON.stringify(initialData?.galleryImages ?? []);

  useEffect(() => {
    if (!isDirty && !galleryDirty) return;
    const warn = (event: BeforeUnloadEvent) => { event.preventDefault(); event.returnValue = ""; };
    window.addEventListener("beforeunload", warn);
    return () => window.removeEventListener("beforeunload", warn);
  }, [isDirty, galleryDirty]);

  const chooseCover = (image: GalleryImage) => {
    const oldUrl = getValues("cover_image_url");
    const oldId = getValues("cover_image_id");
    if (oldUrl && !oldId && oldUrl !== image.url) {
      setErrorMsg("The current cover uses a manual URL. Remove it explicitly before promoting a gallery image, or choose a managed cover from the library.");
      return;
    }
    const oldCaption = getValues("case_study_sections.cover_caption") || "";
    const oldAlt = getValues("case_study_sections.cover_alt") || "";
    setGalleryImages((images) => {
      const remaining = images.filter((item) => item.mediaId !== image.mediaId);
      return oldId && oldId !== image.mediaId && !remaining.some((item) => item.mediaId === oldId)
        ? [{ mediaId: oldId, url: oldUrl, caption: oldCaption, altText: oldAlt }, ...remaining]
        : remaining;
    });
    setValue("cover_image_url", image.url, { shouldDirty: true, shouldValidate: true });
    setValue("cover_image_id", image.mediaId, { shouldDirty: true });
    setValue("case_study_sections.cover_caption", image.caption, { shouldDirty: true, shouldValidate: true });
    setValue("case_study_sections.cover_alt", image.altText, { shouldDirty: true, shouldValidate: true });
    setErrorMsg("");
  };

  const saveProject = async (data: ProjectFormValues) => {
    setIsSubmitting(true);
    setErrorMsg("");
    try {
      if (galleryImages.some((image) => captionWordCount(image.caption) > 30)) {
        throw new Error("Each image caption must be 30 words or fewer.");
      }
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
        gallery: galleryImages.map(({ mediaId, caption, altText }) => ({ mediaId, caption, altText })),
      };
      const res = await fetch("/api/admin/projects", {
        method: initialData?.id ? "PUT" : "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(initialData?.id ? { id: initialData.id, updated_at: initialData.updated_at, ...payload } : payload),
      });

      if (!res.ok) {
        const err = await res.json();
        if (err.issues?.fieldErrors) {
          for (const [name, messages] of Object.entries(err.issues.fieldErrors)) {
            if (name in projectSchema.shape && Array.isArray(messages) && typeof messages[0] === "string") {
              setError(name as keyof ProjectFormValues, { message: messages[0] });
            }
          }
        }
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

  const onSubmit = (data: ProjectFormValues) => {
    if (data.start_date && data.end_date && data.end_date < data.start_date) {
      setError("end_date", { message: "End date must be on or after the start date" });
      setErrorMsg("Check the project dates before saving.");
      return;
    }
    if (data.status !== initialData?.status && (data.status === "published" || initialData?.status === "published")) {
      setSaveConfirmation(data.status === "published"
        ? { title: "Publish this project?", description: "This project will become visible on the public portfolio when saved.", label: "Publish project", data }
        : { title: "Unpublish this project?", description: "It will leave the public portfolio and remain in Admin.", label: "Unpublish project", data });
      return;
    }
    void saveProject(data);
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
      
      if (result.summary) setValue("description", result.summary, { shouldDirty: true, shouldValidate: true });
      if (result.description) setValue("content", result.description, { shouldDirty: true, shouldValidate: true });
      if (result.tags && result.tags.length > 0) {
        // Merge AI-suggested tags into the tags field (deduped).
        const existing = (getValues("tags") || "")
          .split(",")
          .map((t: string) => t.trim())
          .filter(Boolean);
        const merged = Array.from(new Set([...existing, ...result.tags]));
        setValue("tags", merged.join(", "), { shouldDirty: true, shouldValidate: true });
      }
    } catch (err: any) {
      setErrorMsg(`AI Generation Failed: ${err.message}`);
    } finally {
      setIsGenerating(false);
    }
  };

  return (
    <>
    <form onSubmit={handleSubmit(onSubmit, () => { setErrorMsg("Check the highlighted fields before saving."); })} className="min-w-0 space-y-8">
      {errorMsg && <div role="alert" className="rounded-xl border border-red-500/30 bg-red-950/30 p-4 text-sm text-red-300">{errorMsg}</div>}
      
      <div className="grid gap-6 md:grid-cols-2">
        <div className="space-y-2">
          <label htmlFor="project-title" className="text-sm font-medium">Title</label>
          <input
            id="project-title"
            {...register("title", { onChange: (event) => { if (!slugEdited.current) setValue("slug", normalizeBlogSlug(event.target.value), { shouldDirty: true, shouldValidate: true }); } })}
            aria-invalid={Boolean(errors.title)}
            aria-describedby={errors.title ? "project-title-error" : undefined}
            className="w-full rounded-xl border border-border-hairline bg-surface-base px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-accent-signal"
            placeholder="Project Title"
          />
          {errors.title && <p id="project-title-error" role="alert" className="text-xs text-red-300">{errors.title.message}</p>}
        </div>

        <div className="space-y-2">
          <label htmlFor="project-slug" className="text-sm font-medium">Slug</label>
          <input
            id="project-slug"
            {...register("slug", { onChange: () => { slugEdited.current = true; } })}
            aria-invalid={Boolean(errors.slug)}
            aria-describedby={errors.slug ? "project-slug-error" : undefined}
            className="w-full rounded-xl border border-border-hairline bg-surface-base px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-accent-signal"
            placeholder="project-slug"
          />
          {errors.slug && <p id="project-slug-error" role="alert" className="text-xs text-red-300">{errors.slug.message}</p>}
        </div>
      </div>

      <div className="space-y-2">
        <label htmlFor="project-description" className="text-sm font-medium">Short Description</label>
        <textarea
          id="project-description"
          {...register("description")}
          rows={2}
          className="w-full rounded-xl border border-border-hairline bg-surface-base px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-accent-signal"
          placeholder="A brief 1-2 sentence description..."
        />
        {errors.description && <p role="alert" className="text-xs text-red-300">{errors.description.message}</p>}
      </div>

        <div className="space-y-2">
          <div className="flex justify-between gap-3"><label htmlFor="project-tagline" className="text-sm font-medium">Card / page summary (Optional)</label><span className="text-xs text-ink-secondary">{watch("tagline")?.length ?? 0}/160</span></div>
          <input
            id="project-tagline"
            {...register("tagline")}
            maxLength={160}
            className="w-full rounded-xl border border-border-hairline bg-surface-base px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-accent-signal"
            placeholder="A concise description for the homepage and case study..."
          />
          {errors.tagline && <p className="text-xs text-red-500">{errors.tagline.message}</p>}
      </div>

      <div className="space-y-2">
        <label htmlFor="project-stage" className="text-sm font-medium">Development stage</label>
        <select id="project-stage" {...register("project_stage")} className="w-full rounded-xl border border-border-hairline bg-surface-base px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-accent-signal">
          {projectStages.map((stage) => <option key={stage} value={stage}>{projectStageLabels[stage]}</option>)}
        </select>
        <p className="text-xs text-ink-secondary">Independent of publication status. Completed shows Built and Latest update; other stages show Stage and Expected completion.</p>
        {errors.project_stage && <p className="text-xs text-red-500">{errors.project_stage.message}</p>}
      </div>

      <div className="grid gap-6 md:grid-cols-3">
        <div className="space-y-2">
          <label htmlFor="project-category" className="text-sm font-medium">Categories</label>
          <input
            id="project-category"
            {...register("category")}
            className="w-full rounded-xl border border-border-hairline bg-surface-base px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-accent-signal"
            maxLength={60}
            placeholder="Cybersecurity / Networking, AI/ML..."
          />
          <p className="text-xs text-ink-secondary">Separate categories with commas or spaced slashes; AI/ML stays one category.</p>
          {errors.category && <p className="text-xs text-red-500">{errors.category.message}</p>}
        </div>

        {completed ? <div className="space-y-2">
          <label htmlFor="project-built" className="text-sm font-medium">Built (Optional)</label>
          <input id="project-built" {...register("year")} maxLength={20} className="w-full rounded-xl border border-border-hairline bg-surface-base px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-accent-signal" placeholder="Q2 2026 or 2025" />
        </div> : <div className="space-y-2">
          <label htmlFor="project-expected-completion" className="text-sm font-medium">Expected completion (Optional)</label>
          <input id="project-expected-completion" {...register("expected_completion_label")} maxLength={32} className="w-full rounded-xl border border-border-hairline bg-surface-base px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-accent-signal" placeholder="Q2 2027" />
          {errors.expected_completion_label && <p className="text-xs text-red-500">{errors.expected_completion_label.message}</p>}
        </div>}

        <div className="space-y-2">
          <label htmlFor="project-tech-stack" className="text-sm font-medium">Tech stack (one per line)</label>
          <textarea
            id="project-tech-stack"
            {...register("tech_stack")}
            rows={3}
            className="w-full rounded-xl border border-border-hairline bg-surface-base px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-accent-signal"
            placeholder={"Next.js\nTypeScript\nSupabase"}
          />
          {errors.tech_stack && <p role="alert" className="text-xs text-red-300">{errors.tech_stack.message}</p>}
        </div>
      </div>

      {completed && <div className="space-y-2">
        <label htmlFor="project-latest-update" className="text-sm font-medium">Latest project update (Optional)</label>
        <input id="project-latest-update" {...register("latest_update_label")} maxLength={32} className="w-full rounded-xl border border-border-hairline bg-surface-base px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-accent-signal" placeholder="Q3 2026" />
        <p className="text-xs text-ink-secondary">Set this when you update the project itself, not when you edit this page.</p>
      </div>}

      <div className="space-y-2">
        <label htmlFor="project-tags" className="text-sm font-medium">Tags (comma-separated)</label>
        <textarea
          id="project-tags"
          {...register("tags")}
          rows={3}
          className="w-full rounded-xl border border-border-hairline bg-surface-base px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-accent-signal"
          placeholder="Web, Cybersecurity, AI/ML, Networking, SaaS..."
        />
        {errors.tags && <p role="alert" className="text-xs text-red-300">{errors.tags.message}</p>}
        <p className="text-xs text-ink-secondary">
          Add as many comma-separated tags as you need. All are searchable and filterable; project cards show up to three.
        </p>
      </div>

      <div className="space-y-2">
        <label htmlFor="project-features" className="text-sm font-medium">Key features / highlights (one per line)</label>
        <textarea
          id="project-features"
          {...register("features")}
          rows={4}
          className="w-full rounded-xl border border-border-hairline bg-surface-base px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-accent-signal"
          placeholder={"Realtime dashboard with live charts\nRole-based access control"}
        />
        {errors.features && <p role="alert" className="text-xs text-red-300">{errors.features.message}</p>}
      </div>

      <fieldset className="space-y-3 rounded-xl border border-border-hairline p-4">
        <legend className="px-1 text-sm font-medium">Related projects</legend>
        <p className="text-xs text-ink-secondary">Choose up to two published projects to show below this case study. They appear in the order selected. Leave empty to hide the section.</p>
        <p className="text-xs font-medium text-ink-secondary">Selected {selectedRelatedIds.length} / 2</p>
        {selectedRelatedIds.length > 0 && <ol className="space-y-1">
          {selectedRelatedIds.map((id, index) => {
            const chosen = availableProjects.find((item) => item.id === id);
            return <li key={id} className="flex items-center justify-between gap-3 rounded-lg bg-surface-base px-3 py-2 text-sm text-ink-primary">
              <span className="min-w-0 break-words">{index + 1}. {chosen?.title || "Project no longer available"}</span>
              <button type="button" onClick={() => setValue("related_project_ids", selectedRelatedIds.filter((value) => value !== id), { shouldDirty: true, shouldValidate: true })} className="shrink-0 text-xs text-ink-secondary underline underline-offset-2 hover:text-ink-primary">Remove</button>
            </li>;
          })}
        </ol>}
        <label htmlFor="related-project-search" className="sr-only">Search projects for related links</label>
        <input id="related-project-search" type="search" value={relatedSearch} onChange={(event) => setRelatedSearch(event.target.value)} placeholder="Search all projects..." className="w-full rounded-lg border border-border-hairline bg-surface-base px-3 py-2 text-sm text-ink-primary focus:outline-none focus:ring-2 focus:ring-accent-signal" />
        <div className="max-h-56 space-y-1 overflow-y-auto">
          {relatedOptions.map((item) => {
            const selected = selectedRelatedIds.includes(item.id);
            const disabled = !selected && (item.status !== "published" || selectedRelatedIds.length >= 2);
            return <label key={item.id} className={`flex items-center gap-3 rounded-lg border border-border-hairline px-3 py-2 text-sm ${disabled ? "cursor-not-allowed opacity-50" : "cursor-pointer hover:bg-surface-base"}`}>
              <input type="checkbox" checked={selected} disabled={disabled} onChange={() => setValue("related_project_ids", selected ? selectedRelatedIds.filter((id) => id !== item.id) : [...selectedRelatedIds, item.id], { shouldDirty: true, shouldValidate: true })} className="size-4 shrink-0 rounded border-border-hairline text-accent-signal focus:ring-accent-signal" />
              <span className="min-w-0 flex-1 break-words text-ink-primary">{item.title}</span>
              <span className="shrink-0 text-xs text-ink-secondary">{selected ? `#${selectedRelatedIds.indexOf(item.id) + 1}` : item.status}</span>
            </label>;
          })}
          {relatedOptions.length === 0 && <p className="px-3 py-4 text-sm text-ink-secondary">No matching projects.</p>}
        </div>
        {errors.related_project_ids && <p className="text-xs text-red-500">{errors.related_project_ids.message}</p>}
      </fieldset>

      <div className="grid gap-6 md:grid-cols-3">
        <div className="space-y-2">
          <label htmlFor="project-status" className="text-sm font-medium">Publication status</label>
          <select
            id="project-status"
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
          <label htmlFor="project-start-date" className="text-sm font-medium">Start Date (Optional)</label>
          <input
            id="project-start-date"
            type="date"
            {...register("start_date")}
            className="w-full rounded-xl border border-border-hairline bg-surface-base px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-accent-signal"
          />
          {errors.start_date && <p role="alert" className="text-xs text-red-300">{errors.start_date.message}</p>}
        </div>

        <div className="space-y-2">
          <label htmlFor="project-end-date" className="text-sm font-medium">End Date (Optional)</label>
          <input
            id="project-end-date"
            type="date"
            {...register("end_date")}
            className="w-full rounded-xl border border-border-hairline bg-surface-base px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-accent-signal"
          />
          {errors.end_date && <p role="alert" className="text-xs text-red-300">{errors.end_date.message}</p>}
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
          {coverUrl && <button type="button" disabled={galleryImages.length === 0} onClick={() => { const [nextCover, ...remaining] = galleryImages; setValue("cover_image_url", nextCover.url, { shouldDirty: true, shouldValidate: true }); setValue("cover_image_id", nextCover.mediaId, { shouldDirty: true }); setValue("case_study_sections.cover_caption", nextCover.caption, { shouldDirty: true, shouldValidate: true }); setValue("case_study_sections.cover_alt", nextCover.altText, { shouldDirty: true, shouldValidate: true }); setGalleryImages(remaining); }} className="inline-flex min-h-11 items-center gap-2 rounded-xl border border-border-hairline px-3 text-sm text-red-600 hover:bg-red-50 disabled:cursor-not-allowed disabled:opacity-50 dark:text-red-400 dark:hover:bg-red-950/30"><Trash2 className="size-4" aria-hidden />Remove cover</button>}
        </div>
        <p className="text-xs text-ink-secondary">Removing the cover promotes the next image. Add another image first if this is the only one. Changes take effect when you save and do not delete shared media-library images.</p>
        <label htmlFor="project-cover-url" className="block text-xs text-ink-secondary">Or enter a cover image URL</label>
        <input id="project-cover-url" {...coverField} onChange={(event) => { coverField.onChange(event); setValue("cover_image_id", "", { shouldDirty: true }); setValue("case_study_sections.cover_caption", "", { shouldDirty: true }); setValue("case_study_sections.cover_alt", "", { shouldDirty: true }); }} className="w-full rounded-xl border border-border-hairline bg-surface-base px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-accent-signal" placeholder="https://..." />
        <input type="hidden" {...register("cover_image_id")} />
        {errors.cover_image_url && <p className="text-xs text-red-500">{errors.cover_image_url.message}</p>}
        <label htmlFor="project-cover-caption" className="block text-xs text-ink-secondary">Cover caption (optional, up to 200 characters / 30 words)</label>
        <textarea id="project-cover-caption" {...register("case_study_sections.cover_caption")} rows={2} maxLength={200} className="w-full rounded-xl border border-border-hairline bg-surface-base px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-accent-signal" placeholder="Describe this image" />
        <p className={`text-xs ${captionWordCount(coverCaption) > 30 ? "text-red-600 dark:text-red-400" : "text-ink-secondary"}`}>{coverCaption.length} / 200 characters, {captionWordCount(coverCaption)} / 30 words</p>
        {errors.case_study_sections?.cover_caption && <p className="text-xs text-red-500">{errors.case_study_sections.cover_caption.message}</p>}
        <label htmlFor="project-cover-alt" className="block text-xs text-ink-secondary">Cover image description for screen readers (optional, up to 160 characters)</label>
        <input id="project-cover-alt" {...register("case_study_sections.cover_alt")} maxLength={160} className="w-full rounded-xl border border-border-hairline bg-surface-base px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-accent-signal" placeholder="Describe what the cover image shows" />
        {errors.case_study_sections?.cover_alt && <p className="text-xs text-red-500">{errors.case_study_sections.cover_alt.message}</p>}
      </div>

      <div className="space-y-3">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <h3 className="text-sm font-medium">More carousel images</h3>
          <button
            type="button"
            onClick={() => { setMediaPickerTarget("gallery"); setMediaPickerTab("library"); setIsMediaPickerOpen(true); }}
            className="inline-flex items-center gap-2 rounded-xl border border-border-hairline bg-surface-base px-3 py-2 text-sm hover:bg-surface-raised"
          >
            <ImageIcon className="h-4 w-4" /> Add from Media Library
          </button>
        </div>
        <p className="text-xs text-ink-secondary">Captions are optional, up to 200 characters and 30 words.</p>
        {galleryImages.length === 0 && <p className="text-sm text-ink-secondary">No additional images yet.</p>}
        <div className="space-y-3">
          {galleryImages.map((image, index) => (
            <div key={image.mediaId} className="flex flex-col gap-3 rounded-xl border border-border-hairline bg-surface-base p-3 sm:flex-row sm:items-center">
              <Image src={image.url} alt={image.altText || image.caption || "Project gallery image"} width={128} height={96} className="h-24 w-full rounded-lg object-cover sm:w-32" />
              <div className="min-w-0 flex-1 space-y-1">
                <label htmlFor={`gallery-caption-${image.mediaId}`} className="text-xs text-ink-secondary">Caption</label>
                <textarea
                  id={`gallery-caption-${image.mediaId}`}
                  value={image.caption}
                  rows={2}
                  maxLength={200}
                  onChange={(event) => setGalleryImages((images) => images.map((item) => item.mediaId === image.mediaId ? { ...item, caption: event.target.value.replace(/\r\n?/g, "\n").slice(0, 200) } : item))}
                  className="w-full rounded-lg border border-border-hairline bg-surface-raised px-3 py-2 text-sm"
                  placeholder="Optional caption (200 characters max)"
                />
                <p className={`text-xs ${captionWordCount(image.caption) > 30 ? "text-red-600 dark:text-red-400" : "text-ink-secondary"}`}>{image.caption.length} / 200 characters, {captionWordCount(image.caption)} / 30 words</p>
                <label htmlFor={`gallery-alt-${image.mediaId}`} className="block text-xs text-ink-secondary">Image description for screen readers (optional, up to 160 characters)</label>
                <input id={`gallery-alt-${image.mediaId}`} value={image.altText} maxLength={160} onChange={(event) => setGalleryImages((images) => images.map((item) => item.mediaId === image.mediaId ? { ...item, altText: event.target.value } : item))} className="w-full rounded-lg border border-border-hairline bg-surface-raised px-3 py-2 text-sm" placeholder="Describe what this image shows" />
                <button type="button" onClick={() => chooseCover(image)} className="min-h-11 text-left text-xs text-accent-signal underline underline-offset-2">Make cover (first image)</button>
              </div>
               <div className="flex flex-wrap gap-1">
                <button type="button" aria-label={`Replace image ${index + 2}`} onClick={() => { setReplacingIndex(index); setMediaPickerTarget("replace-gallery"); setMediaPickerTab("upload"); setIsMediaPickerOpen(true); }} className="flex size-11 items-center justify-center rounded-lg hover:bg-surface-raised"><UploadCloud className="h-4 w-4" /></button>
                <button type="button" aria-label={`Move image ${index + 1} up`} disabled={index === 0} onClick={() => setGalleryImages((images) => { const next = [...images]; [next[index - 1], next[index]] = [next[index], next[index - 1]]; return next; })} className="flex size-11 items-center justify-center rounded-lg hover:bg-surface-raised disabled:opacity-40"><ArrowUp className="h-4 w-4" /></button>
                <button type="button" aria-label={`Move image ${index + 1} down`} disabled={index === galleryImages.length - 1} onClick={() => setGalleryImages((images) => { const next = [...images]; [next[index], next[index + 1]] = [next[index + 1], next[index]]; return next; })} className="flex size-11 items-center justify-center rounded-lg hover:bg-surface-raised disabled:opacity-40"><ArrowDown className="h-4 w-4" /></button>
                <button type="button" aria-label={`Remove image ${index + 1}`} onClick={() => setGalleryImages((images) => images.filter((item) => item.mediaId !== image.mediaId))} className="flex size-11 items-center justify-center rounded-lg text-red-400 hover:bg-surface-raised"><Trash2 className="h-4 w-4" /></button>
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
              const oldUrl = getValues("cover_image_url");
              const oldId = getValues("cover_image_id");
              const oldCaption = getValues("case_study_sections.cover_caption") || "";
              const oldAlt = getValues("case_study_sections.cover_alt") || "";
              setValue("cover_image_url", media.secure_url || media.url, { shouldDirty: true, shouldValidate: true });
              setValue("cover_image_id", media.id, { shouldDirty: true });
              setValue("case_study_sections.cover_caption", "", { shouldDirty: true, shouldValidate: true });
              setValue("case_study_sections.cover_alt", "", { shouldDirty: true, shouldValidate: true });
              setGalleryImages((images) => {
                const remaining = images.filter((image) => image.mediaId !== media.id);
                return oldId && oldId !== media.id && !remaining.some((image) => image.mediaId === oldId)
                  ? [{ mediaId: oldId, url: oldUrl, caption: oldCaption, altText: oldAlt }, ...remaining]
                  : remaining;
              });
          } else if (mediaPickerTarget === "replace-gallery") {
            if (media.id === getValues("cover_image_id")) return;
            setGalleryImages((images) => images.some((image, index) => image.mediaId === media.id && index !== replacingIndex)
              ? images
              : images.map((image, index) => index === replacingIndex ? { mediaId: media.id, url: media.secure_url || media.url, caption: "", altText: "" } : image));
          } else {
            if (media.id === getValues("cover_image_id")) return;
            setGalleryImages((images) => images.some((image) => image.mediaId === media.id)
              ? images
              : [...images, { mediaId: media.id, url: media.secure_url || media.url, caption: "", altText: "" }]);
          }
        }}
      />

      <div className="space-y-2">
        <p className="text-sm font-medium">Content / Case Study (Markdown)</p>
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
        {errors.content && <p role="alert" className="text-xs text-red-300">{errors.content.message}</p>}
      </div>

      <div className="space-y-5 border-t border-border-hairline pt-6">
        <div><h2 className="text-lg font-medium">Case study sections</h2><p className="text-xs text-ink-secondary">Write only what applies to this project. Use bold or italic for emphasis and lists for steps or outcomes. Changes are saved as Markdown.</p></div>
        {sectionFields.map(({ key, label, hint }) => (
          <div key={key} className="space-y-2">
            <p className="text-sm font-medium">{label} (Optional)</p>
            <Controller
              name={`case_study_sections.${key}`}
              control={control}
              render={({ field }) => <TiptapEditor label={label} story value={field.value || ""} onChange={field.onChange} />}
            />
            <p className="text-xs text-ink-secondary">{hint} Up to 10,000 characters.</p>
            {errors.case_study_sections?.[key] && <p className="text-xs text-red-500">{errors.case_study_sections[key]?.message}</p>}
          </div>
        ))}
      </div>

      <div className="flex flex-wrap justify-end gap-4">
        <button
          type="button"
          onClick={() => { if (isSubmitting) return; if (isDirty || galleryDirty) setLeaveConfirmation(true); else router.push("/admin/projects"); }}
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
          Save Project
        </button>
      </div>
    </form>
    <AdminConfirmDialog open={saveConfirmation !== null} title={saveConfirmation?.title || "Confirm publication"} description={saveConfirmation?.description || ""} confirmLabel={saveConfirmation?.label || "Confirm"} pending={isSubmitting} onClose={() => setSaveConfirmation(null)} onConfirm={() => { const pending = saveConfirmation; setSaveConfirmation(null); if (pending) void saveProject(pending.data); }} />
    <AdminConfirmDialog open={leaveConfirmation} title="Discard unsaved project changes?" description="Project details and gallery changes on this page have not been saved." confirmLabel="Discard changes" destructive onClose={() => setLeaveConfirmation(false)} onConfirm={() => { setLeaveConfirmation(false); router.push("/admin/projects"); }} />
    </>
  );
}
