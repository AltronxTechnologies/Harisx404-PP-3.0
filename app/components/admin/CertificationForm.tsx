"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { Loader2 } from "lucide-react";

const optionalUrl = z.string().trim().refine((value) => {
  if (!value) return true;
  try {
    return new URL(value).protocol === "https:";
  } catch {
    return false;
  }
}, "Enter a valid HTTPS URL.");
const certificationSchema = z.object({
  title: z.string().trim().min(2, "Title is required.").max(140),
  issuer: z.string().trim().min(2, "Issuer is required.").max(120),
  description: z.string().trim().max(600).optional(),
  category: z.enum(["Web Development", "Cybersecurity", "AI / ML", "Cloud", "Other"]),
  issue_date: z.string().optional(),
  expiration_date: z.string().optional(),
  does_not_expire: z.boolean(),
  credential_id: z.string().trim().max(120).optional(),
  credential_url: optionalUrl,
  issuer_logo_url: optionalUrl,
  badge_image_url: optionalUrl,
  skills: z.string().max(800).optional(),
  is_demo: z.boolean(),
  display_order: z.coerce.number().int().min(0).max(10000),
  status: z.enum(["draft", "published", "archived"]),
}).superRefine((data, context) => {
  if (!data.does_not_expire && !data.expiration_date) {
    context.addIssue({ code: "custom", path: ["expiration_date"], message: "Expiration date is required." });
  }
});

type CertificationFormValues = z.infer<typeof certificationSchema>;
type InitialCertification = Partial<Omit<CertificationFormValues, "skills">> & {
  id?: string;
  skills?: string[] | string;
};

const inputClass =
  "w-full rounded-xl border border-border-hairline bg-surface-base px-3 py-2.5 text-sm text-ink-primary outline-none transition-colors focus:border-accent-signal focus:ring-2 focus:ring-accent-signal/20";

export function CertificationForm({ initialData }: { initialData?: InitialCertification }) {
  const router = useRouter();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState("");
  const initialSkills = Array.isArray(initialData?.skills)
    ? initialData.skills.join(", ")
    : initialData?.skills || "";
  const {
    register,
    handleSubmit,
    watch,
    formState: { errors },
  } = useForm<CertificationFormValues>({
    resolver: zodResolver(certificationSchema),
    defaultValues: {
      title: initialData?.title || "",
      issuer: initialData?.issuer || "",
      description: initialData?.description || "",
      category: initialData?.category || "Other",
      issue_date: initialData?.issue_date || "",
      expiration_date: initialData?.expiration_date || "",
      does_not_expire: initialData?.does_not_expire !== false,
      credential_id: initialData?.credential_id || "",
      credential_url: initialData?.credential_url || "",
      issuer_logo_url: initialData?.issuer_logo_url || "",
      badge_image_url: initialData?.badge_image_url || "",
      skills: initialSkills,
      is_demo: initialData?.is_demo === true,
      display_order: initialData?.display_order || 0,
      status: initialData?.status || "published",
    },
  });
  const doesNotExpire = watch("does_not_expire");

  const onSubmit = async (data: CertificationFormValues) => {
    setIsSubmitting(true);
    setErrorMsg("");
    try {
      const payload = {
        ...data,
        description: data.description || null,
        issue_date: data.issue_date || null,
        expiration_date: data.does_not_expire ? null : data.expiration_date || null,
        credential_id: data.credential_id || null,
        credential_url: data.credential_url || null,
        issuer_logo_url: data.issuer_logo_url || null,
        badge_image_url: data.badge_image_url || null,
        skills: (data.skills || "").split(",").map((skill) => skill.trim()).filter(Boolean),
      };
      const response = await fetch("/api/admin/certifications", {
        method: initialData?.id ? "PUT" : "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(initialData?.id ? { id: initialData.id, ...payload } : payload),
      });
      if (!response.ok) {
        const result = await response.json();
        throw new Error(result.error || "Failed to save certification.");
      }
      router.push("/admin/certifications");
      router.refresh();
    } catch (error) {
      setErrorMsg(error instanceof Error ? error.message : "Failed to save certification.");
    } finally {
      setIsSubmitting(false);
    }
  };

  const FieldError = ({ name }: { name: keyof CertificationFormValues }) =>
    errors[name] ? <p className="mt-1.5 text-xs text-red-500">{errors[name]?.message}</p> : null;

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-8">
      {errorMsg && <div role="alert" className="rounded-xl bg-red-50 p-4 text-sm text-red-600 dark:bg-red-950/30 dark:text-red-300">{errorMsg}</div>}

      <div className="grid gap-6 md:grid-cols-2">
        <label className="text-sm font-medium">Credential title
          <input {...register("title")} className={`mt-2 ${inputClass}`} placeholder="Security Operations Fundamentals" />
          <FieldError name="title" />
        </label>
        <label className="text-sm font-medium">Issuing organization
          <input {...register("issuer")} className={`mt-2 ${inputClass}`} placeholder="Cisco Networking Academy" />
          <FieldError name="issuer" />
        </label>
      </div>

      <label className="block text-sm font-medium">Description
        <textarea {...register("description")} rows={4} maxLength={600} className={`mt-2 resize-y ${inputClass}`} placeholder="What this credential validates and why it matters." />
        <FieldError name="description" />
      </label>

      <div className="grid gap-6 md:grid-cols-3">
        <label className="text-sm font-medium">Category
          <select {...register("category")} className={`mt-2 ${inputClass}`}>
            <option>Web Development</option><option>Cybersecurity</option><option>AI / ML</option><option>Cloud</option><option>Other</option>
          </select>
        </label>
        <label className="text-sm font-medium">Issue date
          <input type="date" {...register("issue_date")} className={`mt-2 ${inputClass}`} />
        </label>
        <label className="text-sm font-medium">Expiration date
          <input type="date" disabled={doesNotExpire} {...register("expiration_date")} className={`mt-2 disabled:cursor-not-allowed disabled:opacity-50 ${inputClass}`} />
          <FieldError name="expiration_date" />
        </label>
      </div>

      <label className="flex items-center gap-3 text-sm font-medium">
        <input type="checkbox" {...register("does_not_expire")} className="size-4 rounded border-border-hairline" />
        This credential does not expire
      </label>

      <div className="grid gap-6 md:grid-cols-2">
        <label className="text-sm font-medium">Credential ID
          <input {...register("credential_id")} className={`mt-2 ${inputClass}`} placeholder="CERT-2026-001" />
        </label>
        <label className="text-sm font-medium">Verification URL
          <input type="url" {...register("credential_url")} className={`mt-2 ${inputClass}`} placeholder="https://issuer.example/verify/..." />
          <FieldError name="credential_url" />
        </label>
      </div>

      <div className="grid gap-6 md:grid-cols-2">
        <label className="text-sm font-medium">Issuer logo URL
          <input type="url" {...register("issuer_logo_url")} className={`mt-2 ${inputClass}`} placeholder="https://.../issuer-logo.svg" />
          <FieldError name="issuer_logo_url" />
        </label>
        <label className="text-sm font-medium">Badge image URL
          <input type="url" {...register("badge_image_url")} className={`mt-2 ${inputClass}`} placeholder="https://.../credential-badge.png" />
          <FieldError name="badge_image_url" />
        </label>
      </div>

      <label className="block text-sm font-medium">Skills
        <input {...register("skills")} className={`mt-2 ${inputClass}`} placeholder="Network Security, Incident Response, Threat Analysis" />
        <p className="mt-1.5 text-xs text-ink-secondary">Separate skills with commas. Up to 12 skills are shown.</p>
      </label>

      <div className="grid gap-6 md:grid-cols-3">
        <label className="text-sm font-medium">Display order
          <input type="number" {...register("display_order")} className={`mt-2 ${inputClass}`} />
          <FieldError name="display_order" />
        </label>
        <label className="text-sm font-medium">Status
          <select {...register("status")} className={`mt-2 ${inputClass}`}><option value="draft">Draft</option><option value="published">Published</option><option value="archived">Archived</option></select>
        </label>
        <label className="flex items-center gap-3 self-end rounded-xl border border-border-hairline bg-surface-base px-3 py-2.5 text-sm font-medium">
          <input type="checkbox" {...register("is_demo")} className="size-4 rounded border-border-hairline" />
          Temporary demo record
        </label>
      </div>

      <div className="flex justify-end gap-3 border-t border-border-hairline pt-6">
        <button type="button" onClick={() => router.back()} className="rounded-xl px-4 py-2.5 text-sm font-medium text-ink-secondary transition-colors hover:bg-surface-base">Cancel</button>
        <button type="submit" disabled={isSubmitting} className="inline-flex min-w-40 items-center justify-center rounded-xl bg-accent-signal px-6 py-2.5 text-sm font-medium text-white shadow transition-opacity hover:opacity-90 disabled:cursor-wait disabled:opacity-50">
          {isSubmitting && <Loader2 className="mr-2 size-4 animate-spin" />}
          {initialData?.id ? "Update credential" : "Create credential"}
        </button>
      </div>
    </form>
  );
}
