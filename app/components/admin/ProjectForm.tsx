"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useForm, Controller } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { TiptapEditor } from "./TiptapEditor";
import { MediaPickerModal } from "./MediaPickerModal";
import { Image as ImageIcon, Loader2, Sparkles, Code } from "lucide-react";

const projectSchema = z.object({
  title: z.string().min(1, "Title is required"),
  slug: z.string().min(1, "Slug is required"),
  description: z.string().optional(),
  tagline: z.string().optional().or(z.literal("")),
  category: z.enum(["Web App", "Mobile App", "Other"]).optional(),
  year: z.string().optional().or(z.literal("")),
  tech_stack: z.string().optional().or(z.literal("")),
  tags: z.string().optional().or(z.literal("")),
  features: z.string().optional().or(z.literal("")),
  content: z.string().optional(),
  status: z.enum(["draft", "published", "archived"]),
  cover_image_url: z.string().url("Must be a valid URL").optional().or(z.literal("")),
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
  };
}

export function ProjectForm({ initialData }: ProjectFormProps) {
  const router = useRouter();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState("");
  const [isMediaPickerOpen, setIsMediaPickerOpen] = useState(false);
  const [isGenerating, setIsGenerating] = useState(false);

  const {
    register,
    handleSubmit,
    control,
    setValue,
    getValues,
    formState: { errors },
  } = useForm<ProjectFormValues>({
    resolver: zodResolver(projectSchema),
    defaultValues: {
      title: initialData?.title ?? "",
      slug: initialData?.slug ?? "",
      description: initialData?.description ?? "",
      tagline: initialData?.tagline ?? "",
      category: (initialData?.category as ProjectFormValues["category"]) ?? "Web App",
      year: initialData?.year ?? "",
      tech_stack: Array.isArray(initialData?.tech_stack)
        ? initialData.tech_stack.join(", ")
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
      live_url: initialData?.live_url ?? "",
      github_url: initialData?.github_url ?? "",
      start_date: initialData?.start_date ?? "",
      end_date: initialData?.end_date ?? "",
      featured: initialData?.featured ?? false,
    },
  });

  const onSubmit = async (data: ProjectFormValues) => {
    setIsSubmitting(true);
    setErrorMsg("");
    try {
      const payload = {
        ...data,
        tech_stack: (data.tech_stack || "")
          .split(",")
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
        <label className="text-sm font-medium">Tagline (Optional)</label>
        <input
          {...register("tagline")}
          className="w-full rounded-xl border border-border-hairline bg-surface-base px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-accent-signal"
          placeholder="A one-line hook for the project card..."
        />
      </div>

      <div className="grid gap-6 md:grid-cols-3">
        <div className="space-y-2">
          <label className="text-sm font-medium">Category</label>
          <select
            {...register("category")}
            className="w-full rounded-xl border border-border-hairline bg-surface-base px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-accent-signal"
          >
            <option value="Web App">Web App</option>
            <option value="Mobile App">Mobile App</option>
            <option value="Other">Other</option>
          </select>
        </div>

        <div className="space-y-2">
          <label className="text-sm font-medium">Year (Optional)</label>
          <input
            {...register("year")}
            className="w-full rounded-xl border border-border-hairline bg-surface-base px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-accent-signal"
            placeholder="2025"
          />
        </div>

        <div className="space-y-2">
          <label className="text-sm font-medium">Tech Stack (comma-separated)</label>
          <input
            {...register("tech_stack")}
            className="w-full rounded-xl border border-border-hairline bg-surface-base px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-accent-signal"
            placeholder="Next.js, TypeScript, Supabase"
          />
        </div>
      </div>

      <div className="space-y-2">
        <label className="text-sm font-medium">Tags (comma-separated)</label>
        <input
          {...register("tags")}
          className="w-full rounded-xl border border-border-hairline bg-surface-base px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-accent-signal"
          placeholder="cybersecurity, machine-learning, saas"
        />
        <p className="text-xs text-ink-secondary">
          Used for filtering and for the Web / Cyber / AI split on the homepage stats bar.
        </p>
      </div>

      <div className="space-y-2">
        <label className="text-sm font-medium">Features (one per line)</label>
        <textarea
          {...register("features")}
          rows={4}
          className="w-full rounded-xl border border-border-hairline bg-surface-base px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-accent-signal"
          placeholder={"Realtime dashboard with live charts\nRole-based access control"}
        />
      </div>

      <div className="grid gap-6 md:grid-cols-3">
        <div className="space-y-2">
          <label className="text-sm font-medium">Status</label>
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
          <label className="text-sm font-medium">Live URL (Optional)</label>
          <input
            {...register("live_url")}
            className="w-full rounded-xl border border-border-hairline bg-surface-base px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-accent-signal"
            placeholder="https://..."
          />
          {errors.live_url && <p className="text-xs text-red-500">{errors.live_url.message}</p>}
        </div>

        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <label className="text-sm font-medium">GitHub URL (Optional)</label>
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
            {...register("github_url")}
            className="w-full rounded-xl border border-border-hairline bg-surface-base px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-accent-signal"
            placeholder="https://github.com/..."
          />
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

      <div className="space-y-2">
        <label className="text-sm font-medium">Cover Image URL (Optional)</label>
        <div className="flex gap-2">
          <input
            {...register("cover_image_url")}
            className="flex-1 rounded-xl border border-border-hairline bg-surface-base px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-accent-signal"
            placeholder="https://..."
          />
          <button
            type="button"
            onClick={() => setIsMediaPickerOpen(true)}
            className="rounded-xl border border-border-hairline bg-surface-base p-2 text-ink-secondary hover:text-accent-signal hover:bg-surface-raised transition-colors"
            title="Choose from Media Library"
          >
            <ImageIcon className="h-5 w-5" />
          </button>
        </div>
      </div>

      <MediaPickerModal
        isOpen={isMediaPickerOpen}
        onClose={() => setIsMediaPickerOpen(false)}
        onSelect={(media) => {
          setValue("cover_image_url", media.secure_url || media.url, { shouldValidate: true });
        }}
      />

      <div className="space-y-2">
        <label className="text-sm font-medium">Content / Case Study (HTML)</label>
        <Controller
          name="content"
          control={control}
          render={({ field }) => (
            <div className="rounded-xl overflow-hidden border border-border-hairline bg-surface-base">
              <TiptapEditor
                value={field.value || ""}
                onChange={(html) => field.onChange(html)}
              />
            </div>
          )}
        />
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
