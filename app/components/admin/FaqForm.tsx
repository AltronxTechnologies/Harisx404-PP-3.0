"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { Loader2 } from "lucide-react";
import { readAdminResponse } from "@/app/lib/admin/read-admin-response";
import { AdminConfirmDialog } from "./AdminConfirmDialog";
import { useAdminNavigationGuard } from "./useAdminNavigationGuard";

const faqSchema = z.object({
  question: z.string().trim().min(1, "Question is required").max(200, "Max 200 characters"),
  answer: z.string().trim().min(1, "Answer is required").max(1000, "Max 1000 characters"),
  display_order: z.number({ invalid_type_error: "Enter a display order" }).int("Use a whole number"),
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
  const [confirmingLeave, setConfirmingLeave] = useState(false);

  const {
    register,
    handleSubmit,
    formState: { errors, isDirty },
  } = useForm<FaqFormValues>({
    resolver: zodResolver(faqSchema),
    defaultValues: {
      question: initialData?.question ?? "",
      answer: initialData?.answer ?? "",
      display_order: initialData?.display_order ?? 0,
      is_visible: initialData?.is_visible ?? true,
    },
  });
  const { leaveTarget, setLeaveTarget, confirmLeave } = useAdminNavigationGuard(isDirty);

  useEffect(() => {
    if (!isDirty) return;
    const warn = (event: BeforeUnloadEvent) => { event.preventDefault(); event.returnValue = ""; };
    window.addEventListener("beforeunload", warn);
    return () => window.removeEventListener("beforeunload", warn);
  }, [isDirty]);

  const onSubmit = async (data: FaqFormValues) => {
    setIsSubmitting(true);
    setErrorMsg("");
    try {
      const res = await fetch("/api/admin/faqs", {
        method: initialData?.id ? "PUT" : "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(initialData?.id ? { id: initialData.id, ...data } : data),
      });

      const result = await readAdminResponse(res, "FAQ");
      if (!res.ok) throw new Error(result.error || "Failed to save FAQ");

      if (!result.data?.id) throw new Error("FAQ save could not be confirmed. Refresh the list before retrying.");
      router.push(result.warning ? "/admin/faqs?notice=saved&cache=stale" : "/admin/faqs?notice=saved");
      router.refresh();
    } catch (err) {
      setErrorMsg(err instanceof Error ? err.message : "Failed to save FAQ");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <><form onSubmit={handleSubmit(onSubmit)} className="min-w-0 space-y-8">
      {errorMsg && (
        <div role="alert" className="rounded-lg bg-red-50 p-4 text-sm text-red-700 dark:bg-red-950/30 dark:text-red-400">
          {errorMsg}
        </div>
      )}

      <div className="space-y-2">
        <label htmlFor="faq-question" className="text-sm font-medium">Question</label>
        <input
          id="faq-question"
          {...register("question")}
          aria-invalid={!!errors.question}
          aria-describedby={errors.question ? "faq-question-error" : undefined}
          className="min-h-11 w-full rounded-xl border border-border-hairline bg-surface-base px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-accent-signal"
          placeholder="What kind of work are you available for?"
        />
        {errors.question && <p id="faq-question-error" className="text-xs text-red-700 dark:text-red-400">{errors.question.message}</p>}
      </div>

      <div className="space-y-2">
        <label htmlFor="faq-answer" className="text-sm font-medium">Answer</label>
        <textarea
          id="faq-answer"
          {...register("answer")}
          aria-invalid={!!errors.answer}
          aria-describedby={errors.answer ? "faq-answer-error" : undefined}
          rows={5}
          className="min-h-11 w-full rounded-xl border border-border-hairline bg-surface-base px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-accent-signal"
          placeholder="The answer shown when the question is expanded. Line breaks are preserved on the homepage."
        />
        {errors.answer && <p id="faq-answer-error" className="text-xs text-red-700 dark:text-red-400">{errors.answer.message}</p>}
      </div>

      <div className="grid gap-6 md:grid-cols-2">
        <div className="space-y-2">
          <label htmlFor="faq-order" className="text-sm font-medium">Display order</label>
          <input
            id="faq-order"
            type="number"
            {...register("display_order", { setValueAs: (value: string) => value === "" ? NaN : Number(value) })}
            aria-invalid={!!errors.display_order}
            aria-describedby={errors.display_order ? "faq-order-error" : undefined}
            className="min-h-11 w-full rounded-xl border border-border-hairline bg-surface-base px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-accent-signal"
          />
          <p className="text-xs text-ink-secondary">Lower numbers appear first.</p>
          {errors.display_order && (
            <p id="faq-order-error" className="text-xs text-red-700 dark:text-red-400">{errors.display_order.message}</p>
          )}
        </div>

        <div className="space-y-2">
          <p className="text-sm font-medium">Visibility</p>
          <label className="flex min-h-11 cursor-pointer items-center gap-3 rounded-xl border border-border-hairline bg-surface-base px-3 py-2">
            <input type="checkbox" {...register("is_visible")} className="h-4 w-4 accent-indigo-600" />
            <span className="text-sm">Show this question on the homepage</span>
          </label>
        </div>
      </div>

      <div className="flex items-center gap-3">
        <button
          type="submit"
          disabled={isSubmitting}
          className="inline-flex min-h-11 items-center justify-center rounded-xl bg-accent-signal px-4 py-2 text-sm font-medium text-white shadow hover:bg-accent-signal/90 transition-all disabled:opacity-50"
        >
          {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
          {initialData?.id ? "Save changes" : "Create FAQ"}
        </button>
        <button
          type="button"
          onClick={() => isDirty ? setConfirmingLeave(true) : router.push("/admin/faqs")}
          className="min-h-11 rounded-xl border border-border-hairline bg-surface-base px-4 py-2 text-sm text-ink-secondary hover:text-ink-primary transition-colors"
        >
          Cancel
        </button>
      </div>
    </form>
    <AdminConfirmDialog open={confirmingLeave} title="Discard unsaved FAQ changes?" description="Your question, answer, display order and visibility edits will be lost." confirmLabel="Discard changes" destructive onClose={() => setConfirmingLeave(false)} onConfirm={() => { setConfirmingLeave(false); router.push("/admin/faqs"); }} />
    <AdminConfirmDialog open={leaveTarget !== null} title="Discard unsaved FAQ changes?" description="Your question, answer, display order and visibility edits will be lost." confirmLabel="Discard changes" destructive onClose={() => setLeaveTarget(null)} onConfirm={() => confirmLeave(router.push)} />
    </>
  );
}
