"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { MediaPickerModal } from "./MediaPickerModal";
import { Image as ImageIcon, Loader2 } from "lucide-react";

const testimonialSchema = z.object({
  // Length caps match the homepage card zones (headline ≤ 2 lines,
  // quote ≤ 6 lines) so approved content always fits perfectly.
  headline: z.string().min(1, "Headline is required").max(70, "Max 70 characters (2 lines on the card)"),
  quote: z.string().min(1, "Quote is required").max(280, "Max 280 characters (6 lines on the card)"),
  name: z.string().min(1, "Name is required").max(80, "Max 80 characters"),
  role: z.string().max(80, "Max 80 characters").optional().or(z.literal("")),
  avatar_url: z.string().url("Must be a valid URL").optional().or(z.literal("")),
  display_order: z.coerce.number().int(),
  status: z.enum(["pending", "draft", "published", "archived"]),
});

type TestimonialFormValues = z.infer<typeof testimonialSchema>;

interface TestimonialFormProps {
  initialData?: Partial<TestimonialFormValues> & { id?: string };
}

export function TestimonialForm({ initialData }: TestimonialFormProps) {
  const router = useRouter();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState("");
  const [isMediaPickerOpen, setIsMediaPickerOpen] = useState(false);

  const {
    register,
    handleSubmit,
    setValue,
    formState: { errors },
  } = useForm<TestimonialFormValues>({
    resolver: zodResolver(testimonialSchema),
    defaultValues: {
      headline: initialData?.headline ?? "",
      quote: initialData?.quote ?? "",
      name: initialData?.name ?? "",
      role: initialData?.role ?? "",
      avatar_url: initialData?.avatar_url ?? "",
      display_order: initialData?.display_order ?? 0,
      status: (initialData?.status as TestimonialFormValues["status"]) ?? "published",
    },
  });

  const onSubmit = async (data: TestimonialFormValues) => {
    setIsSubmitting(true);
    setErrorMsg("");
    try {
      const payload = {
        ...data,
        role: data.role || null,
        avatar_url: data.avatar_url || null,
      };
      const res = await fetch("/api/admin/testimonials", {
        method: initialData?.id ? "PUT" : "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(initialData?.id ? { id: initialData.id, ...payload } : payload),
      });

      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.error || "Failed to save testimonial");
      }

      router.push("/admin/testimonials");
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
        <div className="rounded-lg bg-red-50 p-4 text-sm text-red-500 dark:bg-red-950/30">
          {errorMsg}
        </div>
      )}

      <div className="space-y-2">
        <label className="text-sm font-medium">Headline</label>
        <input
          {...register("headline")}
          className="w-full rounded-xl border border-border-hairline bg-surface-base px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-accent-signal"
          placeholder="He shipped in weeks what we scoped for months."
        />
        {errors.headline && <p className="text-xs text-red-500">{errors.headline.message}</p>}
      </div>

      <div className="space-y-2">
        <label className="text-sm font-medium">Quote</label>
        <textarea
          {...register("quote")}
          rows={4}
          className="w-full rounded-xl border border-border-hairline bg-surface-base px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-accent-signal"
          placeholder="The full testimonial quote..."
        />
        {errors.quote && <p className="text-xs text-red-500">{errors.quote.message}</p>}
      </div>

      <div className="grid gap-6 md:grid-cols-2">
        <div className="space-y-2">
          <label className="text-sm font-medium">Name</label>
          <input
            {...register("name")}
            className="w-full rounded-xl border border-border-hairline bg-surface-base px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-accent-signal"
            placeholder="Jane Doe"
          />
          {errors.name && <p className="text-xs text-red-500">{errors.name.message}</p>}
        </div>

        <div className="space-y-2">
          <label className="text-sm font-medium">Role (Optional)</label>
          <input
            {...register("role")}
            className="w-full rounded-xl border border-border-hairline bg-surface-base px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-accent-signal"
            placeholder="Founder, SaaS Startup"
          />
        </div>
      </div>

      <div className="space-y-2">
        <label className="text-sm font-medium">Avatar URL (Optional)</label>
        <div className="flex gap-2">
          <input
            {...register("avatar_url")}
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
        {errors.avatar_url && <p className="text-xs text-red-500">{errors.avatar_url.message}</p>}
      </div>

      <MediaPickerModal
        isOpen={isMediaPickerOpen}
        onClose={() => setIsMediaPickerOpen(false)}
        onSelect={(media) => {
          setValue("avatar_url", media.secure_url || media.url, { shouldValidate: true });
        }}
      />

      <div className="grid gap-6 md:grid-cols-2">
        <div className="space-y-2">
          <label className="text-sm font-medium">Display Order</label>
          <input
            type="number"
            {...register("display_order")}
            className="w-full rounded-xl border border-border-hairline bg-surface-base px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-accent-signal"
          />
          {errors.display_order && <p className="text-xs text-red-500">{errors.display_order.message}</p>}
        </div>

        <div className="space-y-2">
          <label className="text-sm font-medium">Status</label>
          <select
            {...register("status")}
            className="w-full rounded-xl border border-border-hairline bg-surface-base px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-accent-signal"
          >
            <option value="pending">Pending review</option>
            <option value="draft">Draft</option>
            <option value="published">Published</option>
            <option value="archived">Archived</option>
          </select>
        </div>
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
          Save Testimonial
        </button>
      </div>
    </form>
  );
}
