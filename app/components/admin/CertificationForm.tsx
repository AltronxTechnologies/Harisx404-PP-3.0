"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Controller, useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { Loader2 } from "lucide-react";
import { AdminConfirmDialog } from "./AdminConfirmDialog";
import { BuildlogSelect } from "./BuildlogSelect";
import { readAdminResponse } from "@/app/lib/admin/read-admin-response";

const optionalUrl = z.string().trim().max(2048).refine((value) => {
  if (!value) return true;
  try {
    const url = new URL(value);
    return url.protocol === "https:" && !!url.hostname && !url.username && !url.password;
  } catch {
    return false;
  }
}, "Enter a valid HTTPS URL.");
const validDate = (value: string) => {
  if (!value || !/^\d{4}-\d{2}-\d{2}$/.test(value)) return !value;
  try { return new Date(`${value}T00:00:00Z`).toISOString().slice(0, 10) === value; }
  catch { return false; }
};
const visibilityOptions = [
  { value: "draft", label: "Draft", hint: "Only visible in Admin" },
  { value: "published", label: "Published", hint: "Visible on public Credentials" },
  { value: "archived", label: "Archived", hint: "Hidden from visitors, retained in Admin" },
] as const;
const categoryOptions = ["Web Development", "Cybersecurity", "AI / ML", "Cloud", "Other"].map((value) => ({ value, label: value })) as { value: "Web Development" | "Cybersecurity" | "AI / ML" | "Cloud" | "Other"; label: string }[];
const certificationSchema = z.object({
  title: z.string().trim().min(2, "Title is required.").max(140),
  issuer: z.string().trim().min(2, "Issuer is required.").max(120),
  description: z.string().trim().max(600).optional(),
  category: z.enum(["Web Development", "Cybersecurity", "AI / ML", "Cloud", "Other"]),
  issue_date: z.string().refine(validDate, "Use a valid issue date").optional(),
  expiration_date: z.string().refine(validDate, "Use a valid expiration date").optional(),
  does_not_expire: z.boolean(),
  credential_id: z.string().trim().max(120).optional(),
  credential_url: optionalUrl,
  issuer_logo_url: optionalUrl,
  badge_image_url: optionalUrl,
  skills: z.string().max(800).optional(),
  is_demo: z.boolean(),
  display_order: z.number({ invalid_type_error: "Enter a display order" }).int().min(0).max(10000),
  status: z.enum(["draft", "published", "archived"]),
}).superRefine((data, context) => {
  if (!data.does_not_expire && !data.expiration_date) {
    context.addIssue({ code: "custom", path: ["expiration_date"], message: "Expiration date is required." });
  }
  if (!data.does_not_expire && data.issue_date && data.expiration_date && data.expiration_date < data.issue_date) {
    context.addIssue({ code: "custom", path: ["expiration_date"], message: "Expiration cannot precede the issue date." });
  }
  const skills = [...new Set((data.skills || "").split(",").map((value) => value.trim()).filter(Boolean))];
  if (skills.length > 12 || skills.some((skill) => skill.length > 60)) {
    context.addIssue({ code: "custom", path: ["skills"], message: "Use up to 12 skills, each under 60 characters." });
  }
});

type CertificationFormValues = z.infer<typeof certificationSchema>;
type InitialCertification = Partial<Omit<CertificationFormValues, "skills">> & {
  id?: string;
  skills?: string[] | string;
};

const inputClass =
  "min-h-11 w-full rounded-xl border border-border-hairline bg-surface-base px-3 py-2.5 text-sm text-ink-primary outline-none transition-colors focus:border-accent-signal focus:ring-2 focus:ring-accent-signal/20";

export function CertificationForm({ initialData }: { initialData?: InitialCertification }) {
  const router = useRouter();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState("");
  const [confirmingLeave, setConfirmingLeave] = useState(false);
  const [pendingPublication, setPendingPublication] = useState<CertificationFormValues | null>(null);
  const initialSkills = Array.isArray(initialData?.skills)
    ? initialData.skills.join(", ")
    : initialData?.skills || "";
  const {
    register,
    control,
    handleSubmit,
    watch,
    formState: { errors, isDirty },
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

  useEffect(() => {
    if (!isDirty) return;
    const warn = (event: BeforeUnloadEvent) => { event.preventDefault(); event.returnValue = ""; };
    window.addEventListener("beforeunload", warn);
    return () => window.removeEventListener("beforeunload", warn);
  }, [isDirty]);

  const save = async (data: CertificationFormValues) => {
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
        skills: [...new Set((data.skills || "").split(",").map((skill) => skill.trim()).filter(Boolean))],
      };
      const response = await fetch("/api/admin/certifications", {
        method: initialData?.id ? "PUT" : "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(initialData?.id ? { id: initialData.id, ...payload } : payload),
      });
      const result = await readAdminResponse(response, "Certification");
      if (!response.ok) throw new Error(result.error || "Failed to save certification.");
      router.push(result.warning ? "/admin/certifications?notice=saved&cache=stale" : "/admin/certifications?notice=saved");
      router.refresh();
    } catch (error) {
      setErrorMsg(error instanceof Error ? error.message : "Failed to save certification.");
    } finally {
      setIsSubmitting(false);
    }
  };

  const onSubmit = (data: CertificationFormValues) => {
    if (data.status !== initialData?.status && (data.status === "published" || initialData?.status === "published")) {
      setPendingPublication(data);
      return;
    }
    void save(data);
  };

  const FieldError = ({ name }: { name: keyof CertificationFormValues }) =>
    errors[name] ? <p id={`${name}-error`} role="alert" className="mt-1.5 text-xs text-red-500">{errors[name]?.message}</p> : null;
  const errorProps = (name: keyof CertificationFormValues) => ({
    "aria-invalid": Boolean(errors[name]),
    "aria-describedby": errors[name] ? `${name}-error` : undefined,
  });

  return (
    <><form onSubmit={handleSubmit(onSubmit)} className="min-w-0 space-y-8">
      {errorMsg && <div role="alert" className="rounded-xl bg-red-50 p-4 text-sm text-red-600 dark:bg-red-950/30 dark:text-red-300">{errorMsg}</div>}
      <fieldset disabled={isSubmitting} className="min-w-0 space-y-8 border-0 p-0 disabled:opacity-70">

      <div className="grid gap-6 md:grid-cols-2">
        <label className="text-sm font-medium">Credential title
          <input {...register("title")} {...errorProps("title")} className={`mt-2 ${inputClass}`} placeholder="Security Operations Fundamentals" />
          <FieldError name="title" />
        </label>
        <label className="text-sm font-medium">Issuing organization
          <input {...register("issuer")} {...errorProps("issuer")} className={`mt-2 ${inputClass}`} placeholder="Cisco Networking Academy" />
          <FieldError name="issuer" />
        </label>
      </div>

      <label className="block text-sm font-medium">Description
        <textarea {...register("description")} {...errorProps("description")} rows={4} maxLength={600} className={`mt-2 resize-y ${inputClass}`} placeholder="What this credential validates and why it matters." />
        <FieldError name="description" />
      </label>

      <div className="grid gap-6 md:grid-cols-3">
        <div className="min-w-0"><Controller name="category" control={control} render={({ field }) => <BuildlogSelect id="certification-category" label="Category" value={field.value} onChange={field.onChange} options={categoryOptions} />} /></div>
        <label className="text-sm font-medium">Issue date
          <input type="date" {...register("issue_date")} className={`mt-2 ${inputClass}`} />
        </label>
        <label className="text-sm font-medium">Expiration date
          <input type="date" disabled={doesNotExpire} {...register("expiration_date")} {...errorProps("expiration_date")} className={`mt-2 disabled:cursor-not-allowed disabled:opacity-50 ${inputClass}`} />
          <FieldError name="expiration_date" />
        </label>
      </div>

        <label className="flex min-h-11 items-center gap-3 text-sm font-medium">
        <input type="checkbox" {...register("does_not_expire")} className="size-4 rounded border-border-hairline" />
        This credential does not expire
      </label>

      <div className="grid gap-6 md:grid-cols-2">
        <label className="text-sm font-medium">Credential ID
          <input {...register("credential_id")} className={`mt-2 ${inputClass}`} placeholder="CERT-2026-001" />
        </label>
        <label className="text-sm font-medium">Verification URL
          <input type="url" {...register("credential_url")} {...errorProps("credential_url")} className={`mt-2 ${inputClass}`} placeholder="https://issuer.example/verify/..." />
          <FieldError name="credential_url" />
        </label>
      </div>

      <div className="grid gap-6 md:grid-cols-2">
        <label className="text-sm font-medium">Issuer logo URL
          <input type="url" {...register("issuer_logo_url")} {...errorProps("issuer_logo_url")} className={`mt-2 ${inputClass}`} placeholder="https://.../issuer-logo.svg" />
          <FieldError name="issuer_logo_url" />
        </label>
        <label className="text-sm font-medium">Badge image URL
          <input type="url" {...register("badge_image_url")} {...errorProps("badge_image_url")} className={`mt-2 ${inputClass}`} placeholder="https://.../credential-badge.png" />
          <FieldError name="badge_image_url" />
        </label>
      </div>

      <label className="block text-sm font-medium">Skills
        <input {...register("skills")} {...errorProps("skills")} className={`mt-2 ${inputClass}`} placeholder="Network Security, Incident Response, Threat Analysis" />
        <p className="mt-1.5 text-xs text-ink-secondary">Separate skills with commas. Stored as administrative metadata; not displayed on the compact public cards.</p>
        <FieldError name="skills" />
      </label>

      <div className="grid gap-6 md:grid-cols-3">
        <label className="text-sm font-medium">Display order
          <input type="number" {...register("display_order", { setValueAs: (value: string) => value === "" ? NaN : Number(value) })} {...errorProps("display_order")} className={`mt-2 ${inputClass}`} />
          <FieldError name="display_order" />
        </label>
        <div className="min-w-0"><Controller name="status" control={control} render={({ field }) => <BuildlogSelect id="certification-status" label="Visibility" value={field.value} onChange={field.onChange} options={visibilityOptions} />} /></div>
        <label className="flex min-h-11 items-center gap-3 self-end rounded-xl border border-border-hairline bg-surface-base px-3 py-2.5 text-sm font-medium">
          <input type="checkbox" {...register("is_demo")} className="size-4 rounded border-border-hairline" />
          Temporary demo record
        </label>
      </div>

      </fieldset>
      <div className="flex flex-wrap justify-end gap-3 border-t border-border-hairline pt-6">
        <button type="button" onClick={() => isDirty ? setConfirmingLeave(true) : router.push("/admin/certifications")} className="min-h-11 rounded-xl px-4 py-2.5 text-sm font-medium text-ink-secondary transition-colors hover:bg-surface-base">Cancel</button>
        <button type="submit" disabled={isSubmitting} className="inline-flex min-h-11 min-w-40 items-center justify-center rounded-xl bg-accent-signal px-6 py-2.5 text-sm font-medium text-white shadow transition-opacity hover:opacity-90 disabled:cursor-wait disabled:opacity-50">
          {isSubmitting && <Loader2 className="mr-2 size-4 animate-spin" />}
          {initialData?.id ? "Update credential" : "Create credential"}
        </button>
      </div>
    </form>
    <AdminConfirmDialog open={confirmingLeave} title="Discard unsaved certification changes?" description="Your credential details and visibility edits will be lost." confirmLabel="Discard changes" destructive onClose={() => setConfirmingLeave(false)} onConfirm={() => { setConfirmingLeave(false); router.push("/admin/certifications"); }} />
    <AdminConfirmDialog open={pendingPublication !== null} title={pendingPublication?.status === "published" ? "Publish certification?" : "Hide certification?"} description={pendingPublication?.status === "published" ? "This credential will become visible on the public Credentials page." : "This credential will leave the public Credentials page but remain editable in Admin."} confirmLabel={pendingPublication?.status === "published" ? "Publish credential" : "Hide credential"} pending={isSubmitting} onClose={() => setPendingPublication(null)} onConfirm={() => { if (pendingPublication) { const values = pendingPublication; setPendingPublication(null); void save(values); } }} />
    </>
  );
}
