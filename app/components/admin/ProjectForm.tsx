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
import { BuildlogSelect } from "./BuildlogSelect";
import { Listbox, ListboxButton, ListboxOption, ListboxOptions } from "@headlessui/react";
import { useAdminNavigationGuard } from "./useAdminNavigationGuard";
import { readAdminResponse } from "@/app/lib/admin/read-admin-response";
import { prepareImageForUpload } from "@/app/lib/admin/prepare-image-upload";
import { captionWordCount } from "@/app/lib/project-captions";
import { projectStages, projectStageLabels } from "@/app/lib/project-stage";
import { normalizeBlogSlug } from "@/app/lib/blog-defaults";
import { Image as ImageIcon, Loader2, Sparkles, ArrowUp, ArrowDown, Trash2, UploadCloud, X, Globe, Shield, Check, ChevronDown } from "lucide-react";

type GalleryImage = { mediaId: string; url: string; caption: string; altText: string; fileName?: string };
type StagedImage = { id: string; file: File; url: string; caption: string; altText: string };

const sectionFields = [
  { key: "why_built", label: "Why I built this", hint: "The problem and your motivation." },
  { key: "key_decisions", label: "Key decisions", hint: "Important technical or design tradeoffs." },
  { key: "results", label: "Results", hint: "Measured outcomes or what shipped. Leave blank if not known." },
  { key: "lessons_learned", label: "What I learned", hint: "What you would carry into the next project." },
] as const;
const stageOptions = projectStages.map((stage) => ({ value: stage, label: projectStageLabels[stage] }));
const statusOptions = [
  { value: "draft", label: "Draft", hint: "Only visible in Admin" },
  { value: "published", label: "Published", hint: "Visible on the public Projects page" },
  { value: "archived", label: "Archived", hint: "Hidden from visitors" },
] as const;

export const projectDomainOptions = [
  { value: "Web Development", label: "Web Development", hint: "Full-stack apps, SaaS, frontends, APIs" },
  { value: "Cybersecurity", label: "Cybersecurity", hint: "SOC, defense, penetration testing & tools" },
  { value: "AI / ML", label: "AI / ML", hint: "Machine learning, LLMs, NLP, predictive models" },
] as const;

export type ProjectDomain = (typeof projectDomainOptions)[number]["value"];

function normalizeDomain(val?: string | null): ProjectDomain {
  if (!val) return "Web Development";
  const lower = val.toLowerCase();
  if (/cyber|security|nids|sniff|packet/.test(lower)) return "Cybersecurity";
  if (/\bai\b|machine.?learning|\bml\b|gpt|llm/.test(lower)) return "AI / ML";
  return "Web Development";
}

type CaseStudySections = Record<(typeof sectionFields)[number]["key"], string>;
const emptySections: CaseStudySections = { why_built: "", key_decisions: "", results: "", lessons_learned: "" };
const optionalHttpUrl = z.string().refine((url) => !url || (z.string().url().safeParse(url).success && /^https?:\/\//i.test(url)), "Use an HTTP or HTTPS URL");

function mergeProjectTokens(current: string, draft: string, separator: "," | "\n") {
  const split = separator === "," ? /[,\n]/ : /\r?\n/;
  const tokens = current.split(split).map((value) => value.trim()).filter(Boolean);
  for (const value of draft.split(split).map((part) => part.trim()).filter(Boolean)) {
    if (value.length > 100 || !/[\p{L}\p{N}]/u.test(value)) return null;
    if (!tokens.some((item) => item.toLocaleLowerCase() === value.toLocaleLowerCase())) tokens.push(value);
  }
  return tokens.length <= 32 ? tokens.join(separator === "," ? ", " : "\n") : null;
}

function ProjectPillEditor({ id, label, value, draft, onDraftChange, onChange, separator, hint, error }: {
  id: string; label: string; value: string; draft: string; onDraftChange: (value: string) => void;
  onChange: (value: string) => void; separator: "," | "\n"; hint: string; error?: string;
}) {
  const [inputError, setInputError] = useState("");
  const tokens = value.split(separator === "," ? /,/ : /\r?\n/).map((item) => item.trim()).filter(Boolean);
  const add = (text = draft) => {
    const next = mergeProjectTokens(value, text, separator);
    if (next === null) {
      setInputError("Use at most 32 unique entries with letters or numbers, each under 101 characters.");
      return;
    }
    onChange(next);
    onDraftChange("");
    setInputError("");
  };
  return <div className="min-w-0 space-y-2 rounded-xl border border-border-hairline bg-surface-base p-4">
    <label htmlFor={id} className="block text-sm font-medium">{label}</label>
    <p className="text-xs text-ink-secondary">{hint} {tokens.length} / 32 selected.</p>
    {tokens.length > 0 && <div className="flex flex-wrap gap-2">{tokens.map((item, index) =>
      <span key={`${item}-${index}`} className="inline-flex max-w-full items-center gap-1.5 rounded-full border border-border-hairline bg-surface-raised pl-3 pr-1 text-sm text-ink-primary">
        <span className="min-w-0 break-words">{item}</span>
        <button type="button" aria-label={`Remove ${item} from ${label}`} onClick={() => onChange(tokens.filter((_, position) => position !== index).join(separator === "," ? ", " : "\n"))} className="flex size-11 shrink-0 items-center justify-center rounded-full text-ink-secondary hover:bg-surface-base focus-visible:outline focus-visible:outline-2 focus-visible:outline-current"><X className="size-4" aria-hidden /></button>
      </span>)}</div>}
    <div className="flex gap-2">
      <input id={id} value={draft} onChange={(event) => { const text = event.target.value; onDraftChange(text); if (separator === "," && text.includes(",")) add(text); }} onPaste={(event) => { const pasted = event.clipboardData.getData("text"); if (pasted.includes(separator)) { event.preventDefault(); add(`${draft}${pasted}`); } }} onKeyDown={(event) => { if (event.key === "Enter") { event.preventDefault(); add(); } }} aria-invalid={Boolean(error || inputError)} aria-describedby={error || inputError ? `${id}-error` : undefined} className="min-h-11 min-w-0 flex-1 rounded-xl border border-border-hairline bg-surface-raised px-3 text-sm focus-visible:outline focus-visible:outline-2 focus-visible:outline-current" placeholder={separator === "," ? "Add tags, separated by commas" : "Add a technology"} />
      <button type="button" onClick={() => add()} aria-label={`Add ${label}`} className="min-h-11 rounded-xl border border-border-hairline px-4 text-sm hover:bg-surface-raised focus-visible:outline focus-visible:outline-2 focus-visible:outline-current">Add</button>
    </div>
    {(error || inputError) && <p id={`${id}-error`} role="alert" className="text-xs text-red-300">{error || inputError}</p>}
  </div>;
}

export function ProjectDomainSelect({
  id = "project-category",
  value,
  onChange,
  errorId,
}: {
  id?: string;
  value?: string | null;
  onChange: (value: ProjectDomain) => void;
  errorId?: string;
}) {
  const normalized = normalizeDomain(value);
  const current = projectDomainOptions.find((opt) => opt.value === normalized) ?? projectDomainOptions[0];

  return (
    <Listbox value={normalized} onChange={onChange}>
      <div className="relative min-w-0">
        <ListboxButton
          id={id}
          aria-invalid={Boolean(errorId)}
          aria-describedby={errorId}
          className="group flex min-h-11 w-full items-center justify-between gap-3 rounded-xl border border-border-hairline bg-surface-base px-3 text-left text-sm text-ink-primary transition-all duration-150 hover:border-[#55555e] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-white"
        >
          <span className="flex min-w-0 items-center gap-2.5">
            <span
              className={`flex size-6 shrink-0 items-center justify-center rounded-lg border text-xs ${
                current.value === "Cybersecurity"
                  ? "border-sky-500/30 bg-sky-500/10 text-sky-400"
                  : current.value === "AI / ML"
                  ? "border-violet-500/30 bg-violet-500/10 text-violet-400"
                  : "border-emerald-500/30 bg-emerald-500/10 text-emerald-400"
              }`}
            >
              {current.value === "Cybersecurity" ? (
                <Shield className="size-3.5" />
              ) : current.value === "AI / ML" ? (
                <Sparkles className="size-3.5" />
              ) : (
                <Globe className="size-3.5" />
              )}
            </span>
            <span className="truncate font-medium">{current.label}</span>
          </span>
          <div className="flex shrink-0 items-center gap-2">
            <span
              className={`hidden sm:inline-flex items-center rounded-md px-1.5 py-0.5 font-mono text-[10px] uppercase tracking-wider border ${
                current.value === "Cybersecurity"
                  ? "border-sky-500/20 bg-sky-500/5 text-sky-300"
                  : current.value === "AI / ML"
                  ? "border-violet-500/20 bg-violet-500/5 text-violet-300"
                  : "border-emerald-500/20 bg-emerald-500/5 text-emerald-300"
              }`}
            >
              {current.value === "Cybersecurity"
                ? "Header: Cyber"
                : current.value === "AI / ML"
                ? "Header: AI"
                : "Header: Web"}
            </span>
            <ChevronDown
              aria-hidden
              className="size-4 text-ink-secondary transition-transform duration-200 group-data-[open]:rotate-180"
            />
          </div>
        </ListboxButton>

        <ListboxOptions
          anchor="bottom"
          modal={false}
          className="z-50 max-h-[min(24rem,calc(100dvh-6rem))] w-[var(--button-width)] overflow-y-auto rounded-xl border border-[#55555e] bg-[#1b1b1f] p-1.5 text-sm text-white shadow-2xl outline-none [--anchor-gap:6px]"
        >
          {projectDomainOptions.map((option) => {
            const isCyber = option.value === "Cybersecurity";
            const isAI = option.value === "AI / ML";
            const isWeb = option.value === "Web Development";

            return (
              <ListboxOption
                key={option.value}
                value={option.value}
                className="group flex min-h-12 cursor-pointer items-center justify-between gap-3 rounded-lg px-3 py-2 text-white transition-colors data-[focus]:bg-[#303036] data-[selected]:bg-white data-[selected]:text-[#101013]"
              >
                <div className="flex min-w-0 items-center gap-3">
                  <div
                    className={`flex size-8 shrink-0 items-center justify-center rounded-lg border text-sm transition-colors group-data-[selected]:bg-[#101013]/10 group-data-[selected]:border-[#101013]/20 group-data-[selected]:text-[#101013] ${
                      isCyber
                        ? "border-sky-500/30 bg-sky-500/10 text-sky-400"
                        : isAI
                        ? "border-violet-500/30 bg-violet-500/10 text-violet-400"
                        : "border-emerald-500/30 bg-emerald-500/10 text-emerald-400"
                    }`}
                  >
                    {isCyber ? (
                      <Shield className="size-4" />
                    ) : isAI ? (
                      <Sparkles className="size-4" />
                    ) : (
                      <Globe className="size-4" />
                    )}
                  </div>
                  <div className="min-w-0">
                    <div className="flex items-center gap-2">
                      <span className="font-medium">{option.label}</span>
                      <span className="font-mono text-[10px] opacity-70 group-data-[selected]:opacity-90">
                        {isCyber
                          ? "● Shipped: Cyber"
                          : isAI
                          ? "● Shipped: AI"
                          : "● Shipped: Web"}
                      </span>
                    </div>
                    {option.hint && (
                      <span className="block text-xs opacity-75">{option.hint}</span>
                    )}
                  </div>
                </div>
                <Check
                  aria-hidden
                  className="size-4 shrink-0 opacity-0 transition-opacity group-data-[selected]:opacity-100"
                />
              </ListboxOption>
            );
          })}
        </ListboxOptions>
      </div>
    </Listbox>
  );
}

const projectSchema = z.object({
  title: z.string().trim().min(1, "Title is required").max(200, "Title must be 200 characters or fewer"),
  slug: z.string().regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/, "Use lowercase letters, numbers and hyphens").max(200),
  description: z.string().max(10000).optional(),
  tagline: z.string().trim().min(1, "Add a short summary for project cards and the detail header").max(160, "Keep the summary within 160 characters"),
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
  tech_stack: z.string().refine((value) => { const items = value.split(/\r?\n/).filter((item) => item.trim()); return items.length <= 32 && items.every((item) => item.trim().length <= 100); }, "Use at most 32 technologies, each within 100 characters").optional(),
  tags: z.string().refine((value) => { const items = value.split(",").filter((item) => item.trim()); return items.length <= 32 && items.every((item) => item.trim().length <= 100); }, "Use at most 32 tags, each within 100 characters").optional(),
  features: z.string().refine((value) => { const items = value.split(/\r?\n/).filter((item) => item.trim()); return items.length <= 100 && items.every((item) => item.trim().length <= 500); }, "Use at most 100 features, each within 500 characters").optional(),
  related_project_ids: z.array(z.string().uuid()).max(2, "Choose no more than two projects").refine((ids) => new Set(ids).size === ids.length, "Choose two different projects"),
  content: z.string().max(200000, "Case study must be 200,000 characters or fewer").optional(),
  status: z.enum(["draft", "published", "archived"]),
  cover_image_url: z.string().refine((url) => !url || (z.string().url().safeParse(url).success && /^https?:\/\//i.test(url)), "Use an HTTP or HTTPS image URL"),
  cover_image_id: z.string().uuid().optional().or(z.literal("")),
  live_url: optionalHttpUrl.optional(),
  github_url: optionalHttpUrl.optional(),
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
    start_date?: string | null;
    end_date?: string | null;
    featured?: boolean;
    case_study_sections?: Partial<CaseStudySections & { cover_caption: string; cover_alt: string }> | null;
  };
}

export function ProjectForm({ initialData, availableProjects }: ProjectFormProps) {
  const router = useRouter();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState("");
  const [isMediaPickerOpen, setIsMediaPickerOpen] = useState(false);
  const [mediaPickerTarget, setMediaPickerTarget] = useState<"cover" | "gallery">("cover");
  const [galleryImages, setGalleryImages] = useState<GalleryImage[]>(initialData?.galleryImages ?? []);
  const [stagedImages, setStagedImages] = useState<StagedImage[]>([]);
  const [stagedCoverId, setStagedCoverId] = useState<string | null>(null);
  const stagedUrls = useRef(new Set<string>());
  const uploadedMedia = useRef(new Map<string, { url: string; secure_url: string }>());
  const [uploadedCount, setUploadedCount] = useState(0);
  const [isCleaningMedia, setIsCleaningMedia] = useState(false);
  const cleanupInProgress = useRef(false);
  const [isGenerating, setIsGenerating] = useState(false);
  const [relatedSearch, setRelatedSearch] = useState("");
  const [techDraft, setTechDraft] = useState("");
  const [tagDraft, setTagDraft] = useState("");
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
      tagline: initialData?.tagline || (initialData?.description || "").slice(0, 160),
      category: normalizeDomain(initialData?.category),
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
      content: initialData?.content || initialData?.description || "",
      status: (initialData?.status as ProjectFormValues["status"]) ?? "draft",
      cover_image_url: initialData?.cover_image_url ?? "",
      cover_image_id: initialData?.cover_image_id ?? "",
      live_url: initialData?.live_url ?? "",
      github_url: initialData?.github_url ?? "",
    },
  });
  const coverUrl = watch("cover_image_url") || "";
  const stagedCover = stagedImages.find((image) => image.id === stagedCoverId);
  const coverPreview = stagedCover?.url || coverUrl;
  const completed = watch("project_stage") === "completed";
  const selectedRelatedIds = watch("related_project_ids") || [];
  const relatedOptions = availableProjects.filter((item) => item.id !== initialData?.id && `${item.title} ${item.slug}`.toLowerCase().includes(relatedSearch.trim().toLowerCase()));
  const coverCaption = watch("case_study_sections.cover_caption") || "";
  const coverField = register("cover_image_url");
  const galleryDirty = JSON.stringify(galleryImages) !== JSON.stringify(initialData?.galleryImages ?? []);
  const { leaveTarget: navigationTarget, setLeaveTarget: setNavigationTarget, confirmLeave } = useAdminNavigationGuard(isDirty || galleryDirty || stagedImages.length > 0 || uploadedCount > 0 || Boolean(techDraft.trim() || tagDraft.trim()));

  useEffect(() => {
    if (!isDirty && !galleryDirty && !stagedImages.length && !uploadedCount && !techDraft.trim() && !tagDraft.trim()) return;
    const warn = (event: BeforeUnloadEvent) => { event.preventDefault(); event.returnValue = ""; };
    window.addEventListener("beforeunload", warn);
    return () => window.removeEventListener("beforeunload", warn);
  }, [isDirty, galleryDirty, stagedImages.length, uploadedCount, techDraft, tagDraft]);

  useEffect(() => () => { for (const url of stagedUrls.current) URL.revokeObjectURL(url); }, []);

  const stageFiles = (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = [...(event.target.files || [])];
    event.target.value = "";
    if (!files.length) return;
    if (galleryImages.length + stagedImages.length + files.length > (coverUrl ? 20 : 21)) { setErrorMsg("Choose no more than 20 gallery images and one cover."); return; }
    if (files.some((file) => ((file.type !== "" && !file.type.startsWith("image/")) || (file.type === "" && !/\.(?:jpe?g|png|webp|gif|avif|heic|heif|tiff?|bmp|ico)$/i.test(file.name)) || file.type === "image/svg+xml" || /\.svgz?$/i.test(file.name) || !file.name || file.name.length > 255 || !file.size || file.size > 20 * 1024 * 1024))) {
      setErrorMsg("Choose nonempty images under 20 MB with filenames under 256 characters. SVG is not supported.");
      return;
    }
    const next = files.map((file) => { const url = URL.createObjectURL(file); stagedUrls.current.add(url); return { id: crypto.randomUUID(), file, url, caption: "", altText: "" }; });
    setStagedImages((current) => [...current, ...next]);
    if (!coverUrl && !stagedCoverId) setStagedCoverId(next[0].id);
    setErrorMsg("");
  };

  const removeStaged = (id: string) => {
    const image = stagedImages.find((item) => item.id === id);
    if (image) { URL.revokeObjectURL(image.url); stagedUrls.current.delete(image.url); }
    setStagedImages((current) => current.filter((item) => item.id !== id));
    if (stagedCoverId === id) setStagedCoverId(null);
  };

  const discardSessionUploads = async (preserve = new Set<string>()) => {
    if (cleanupInProgress.current) {
      setErrorMsg("Wait for image uploads or cleanup to finish before leaving.");
      return false;
    }
    if (!uploadedMedia.current.size) return true;
    cleanupInProgress.current = true;
    setIsCleaningMedia(true);
    setErrorMsg("");
    const removed = new Set<string>();
    try {
      for (const id of uploadedMedia.current.keys()) {
        if (preserve.has(id)) continue;
        try {
          const response = await fetch(`/api/admin/media?id=${encodeURIComponent(id)}`, { method: "DELETE" });
          const result = await readAdminResponse(response, "Unsaved Project image cleanup");
          if (!response.ok || result.success !== true) continue;
          uploadedMedia.current.delete(id);
          removed.add(id);
        } catch { /* Keep failed uploads tracked for retry. */ }
      }
      if (removed.size) {
        setGalleryImages((current) => current.filter((image) => !removed.has(image.mediaId)));
        if (removed.has(getValues("cover_image_id") || "")) {
          setValue("cover_image_url", initialData?.cover_image_url || "", { shouldDirty: true, shouldValidate: true });
          setValue("cover_image_id", initialData?.cover_image_id || "", { shouldDirty: true });
          setValue("case_study_sections.cover_caption", initialData?.case_study_sections?.cover_caption || "", { shouldDirty: true });
          setValue("case_study_sections.cover_alt", initialData?.case_study_sections?.cover_alt || "", { shouldDirty: true });
        }
      }
      setUploadedCount(uploadedMedia.current.size);
      const remaining = [...uploadedMedia.current.keys()].filter((id) => !preserve.has(id)).length;
      if (remaining) {
        setErrorMsg(`${remaining} uploaded image(s) could not be removed. They remain in the Media Library; review their references or retry leaving.`);
        return false;
      }
      return true;
    } finally {
      cleanupInProgress.current = false;
      setIsCleaningMedia(false);
    }
  };

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
    setStagedCoverId(null);
    setValue("case_study_sections.cover_caption", image.caption, { shouldDirty: true, shouldValidate: true });
    setValue("case_study_sections.cover_alt", image.altText, { shouldDirty: true, shouldValidate: true });
    setErrorMsg("");
  };

  const saveProject = async (data: ProjectFormValues) => {
    setIsSubmitting(true);
    setErrorMsg("");
    const createdIds: string[] = [];
    try {
      if ([...galleryImages, ...stagedImages].some((image) => captionWordCount(image.caption) > 30)) {
        throw new Error("Each image caption must be 30 words or fewer.");
      }
      if (galleryImages.length + stagedImages.length - Number(Boolean(stagedCoverId)) > 20) throw new Error("Choose no more than 20 gallery images.");
      const preserve = new Set(galleryImages.map((image) => image.mediaId));
      if (data.cover_image_id) preserve.add(data.cover_image_id);
      const submittedText = JSON.stringify(data);
      for (const [id, media] of uploadedMedia.current) {
        if ([media.url, media.secure_url].some((url) => Boolean(url) && submittedText.includes(url))) preserve.add(id);
      }
      if (!await discardSessionUploads(preserve)) return;
      const uploaded = new Map<string, { id: string; url: string }>();
      for (const staged of stagedImages) {
        const fileToUpload = await prepareImageForUpload(staged.file);
        const body = new FormData();
        body.append("file", fileToUpload);
        body.append("original_filename", staged.file.name);
        const response = await fetch("/api/admin/media/upload", { method: "POST", body });
        const result = await readAdminResponse(response, "Project image upload");
        if (!response.ok || !result.data?.id) throw new Error(result.error || "Project image upload could not be confirmed. Check the Media Library before retrying.");
        const url = result.data.secure_url || result.data.url;
        uploadedMedia.current.set(result.data.id, { url: result.data.url, secure_url: result.data.secure_url });
        createdIds.push(result.data.id);
        setUploadedCount(uploadedMedia.current.size);
        if (!url) throw new Error("Project image upload returned no URL. Cleanup was attempted; check the Media Library before retrying.");
        uploaded.set(staged.id, { id: result.data.id, url });
      }
      const chosenCover = stagedCoverId ? uploaded.get(stagedCoverId) : null;
      const existingCover = chosenCover && data.cover_image_id && data.cover_image_url && !galleryImages.some((image) => image.mediaId === data.cover_image_id)
        ? [{ mediaId: data.cover_image_id, url: data.cover_image_url, caption: data.case_study_sections.cover_caption, altText: data.case_study_sections.cover_alt }]
        : [];
      const fullGallery = [...existingCover, ...galleryImages, ...stagedImages.filter((image) => image.id !== stagedCoverId).map((image) => ({ mediaId: uploaded.get(image.id)!.id, url: uploaded.get(image.id)!.url, caption: image.caption, altText: image.altText }))];
      if (fullGallery.length > 20) throw new Error("Choose no more than 20 gallery images after selecting the cover.");
      const payload = {
        ...data,
        start_date: initialData?.start_date || "",
        end_date: initialData?.end_date || "",
        featured: initialData?.featured === true,
        cover_image_url: chosenCover?.url || data.cover_image_url,
        cover_image_id: chosenCover?.id || data.cover_image_id,
        case_study_sections: chosenCover ? { ...data.case_study_sections, cover_caption: stagedCover?.caption || "", cover_alt: stagedCover?.altText || "" } : data.case_study_sections,
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
        gallery: fullGallery.map(({ mediaId, caption, altText }) => ({ mediaId, caption, altText })),
      };
      const res = await fetch("/api/admin/projects", {
        method: initialData?.id ? "PUT" : "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(initialData?.id ? { id: initialData.id, updated_at: initialData.updated_at, ...payload } : payload),
      });

      const result = await readAdminResponse(res, "Project");
      if (!res.ok) {
        const err = result;
        if (err.issues?.fieldErrors) {
          for (const [name, messages] of Object.entries(err.issues.fieldErrors)) {
            if (name in projectSchema.shape && Array.isArray(messages) && typeof messages[0] === "string") {
              setError(name as keyof ProjectFormValues, { message: messages[0] });
            }
          }
        }
        throw new Error(err.error || "Failed to save project");
      }
      if (!result?.id) throw new Error("Project save could not be confirmed. Refresh the list before retrying.");

      uploadedMedia.current.clear();
      setUploadedCount(0);
      router.push("/admin/projects");
      router.refresh();
    } catch (err: any) {
      const preserveOthers = new Set([...uploadedMedia.current.keys()].filter((id) => !createdIds.includes(id)));
      const cleaned = createdIds.length ? await discardSessionUploads(preserveOthers) : true;
      setErrorMsg(`${err instanceof Error ? err.message : "Project save failed."}${cleaned ? "" : " Some new files may remain in the Media Library; review them before retrying."}`);
    } finally {
      setIsSubmitting(false);
    }
  };

  const onSubmit = (data: ProjectFormValues) => {
    if (!data.cover_image_url && !stagedCoverId) { setError("cover_image_url", { message: "Choose a cover image before saving." }); return; }
    const techStack = mergeProjectTokens(data.tech_stack || "", techDraft, "\n");
    const tags = mergeProjectTokens(data.tags || "", tagDraft, ",");
    if (techStack === null || tags === null) {
      setErrorMsg("Review the Tech stack and Tags entries before saving.");
      return;
    }
    data = { ...data, tech_stack: techStack, tags };
    setValue("tech_stack", techStack, { shouldDirty: true, shouldValidate: true });
    setValue("tags", tags, { shouldDirty: true, shouldValidate: true });
    setTechDraft("");
    setTagDraft("");
    if (isSubmitting || isCleaningMedia) {
      setErrorMsg("Wait for image uploads or cleanup to finish before saving.");
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
      setError("github_url", { message: "Enter a GitHub URL before generating project details." });
      setErrorMsg("Enter a GitHub URL before generating project details.");
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
      
      const { result, error } = await readAdminResponse(res, "Project generation");
      if (!res.ok) throw new Error(error || "Failed to generate");
      if (!result || typeof result !== "object") throw new Error("Project generation returned no result. No changes were applied.");
      
      if (result.summary) setValue("tagline", result.summary.slice(0, 160), { shouldDirty: true, shouldValidate: true });
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
        <div className="flex justify-between gap-3"><label htmlFor="project-tagline" className="text-sm font-medium">Summary</label><span className="text-xs text-ink-secondary">{watch("tagline")?.length ?? 0}/160</span></div>
        <input
          id="project-tagline"
          {...register("tagline")}
          maxLength={160}
          className="w-full rounded-xl border border-border-hairline bg-surface-base px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-accent-signal"
          placeholder="One concise summary for the project header, cards and search previews"
        />
        <p className="text-xs text-ink-secondary">Used in the detail-page header, all short card descriptions and search/social metadata. Write a brief sentence; longer context belongs in Overview below.</p>
        {errors.tagline && <p className="text-xs text-red-500">{errors.tagline.message}</p>}
      </div>

      <div className="space-y-2">
        <label htmlFor="project-features" className="text-sm font-medium">Key highlights (one per line)</label>
        <textarea id="project-features" {...register("features")} rows={4} className="w-full rounded-xl border border-border-hairline bg-surface-base px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-accent-signal" placeholder={"Realtime dashboard with live charts\nRole-based access control"} />
        <p className="text-xs text-ink-secondary">These become the bullets on project cards and the Highlights section in the case study.</p>
        {errors.features && <p role="alert" className="text-xs text-red-300">{errors.features.message}</p>}
      </div>

       <div className="grid gap-5 md:grid-cols-2 xl:grid-cols-3">
         <div className="min-w-0 space-y-2">
         <Controller name="project_stage" control={control} render={({ field }) => <BuildlogSelect id="project-stage" label="Development stage" value={field.value} onChange={field.onChange} options={stageOptions} errorId={errors.project_stage ? "project-stage-error" : undefined} />} />
         {errors.project_stage && <p id="project-stage-error" role="alert" className="text-xs text-red-300">{errors.project_stage.message}</p>}
         </div>

         {completed ? <div className="min-w-0 space-y-2">
           <label htmlFor="project-built" className="text-sm font-medium">Built (Optional)</label>
           <input id="project-built" {...register("year")} maxLength={20} className="w-full rounded-xl border border-border-hairline bg-surface-base px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-accent-signal" placeholder="Q2 2026 or 2025" />
         </div> : <div className="min-w-0 space-y-2">
          <label htmlFor="project-expected-completion" className="text-sm font-medium">Expected completion (Optional)</label>
          <input id="project-expected-completion" {...register("expected_completion_label")} maxLength={32} className="w-full rounded-xl border border-border-hairline bg-surface-base px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-accent-signal" placeholder="Q2 2027" />
          {errors.expected_completion_label && <p className="text-xs text-red-500">{errors.expected_completion_label.message}</p>}
        </div>}

         {completed && <div className="min-w-0 space-y-2"><label htmlFor="project-latest-update" className="text-sm font-medium">Latest project update (Optional)</label><input id="project-latest-update" {...register("latest_update_label")} maxLength={32} className="w-full rounded-xl border border-border-hairline bg-surface-base px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-accent-signal" placeholder="Q3 2026" /><p className="text-xs text-ink-secondary">Update this when the project itself changes.</p></div>}
       </div>

       <div className="grid gap-5 md:grid-cols-2">
         {/* Column 1: Project domain / type */}
         <div className="min-w-0 space-y-2">
           <label htmlFor="project-category" className="block text-sm font-medium text-ink-primary">
             Project domain / type
           </label>
           <Controller
             name="category"
             control={control}
             render={({ field }) => (
               <ProjectDomainSelect
                 id="project-category"
                 value={field.value}
                 onChange={field.onChange}
                 errorId={errors.category ? "project-category-error" : undefined}
               />
             )}
           />
           <p id="project-category-hint" className="text-xs text-ink-secondary">
             Select the primary domain. Directly controls the homepage Shipped domain counters (Web, Cybersecurity, AI).
           </p>
           {errors.category && <p id="project-category-error" role="alert" className="text-xs text-red-300">{errors.category.message}</p>}
         </div>

         {/* Column 2: Publication status */}
         <div className="min-w-0 space-y-2">
           <Controller name="status" control={control} render={({ field }) => <BuildlogSelect id="project-status" label="Publication status" value={field.value} onChange={field.onChange} options={statusOptions} />} />
           <p className="text-xs text-ink-secondary">
             Control whether this project is published publicly, kept as draft, or archived.
           </p>
         </div>
       </div>

       <div className="grid gap-4 lg:grid-cols-2">
         <ProjectPillEditor id="project-tech-stack" label="Tech stack" value={watch("tech_stack") || ""} draft={techDraft} onDraftChange={setTechDraft} onChange={(value) => setValue("tech_stack", value, { shouldDirty: true, shouldValidate: true })} separator={"\n"} hint="Shown in the case study and project card details." error={errors.tech_stack?.message} />
         <ProjectPillEditor id="project-tags" label="Tags" value={watch("tags") || ""} draft={tagDraft} onDraftChange={setTagDraft} onChange={(value) => setValue("tags", value, { shouldDirty: true, shouldValidate: true })} separator="," hint="Drive project filters and card chips; up to three show on each card." error={errors.tags?.message} />
       </div>

      <div className="grid gap-6 md:grid-cols-2">
        <div className="space-y-2">
          <label htmlFor="project-live-url" className="text-sm font-medium">Visit / live project URL (Optional)</label>
          <input
            id="project-live-url"
            {...register("live_url")}
            aria-invalid={Boolean(errors.live_url)}
            aria-describedby={errors.live_url ? "project-live-url-error" : undefined}
            className="w-full rounded-xl border border-border-hairline bg-surface-base px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-accent-signal"
            placeholder="https://..."
          />
          {errors.live_url && <p id="project-live-url-error" role="alert" className="text-xs text-red-300">{errors.live_url.message}</p>}
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
              className="flex min-h-11 items-center gap-1 text-xs text-accent-signal transition-colors hover:text-accent-signal/80 disabled:opacity-50"
            >
              {isGenerating ? <Loader2 className="w-3 h-3 animate-spin" /> : <Sparkles className="w-3 h-3" />}
              Generate from README
            </button>
          </div>
          <input
            id="project-source-url"
            {...register("github_url")}
            aria-invalid={Boolean(errors.github_url)}
            aria-describedby={errors.github_url ? "project-source-url-error" : undefined}
            className="w-full rounded-xl border border-border-hairline bg-surface-base px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-accent-signal"
            placeholder="https://github.com/your-name/project-repo"
          />
          <p className="text-xs text-ink-secondary">Link to this project&apos;s public repository, not your profile. Leave blank when the source is private.</p>
          {errors.github_url && <p id="project-source-url-error" role="alert" className="text-xs text-red-300">{errors.github_url.message}</p>}
        </div>
      </div>
      
      <div className="space-y-3">
        <h2 className="text-sm font-medium">Project images</h2>
        <p className="text-xs text-ink-secondary">Choose a cover and up to 20 gallery images. New files stay on this device until Save; existing library images are only linked to this project. A failed save attempts to remove newly uploaded assets.</p>
        {coverPreview && z.string().url().safeParse(coverPreview).success ? (
          <div className="relative isolate flex h-48 items-center justify-center overflow-hidden rounded-xl border border-border-hairline bg-neutral-100 dark:bg-white/[0.04]">
            {/* A direct preview supports manually entered image hosts outside Next's remote allowlist. */}
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={coverPreview} alt="" aria-hidden className="absolute inset-0 h-full w-full object-cover opacity-25 blur-xl" />
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={coverPreview} alt="Current project cover preview" className="relative z-10 h-full w-full object-contain" />
          </div>
        ) : <p className="rounded-xl border border-dashed border-border-hairline px-4 py-6 text-sm text-ink-secondary">No cover selected.</p>}
        <div className="flex flex-wrap gap-2">
          <label className="inline-flex min-h-11 cursor-pointer items-center gap-2 rounded-xl border border-border-hairline px-3 text-sm text-text-primary hover:bg-surface-base focus-within:outline focus-within:outline-2 focus-within:outline-current"><UploadCloud className="size-4" aria-hidden />Select images<input type="file" multiple disabled={isSubmitting} accept="image/jpeg,image/png,image/webp,image/gif,image/avif,image/heic,image/heif,image/tiff,image/bmp,image/x-icon" onChange={stageFiles} className="sr-only" /></label>
          <button type="button" onClick={() => { setMediaPickerTarget("cover"); setIsMediaPickerOpen(true); }} className="inline-flex min-h-11 items-center gap-2 rounded-xl border border-border-hairline px-3 text-sm text-text-primary hover:bg-surface-base"><ImageIcon className="size-4" aria-hidden />Choose from library</button>
          {coverUrl && !stagedCoverId && <button type="button" disabled={galleryImages.length === 0} onClick={() => { const [nextCover, ...remaining] = galleryImages; setValue("cover_image_url", nextCover.url, { shouldDirty: true, shouldValidate: true }); setValue("cover_image_id", nextCover.mediaId, { shouldDirty: true }); setValue("case_study_sections.cover_caption", nextCover.caption, { shouldDirty: true, shouldValidate: true }); setValue("case_study_sections.cover_alt", nextCover.altText, { shouldDirty: true }); setGalleryImages(remaining); }} className="inline-flex min-h-11 items-center gap-2 rounded-xl border border-border-hairline px-3 text-sm text-red-600 hover:bg-red-50 disabled:cursor-not-allowed disabled:opacity-50 dark:text-red-400 dark:hover:bg-red-950/30"><Trash2 className="size-4" aria-hidden />Remove cover</button>}
        </div>
        <p className="text-xs text-ink-secondary">Removing a saved cover promotes the next saved image. Nothing is sent to Cloudinary until Save.</p>
        {stagedCoverId ? <p className="text-xs text-ink-secondary">This cover is previewed locally. Its final URL is assigned on Save; edit its caption and description in the pending-image card below.</p> : <><label htmlFor="project-cover-url" className="block text-xs text-ink-secondary">Or enter a cover image URL</label><input id="project-cover-url" {...coverField} aria-invalid={Boolean(errors.cover_image_url)} aria-describedby={errors.cover_image_url ? "project-cover-url-error" : undefined} onChange={(event) => { coverField.onChange(event); setValue("cover_image_id", "", { shouldDirty: true }); setValue("case_study_sections.cover_caption", "", { shouldDirty: true }); setValue("case_study_sections.cover_alt", "", { shouldDirty: true }); }} className="w-full rounded-xl border border-border-hairline bg-surface-base px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-accent-signal" placeholder="https://..." /></>}
        <input type="hidden" {...register("cover_image_id")} />
        {errors.cover_image_url && <p id="project-cover-url-error" role="alert" className="text-xs text-red-300">{errors.cover_image_url.message}</p>}
        {!stagedCoverId && <><label htmlFor="project-cover-caption" className="block text-xs text-ink-secondary">Cover caption (optional, up to 200 characters / 30 words)</label><textarea id="project-cover-caption" {...register("case_study_sections.cover_caption")} rows={2} maxLength={200} className="w-full rounded-xl border border-border-hairline bg-surface-base px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-accent-signal" placeholder="Describe this image" /><p className={`text-xs ${captionWordCount(coverCaption) > 30 ? "text-red-600 dark:text-red-400" : "text-ink-secondary"}`}>{coverCaption.length} / 200 characters, {captionWordCount(coverCaption)} / 30 words</p>{errors.case_study_sections?.cover_caption && <p className="text-xs text-red-500">{errors.case_study_sections.cover_caption.message}</p>}<label htmlFor="project-cover-alt" className="block text-xs text-ink-secondary">Cover image description for screen readers (optional, up to 160 characters)</label><input id="project-cover-alt" {...register("case_study_sections.cover_alt")} maxLength={160} className="w-full rounded-xl border border-border-hairline bg-surface-base px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-accent-signal" placeholder="Describe what the cover image shows" />{errors.case_study_sections?.cover_alt && <p className="text-xs text-red-500">{errors.case_study_sections.cover_alt.message}</p>}</>}
      </div>

      <div className="space-y-3">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <h3 className="text-sm font-medium">More carousel images</h3>
          <button
            type="button"
            onClick={() => { setMediaPickerTarget("gallery"); setIsMediaPickerOpen(true); }}
            className="inline-flex min-h-11 items-center gap-2 rounded-xl border border-border-hairline bg-surface-base px-3 py-2 text-sm hover:bg-surface-raised"
          >
            <ImageIcon className="h-4 w-4" /> Add from Media Library
          </button>
        </div>
        <p className="text-xs text-ink-secondary">Captions are optional, up to 200 characters and 30 words.</p>
        {galleryImages.length === 0 && stagedImages.length === 0 && <p className="text-sm text-ink-secondary">No additional images yet.</p>}
        <div className="space-y-3">
          {galleryImages.map((image, index) => (
            <div key={image.mediaId} className="flex flex-col gap-3 rounded-xl border border-border-hairline bg-surface-base p-3 sm:flex-row sm:items-center">
              <Image src={image.url} alt={image.altText || image.caption || "Project gallery image"} width={128} height={96} className="h-24 w-full rounded-lg object-cover sm:w-32" />
              <div className="min-w-0 flex-1 space-y-1">
                <p className="break-all text-xs font-medium text-ink-primary">{image.fileName || image.url.split("/").pop()?.split("?")[0] || "Library image"}</p>
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
                 <button type="button" aria-label={`Move image ${index + 1} up`} disabled={index === 0} onClick={() => setGalleryImages((images) => { const next = [...images]; [next[index - 1], next[index]] = [next[index], next[index - 1]]; return next; })} className="flex size-11 items-center justify-center rounded-lg hover:bg-surface-raised focus-visible:outline focus-visible:outline-2 focus-visible:outline-current disabled:opacity-40"><ArrowUp className="h-4 w-4" aria-hidden /></button>
                 <button type="button" aria-label={`Move image ${index + 1} down`} disabled={index === galleryImages.length - 1} onClick={() => setGalleryImages((images) => { const next = [...images]; [next[index], next[index + 1]] = [next[index + 1], next[index]]; return next; })} className="flex size-11 items-center justify-center rounded-lg hover:bg-surface-raised focus-visible:outline focus-visible:outline-2 focus-visible:outline-current disabled:opacity-40"><ArrowDown className="h-4 w-4" aria-hidden /></button>
                 <button type="button" aria-label={`Remove image ${index + 1}`} onClick={() => setGalleryImages((images) => images.filter((item) => item.mediaId !== image.mediaId))} className="flex size-11 items-center justify-center rounded-lg text-red-400 hover:bg-surface-raised focus-visible:outline focus-visible:outline-2 focus-visible:outline-current"><Trash2 className="h-4 w-4" aria-hidden /></button>
              </div>
            </div>
          ))}
          {stagedImages.map((image, index) => <div key={image.id} className="flex min-w-0 flex-col gap-3 rounded-xl border border-border-hairline bg-surface-base p-3 sm:flex-row sm:items-center">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={image.url} alt={image.altText || image.file.name} className="h-24 w-full rounded-lg object-cover sm:w-32" />
            <div className="min-w-0 flex-1 space-y-2"><p className="break-all text-xs font-medium text-ink-primary">{image.file.name} <span className="text-ink-secondary">(pending Save)</span></p>
              <label htmlFor={`staged-caption-${image.id}`} className="block text-xs text-ink-secondary">Caption</label><textarea id={`staged-caption-${image.id}`} value={image.caption} rows={2} maxLength={200} onChange={(event) => setStagedImages((current) => current.map((item) => item.id === image.id ? { ...item, caption: event.target.value } : item))} className="w-full rounded-lg border border-border-hairline bg-surface-raised px-3 py-2 text-sm" />
              <label htmlFor={`staged-alt-${image.id}`} className="block text-xs text-ink-secondary">Image description for screen readers</label><input id={`staged-alt-${image.id}`} value={image.altText} maxLength={160} onChange={(event) => setStagedImages((current) => current.map((item) => item.id === image.id ? { ...item, altText: event.target.value } : item))} className="min-h-11 w-full rounded-lg border border-border-hairline bg-surface-raised px-3 text-sm" />
              <p className="text-xs text-ink-secondary">{image.caption.length} / 200 characters, {captionWordCount(image.caption)} / 30 words</p>
            </div>
            <div className="flex flex-wrap gap-2"><button type="button" aria-pressed={stagedCoverId === image.id} onClick={() => { if (getValues("cover_image_url") && !z.string().url().safeParse(getValues("cover_image_url")).success) { setValue("cover_image_url", "", { shouldDirty: true, shouldValidate: true }); setValue("cover_image_id", "", { shouldDirty: true }); } setStagedCoverId(image.id); }} className="min-h-11 rounded-lg border border-border-hairline px-3 text-xs text-ink-primary focus-visible:outline focus-visible:outline-2 focus-visible:outline-current">{stagedCoverId === image.id ? "Cover selected" : "Make cover"}</button><button type="button" aria-label={`Remove pending image ${index + 1}`} onClick={() => removeStaged(image.id)} className="inline-flex size-11 items-center justify-center rounded-lg text-red-300 hover:bg-surface-raised focus-visible:outline focus-visible:outline-2 focus-visible:outline-current"><Trash2 className="size-4" aria-hidden /></button></div>
          </div>)}
        </div>
      </div>

      <MediaPickerModal
        isOpen={isMediaPickerOpen}
        libraryOnly
        onClose={() => setIsMediaPickerOpen(false)}
          onSelect={(media) => {
            if (mediaPickerTarget === "cover") {
              const oldUrl = getValues("cover_image_url");
              const oldId = getValues("cover_image_id");
              const oldCaption = getValues("case_study_sections.cover_caption") || "";
              const oldAlt = getValues("case_study_sections.cover_alt") || "";
              if (oldId && oldId !== media.id && !galleryImages.some((image) => image.mediaId === oldId) && galleryImages.filter((image) => image.mediaId !== media.id).length >= 20) {
                setErrorMsg("Choose no more than 20 gallery images. Remove an image before replacing the cover.");
                return false;
              }
              setValue("cover_image_url", media.secure_url || media.url, { shouldDirty: true, shouldValidate: true });
              setValue("cover_image_id", media.id, { shouldDirty: true });
              setStagedCoverId(null);
              setValue("case_study_sections.cover_caption", "", { shouldDirty: true, shouldValidate: true });
              setValue("case_study_sections.cover_alt", "", { shouldDirty: true, shouldValidate: true });
              setGalleryImages((images) => {
                const remaining = images.filter((image) => image.mediaId !== media.id);
                return oldId && oldId !== media.id && !remaining.some((image) => image.mediaId === oldId)
                  ? [{ mediaId: oldId, url: oldUrl, caption: oldCaption, altText: oldAlt }, ...remaining]
                  : remaining;
              });
          } else {
            if (media.id === getValues("cover_image_id")) return false;
            if (galleryImages.length >= 20 && !galleryImages.some((image) => image.mediaId === media.id)) {
              setErrorMsg("Choose no more than 20 gallery images.");
              return false;
            }
               setGalleryImages((images) => images.some((image) => image.mediaId === media.id)
                  ? images
                  : [...images, { mediaId: media.id, url: media.secure_url || media.url, caption: "", altText: "", fileName: media.original_filename || media.alt_text || "" }]);
          }
          return true;
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

      <fieldset aria-describedby={errors.related_project_ids ? "project-related-error" : undefined} className="space-y-3 rounded-xl border border-border-hairline p-4">
        <legend className="px-1 text-sm font-medium">Related projects</legend>
        <p className="text-xs text-ink-secondary">Choose up to two published projects to show below this case study. They appear in the order selected. Leave empty to hide the section.</p>
        <p className="text-xs font-medium text-ink-secondary">Selected {selectedRelatedIds.length} / 2</p>
        {selectedRelatedIds.length > 0 && <ol className="space-y-1">
          {selectedRelatedIds.map((id, index) => {
            const chosen = availableProjects.find((item) => item.id === id);
            return <li key={id} className="flex items-center justify-between gap-3 rounded-lg bg-surface-base px-3 py-2 text-sm text-ink-primary">
              <span className="min-w-0 break-words">{index + 1}. {chosen?.title || "Project no longer available"}</span>
              <button type="button" onClick={() => setValue("related_project_ids", selectedRelatedIds.filter((value) => value !== id), { shouldDirty: true, shouldValidate: true })} className="min-h-11 shrink-0 text-xs text-ink-secondary underline underline-offset-2 hover:text-ink-primary">Remove</button>
            </li>;
          })}
        </ol>}
        <label htmlFor="related-project-search" className="sr-only">Search projects for related links</label>
        <input id="related-project-search" type="search" value={relatedSearch} onChange={(event) => setRelatedSearch(event.target.value)} placeholder="Search all projects..." className="w-full rounded-lg border border-border-hairline bg-surface-base px-3 py-2 text-sm text-ink-primary focus:outline-none focus:ring-2 focus:ring-accent-signal" />
        <div className="max-h-56 space-y-1 overflow-y-auto">
          {relatedOptions.map((item) => {
            const selected = selectedRelatedIds.includes(item.id);
            const disabled = !selected && (item.status !== "published" || selectedRelatedIds.length >= 2);
            return <label key={item.id} className={`flex min-h-11 items-center gap-3 rounded-lg border border-border-hairline px-3 py-2 text-sm ${disabled ? "cursor-not-allowed opacity-50" : "cursor-pointer hover:bg-surface-base"}`}>
              <input type="checkbox" checked={selected} disabled={disabled} onChange={() => setValue("related_project_ids", selected ? selectedRelatedIds.filter((id) => id !== item.id) : [...selectedRelatedIds, item.id], { shouldDirty: true, shouldValidate: true })} className="size-4 shrink-0 rounded border-border-hairline text-accent-signal focus:ring-accent-signal" />
              <span className="min-w-0 flex-1 break-words text-ink-primary">{item.title}</span>
              <span className="shrink-0 text-xs text-ink-secondary">{selected ? `#${selectedRelatedIds.indexOf(item.id) + 1}` : item.status}</span>
            </label>;
          })}
          {relatedOptions.length === 0 && <p className="px-3 py-4 text-sm text-ink-secondary">No matching projects.</p>}
        </div>
        {errors.related_project_ids && <p id="project-related-error" role="alert" className="text-xs text-red-300">{errors.related_project_ids.message}</p>}
      </fieldset>

      <div className="flex flex-wrap justify-end gap-4">
        <button
          type="button"
          onClick={() => { if (isSubmitting || isCleaningMedia) return; if (isDirty || galleryDirty || stagedImages.length || uploadedMedia.current.size || techDraft.trim() || tagDraft.trim()) setLeaveConfirmation(true); else router.push("/admin/projects"); }}
          className="min-h-11 rounded-xl px-4 py-2 text-sm font-medium text-ink-secondary hover:bg-surface-base transition-colors"
        >
          Cancel
        </button>
        <button
          type="submit"
          disabled={isSubmitting || isCleaningMedia}
          className="inline-flex items-center justify-center rounded-xl bg-accent-signal px-6 py-2 text-sm font-medium text-white shadow hover:bg-accent-signal/90 focus:outline-none disabled:opacity-50 transition-all"
        >
          {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
          Save Project
        </button>
      </div>
    </form>
    <AdminConfirmDialog open={saveConfirmation !== null} title={saveConfirmation?.title || "Confirm publication"} description={saveConfirmation?.description || ""} confirmLabel={saveConfirmation?.label || "Confirm"} pending={isSubmitting} onClose={() => setSaveConfirmation(null)} onConfirm={() => { const pending = saveConfirmation; setSaveConfirmation(null); if (pending) void saveProject(pending.data); }} />
    <AdminConfirmDialog open={leaveConfirmation} title="Discard unsaved project changes?" description="Unsaved changes and locally selected images will be discarded. Any files from a failed Save will be removed if unused." confirmLabel="Discard changes" destructive pending={isCleaningMedia || isSubmitting} onClose={() => setLeaveConfirmation(false)} onConfirm={() => { void (async () => { const cleaned = await discardSessionUploads(); setLeaveConfirmation(false); if (cleaned) router.push("/admin/projects"); })(); }} />
    <AdminConfirmDialog open={navigationTarget !== null} title="Discard unsaved project changes?" description="Unsaved changes and locally selected images will be discarded. Any files from a failed Save will be removed if unused." confirmLabel="Discard changes" destructive pending={isCleaningMedia || isSubmitting} onClose={() => setNavigationTarget(null)} onConfirm={() => { void (async () => { const cleaned = await discardSessionUploads(); if (cleaned) confirmLeave(router.push); else setNavigationTarget(null); })(); }} />
    </>
  );
}
