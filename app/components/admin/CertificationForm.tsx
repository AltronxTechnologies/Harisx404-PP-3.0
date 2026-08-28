"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { Loader2 } from "lucide-react";

const certificationSchema = z.object({
  title: z.string().min(1, "Title is required"),
  issuer: z.string().optional().or(z.literal("")),
  issue_date: z.string().optional().or(z.literal("")),
  credential_url: z.string().optional().or(z.literal("")),
  display_order: z.coerce.number().int(),
  status: z.enum(["draft", "published", "archived"]),
});

type CertificationFormValues = z.infer<typeof certificationSchema>;

interface CertificationFormProps {
  initialData?: Partial<CertificationFormValues> & { id?: string };
}

export function CertificationForm({ initialData }: CertificationFormProps) {
  const router = useRouter();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState("");

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<CertificationFormValues>({
    resolver: zodResolver(certificationSchema),
    defaultValues: {
      title: initialData?.title ?? "",
      issuer: initialData?.issuer ?? "",
      issue_date: initialData?.issue_date ?? "",
      credential_url: initialData?.credential_url ?? "",
      display_order: initialData?.display_order ?? 0,
      status: (initialData?.status as CertificationFormValues["status"]) ?? "published",
    },
  });

  const onSubmit = async (data: CertificationFormValues) => {
    setIsSubmitting(true);
    setErrorMsg("");
    try {
      const payload = {
        title: data.title,
        issuer: data.issuer || null,
        issue_date: data.issue_date || null,
        credential_url: data.credential_url || null,
        display_order: data.display_order,
        status: data.status,
      };
      const res = await fetch("/api/admin/certifications", {
        method: initialData?.id ? "PUT" : "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(initialData?.id ? { id: initialData.id, ...payload } : payload),
      });

      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.error || "Failed to save certification");
      }

      router.push("/admin/certifications");
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

      <div className="grid gap-6 md:grid-cols-2">
        <div className="space-y-2">
          <label className="text-sm font-medium">Title</label>
          <input
            {...register("title")}
            className="w-full rounded-xl border border-border-hairline bg-surface-base px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-accent-signal"
            placeholder="Certified Ethical Hacking Fundamentals"
          />
          {errors.title && <p className="text-xs text-red-500">{errors.title.message}</p>}
        </div>

        <div className="space-y-2">
          <label className="text-sm font-medium">Issuer (Optional)</label>
          <input
            {...register("issuer")}
            className="w-full rounded-xl border border-border-hairline bg-surface-base px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-accent-signal"
            placeholder="Issuing organization"
          />
        </div>
      </div>

      <div className="grid gap-6 md:grid-cols-2">
        <div className="space-y-2">
          <label className="text-sm font-medium">Issue Date (Optional)</label>
          <input
            {...register("issue_date")}
            className="w-full rounded-xl border border-border-hairline bg-surface-base px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-accent-signal"
            placeholder="2024"
          />
        </div>

        <div className="space-y-2">
          <label className="text-sm font-medium">Credential URL (Optional)</label>
          <input
            {...register("credential_url")}
            className="w-full rounded-xl border border-border-hairline bg-surface-base px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-accent-signal"
            placeholder="https://example.com/credential/abc123"
          />
        </div>
      </div>

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
          Save Certification
        </button>
      </div>
    </form>
  );
}
