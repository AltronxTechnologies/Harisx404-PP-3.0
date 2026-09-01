"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { Loader2 } from "lucide-react";

const faqSchema = z.object({
  question: z.string().min(1, "Question is required").max(200, "Max 200 characters"),
  answer: z.string().min(1, "Answer is required").max(1000, "Max 1000 characters"),
  display_order: z.coerce.number().int(),
  is_visible: z.boolean(),
});

type FaqFormValues = z.infer<typeof faqSchema>;

interface FaqFormProps {
  initialData?: Partial<FaqFormValues> & { id?: string };
}

export function FaqForm({ initialData }: FaqFormProps) {
  const router = useRouter();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState("");

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<FaqFormValues>({
    resolver: zodResolver(faqSchema),
    defaultValues: {
      question: initialData?.question ?? "",
      answer: initialData?.answer ?? "",
      display_order: initialData?.display_order ?? 0,
      is_visible: initialData?.is_visible ?? true,
    },
  });

  const onSubmit = async (data: FaqFormValues) => {
    setIsSubmitting(true);
    setErrorMsg("");
    try {
      const res = await fetch("/api/admin/faqs", {
        method: initialData?.id ? "PUT" : "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(initialData?.id ? { id: initialData.id, ...data } : data),
      });

      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.error || "Failed to save FAQ");
      }

      router.push("/admin/faqs");
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
        <label className="text-sm font-medium">Question</label>
        <input
          {...register("question")}
          className="w-full rounded-xl border border-border-hairline bg-surface-base px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-accent-signal"
          placeholder="What kind of work are you available for?"
        />
        {errors.question && <p className="text-xs text-red-500">{errors.question.message}</p>}
      </div>

      <div className="space-y-2">
        <label className="text-sm font-medium">Answer</label>
        <textarea
          {...register("answer")}
          rows={5}
          className="w-full rounded-xl border border-border-hairline bg-surface-base px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-accent-signal"
          placeholder="The answer shown when the question is expanded. Line breaks are preserved on the homepage."
        />
        {errors.answer && <p className="text-xs text-red-500">{errors.answer.message}</p>}
      </div>

      <div className="grid gap-6 md:grid-cols-2">
        <div className="space-y-2">
          <label className="text-sm font-medium">Display order</label>
          <input
            type="number"
            {...register("display_order")}
            className="w-full rounded-xl border border-border-hairline bg-surface-base px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-accent-signal"
          />
          <p className="text-xs text-ink-secondary">Lower numbers appear first.</p>
          {errors.display_order && (
            <p className="text-xs text-red-500">{errors.display_order.message}</p>
          )}
        </div>

        <div className="space-y-2">
          <label className="text-sm font-medium">Visibility</label>
          <label className="flex cursor-pointer items-center gap-3 rounded-xl border border-border-hairline bg-surface-base px-3 py-2">
            <input type="checkbox" {...register("is_visible")} className="h-4 w-4 accent-indigo-600" />
            <span className="text-sm">Show this question on the homepage</span>
          </label>
        </div>
      </div>

      <div className="flex items-center gap-3">
        <button
          type="submit"
          disabled={isSubmitting}
          className="inline-flex items-center justify-center rounded-xl bg-accent-signal px-4 py-2 text-sm font-medium text-white shadow hover:bg-accent-signal/90 transition-all disabled:opacity-50"
        >
          {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
          {initialData?.id ? "Save changes" : "Create FAQ"}
        </button>
        <button
          type="button"
          onClick={() => router.push("/admin/faqs")}
          className="rounded-xl border border-border-hairline bg-surface-base px-4 py-2 text-sm text-ink-secondary hover:text-ink-primary transition-colors"
        >
          Cancel
        </button>
      </div>
    </form>
  );
}
