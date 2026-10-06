"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Controller, useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { MediaPickerModal } from "./MediaPickerModal";
import { Image as ImageIcon, Loader2 } from "lucide-react";
import { readAdminResponse } from "@/app/lib/admin/read-admin-response";
import { AdminConfirmDialog } from "./AdminConfirmDialog";
import { BuildlogSelect } from "./BuildlogSelect";
import { useAdminNavigationGuard } from "./useAdminNavigationGuard";

const statusOptions = [
  { value: "pending", label: "Pending review", hint: "Waiting for approval" },
  { value: "draft", label: "Draft", hint: "Only visible in Admin" },
  { value: "published", label: "Published", hint: "Visible on the homepage" },
  { value: "archived", label: "Archived", hint: "Hidden from visitors" },
] as const;
const secureUrl = z.string().trim().max(2048).refine((value) => {
  if (!value) return true;
  try { const url = new URL(value); return url.protocol === "https:" && !!url.hostname && !url.username && !url.password; }
  catch { return false; }
}, "Use a valid HTTPS image URL without credentials");

const testimonialSchema = z.object({
  // Length caps match the homepage card zones (headline ≤ 2 lines,
  // quote ≤ 6 lines) so approved content always fits perfectly.
  headline: z.string().trim().min(1, "Headline is required").max(70, "Max 70 characters (2 lines on the card)"),
  quote: z.string().trim().min(1, "Quote is required").max(280, "Max 280 characters (6 lines on the card)"),
  name: z.string().trim().min(1, "Name is required").max(80, "Max 80 characters"),
  role: z.string().trim().max(80, "Max 80 characters"),
  avatar_url: secureUrl,
  display_order: z.number({ invalid_type_error: "Enter a display order" }).int("Use a whole number"),
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
  const [confirmingLeave, setConfirmingLeave] = useState(false);
  const [pendingPublication, setPendingPublication] = useState<TestimonialFormValues | null>(null);

  const {
    register,
    control,
    handleSubmit,
    setValue,
    setError,
    formState: { errors, isDirty },
  } = useForm<TestimonialFormValues>({
    resolver: zodResolver(testimonialSchema),
    defaultValues: {
      headline: initialData?.headline ?? "",
      quote: initialData?.quote ?? "",
      name: initialData?.name ?? "",
      role: initialData?.role ?? "",
      avatar_url: initialData?.avatar_url ?? "",
      display_order: initialData?.display_order ?? 0,
      status: (initialData?.status as TestimonialFormValues["status"]) ?? "draft",
    },
  });
  const { leaveTarget, setLeaveTarget, confirmLeave } = useAdminNavigationGuard(isDirty);
  useEffect(() => {
    if (!isDirty) return;
    const warn = (event: BeforeUnloadEvent) => { event.preventDefault(); event.returnValue = ""; };
    window.addEventListener("beforeunload", warn);
    return () => window.removeEventListener("beforeunload", warn);
  }, [isDirty]);

  const save = async (data: TestimonialFormValues) => {
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

      const result = await readAdminResponse(res, "Testimonial");
      if (!res.ok) {
        if (result.fields) {
          for (const [name, messages] of Object.entries(result.fields)) {
            if (name in testimonialSchema.shape && Array.isArray(messages) && typeof messages[0] === "string") setError(name as keyof TestimonialFormValues, { message: messages[0] });
          }
        }
        throw new Error(result.error || "Failed to save testimonial");
      }

      if (!result.data?.id) throw new Error("Testimonial save could not be confirmed. Refresh the list before retrying.");
      router.push(result.warning ? "/admin/testimonials?notice=saved&cache=stale" : "/admin/testimonials?notice=saved");
      router.refresh();
    } catch (err) {
      setErrorMsg(err instanceof Error ? err.message : "Failed to save testimonial");
    } finally {
      setIsSubmitting(false);
    }
  };

  const onSubmit = (data: TestimonialFormValues) => {
    if (data.status !== initialData?.status && (data.status === "published" || initialData?.status === "published")) {
      setPendingPublication(data);
      return;
    }
    void save(data);
  };
  const errorProps = (name: keyof TestimonialFormValues) => ({ "aria-invalid": Boolean(errors[name]), "aria-describedby": errors[name] ? `testimonial-${name}-error` : undefined });
  const FieldError = ({ name }: { name: keyof TestimonialFormValues }) => errors[name] ? <p id={`testimonial-${name}-error`} role="alert" className="text-xs text-red-300">{errors[name]?.message}</p> : null;

  return (
    <><form onSubmit={handleSubmit(onSubmit)} className="min-w-0 space-y-8">
      {errorMsg && (
        <div role="alert" className="rounded-lg bg-red-50 p-4 text-sm text-red-500 dark:bg-red-950/30">
          {errorMsg}
        </div>
      )}
      <fieldset disabled={isSubmitting} className="min-w-0 space-y-8 border-0 p-0 disabled:opacity-70">

      <div className="space-y-2">
        <label htmlFor="testimonial-headline" className="text-sm font-medium">Headline</label>
        <input
          id="testimonial-headline"
          {...register("headline")}
          {...errorProps("headline")}
          className="min-h-11 w-full rounded-xl border border-border-hairline bg-surface-base px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-accent-signal"
          placeholder="He shipped in weeks what we scoped for months."
        />
        <FieldError name="headline" />
      </div>

      <div className="space-y-2">
        <label htmlFor="testimonial-quote" className="text-sm font-medium">Quote</label>
        <textarea
          id="testimonial-quote"
          {...register("quote")}
          {...errorProps("quote")}
          rows={4}
          className="min-h-11 w-full rounded-xl border border-border-hairline bg-surface-base px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-accent-signal"
          placeholder="The full testimonial quote..."
        />
        <FieldError name="quote" />
      </div>

      <div className="grid gap-6 md:grid-cols-2">
        <div className="space-y-2">
          <label htmlFor="testimonial-name" className="text-sm font-medium">Name</label>
          <input
            id="testimonial-name"
            {...register("name")}
            {...errorProps("name")}
            className="min-h-11 w-full rounded-xl border border-border-hairline bg-surface-base px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-accent-signal"
            placeholder="Jane Doe"
          />
          <FieldError name="name" />
        </div>

        <div className="space-y-2">
          <label htmlFor="testimonial-role" className="text-sm font-medium">Role (Optional)</label>
          <input
            id="testimonial-role"
            {...register("role")}
            {...errorProps("role")}
            className="min-h-11 w-full rounded-xl border border-border-hairline bg-surface-base px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-accent-signal"
            placeholder="Founder, SaaS Startup"
          />
          <FieldError name="role" />
        </div>
      </div>

      <div className="space-y-2">
        <label htmlFor="testimonial-avatar-url" className="text-sm font-medium">Avatar URL (Optional)</label>
        <div className="flex gap-2">
          <input
            id="testimonial-avatar-url"
            {...register("avatar_url")}
            {...errorProps("avatar_url")}
            className="min-h-11 min-w-0 flex-1 rounded-xl border border-border-hairline bg-surface-base px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-accent-signal"
            placeholder="https://..."
          />
          <button
            type="button"
            onClick={() => setIsMediaPickerOpen(true)}
            aria-label="Choose avatar from Media Library"
            className="inline-flex size-11 shrink-0 items-center justify-center rounded-xl border border-border-hairline bg-surface-base text-ink-secondary hover:text-accent-signal hover:bg-surface-raised focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-current"
            title="Choose from Media Library"
          >
            <ImageIcon className="h-5 w-5" />
          </button>
        </div>
        <FieldError name="avatar_url" />
      </div>

      <MediaPickerModal
        isOpen={isMediaPickerOpen}
        onClose={() => setIsMediaPickerOpen(false)}
        onSelect={(media) => {
          setValue("avatar_url", media.secure_url || media.url, { shouldDirty: true, shouldValidate: true });
        }}
      />

      <div className="grid gap-6 md:grid-cols-2">
        <div className="space-y-2">
          <label htmlFor="testimonial-display-order" className="text-sm font-medium">Display Order</label>
          <input
            id="testimonial-display-order"
            type="number"
            {...register("display_order", { setValueAs: (value: string) => value === "" ? NaN : Number(value) })}
            {...errorProps("display_order")}
            className="min-h-11 w-full rounded-xl border border-border-hairline bg-surface-base px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-accent-signal"
          />
          <FieldError name="display_order" />
        </div>

        <div className="min-w-0"><Controller name="status" control={control} render={({ field }) => <BuildlogSelect id="testimonial-status" label="Visibility" value={field.value} onChange={field.onChange} options={statusOptions} />} /></div>
      </div>

      </fieldset>
      <div className="flex flex-wrap justify-end gap-4">
        <button
          type="button"
          onClick={() => isDirty ? setConfirmingLeave(true) : router.push("/admin/testimonials")}
          className="min-h-11 rounded-xl px-4 py-2 text-sm font-medium text-ink-secondary hover:bg-surface-base transition-colors"
        >
          Cancel
        </button>
        <button
          type="submit"
          disabled={isSubmitting}
          className="inline-flex min-h-11 items-center justify-center rounded-xl bg-accent-signal px-6 py-2 text-sm font-medium text-white shadow hover:bg-accent-signal/90 focus:outline-none disabled:opacity-50 transition-all"
        >
          {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
          Save Testimonial
        </button>
      </div>
    </form>
    <AdminConfirmDialog open={confirmingLeave} title="Discard unsaved testimonial changes?" description="Your text, image, order and visibility edits will be lost." confirmLabel="Discard changes" destructive onClose={() => setConfirmingLeave(false)} onConfirm={() => { setConfirmingLeave(false); router.push("/admin/testimonials"); }} />
    <AdminConfirmDialog open={leaveTarget !== null} title="Discard unsaved testimonial changes?" description="Your text, image, order and visibility edits will be lost." confirmLabel="Discard changes" destructive onClose={() => setLeaveTarget(null)} onConfirm={() => confirmLeave(router.push)} />
    <AdminConfirmDialog open={pendingPublication !== null} title={pendingPublication?.status === "published" ? "Publish testimonial?" : "Hide testimonial?"} description={pendingPublication?.status === "published" ? "This testimonial will appear in the public homepage carousel." : "This testimonial will leave the public homepage carousel but remain editable in Admin."} confirmLabel={pendingPublication?.status === "published" ? "Publish testimonial" : "Hide testimonial"} pending={isSubmitting} onClose={() => setPendingPublication(null)} onConfirm={() => { if (pendingPublication) { const values = pendingPublication; setPendingPublication(null); void save(values); } }} />
    </>
  );
}
