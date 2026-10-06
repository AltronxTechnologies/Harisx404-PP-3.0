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

const MONTHS = [
  "January",
  "February",
  "March",
  "April",
  "May",
  "June",
  "July",
  "August",
  "September",
  "October",
  "November",
  "December",
];

const LOCATION_TYPES = ["On-site", "Hybrid", "Remote"] as const;

const EMPLOYMENT_TYPES = [
  "Full-time",
  "Part-time",
  "Self-employed",
  "Freelance",
  "Contract",
  "Internship",
  "Apprenticeship",
  "Seasonal",
  "Open source",
] as const;

const visibilityOptions = [
  { value: "draft", label: "Draft", hint: "Only visible in Admin" },
  { value: "published", label: "Published", hint: "Visible on public About" },
  { value: "archived", label: "Archived", hint: "Hidden from visitors, retained in Admin" },
] as const;

const year = z.string().refine((value) => /^\d{4}$/.test(value) && Number(value) >= 1900 && Number(value) <= 2100, "Enter a year from 1900 to 2100");
function validLogoUrl(value: string) {
  if (!value) return true;
  if (value.startsWith("/") && !value.startsWith("//") && !value.split("/").includes("..")) return true;
  try {
    const url = new URL(value);
    return url.protocol === "https:" && !!url.hostname && !url.username && !url.password;
  } catch { return false; }
}

// Only job title, organization, and start year are required — everything
// else is optional and the public page hides whatever is left blank.
const experienceSchema = z.object({
  role: z.string().trim().min(1, "Job title is required").max(160),
  company: z.string().trim().min(1, "Organization is required").max(160),
  logo_url: z.string().trim(),
  location: z.string().trim().max(160),
  location_type: z.union([z.enum(LOCATION_TYPES), z.literal("")]),
  employment_type: z.union([z.enum(EMPLOYMENT_TYPES), z.literal("")]),
  start_month: z.string(),
  start_year: year,
  is_current: z.boolean(),
  end_month: z.string(),
  end_year: z.union([year, z.literal("")]),
  summary: z.string().trim().max(1000),
  highlights: z.string().optional().or(z.literal("")),
  display_order: z.number({ invalid_type_error: "Enter a display order" }).int("Use a whole number"),
  status: z.enum(["draft", "published", "archived"]),
}).superRefine((value, context) => {
  if (!value.is_current && value.end_month && !value.end_year) context.addIssue({ code: "custom", path: ["end_year"], message: "Select an end year when an end month is set" });
  if (!value.is_current && value.end_year && (Number(value.end_year) < Number(value.start_year) || (value.end_year === value.start_year && value.start_month && value.end_month && Number(value.end_month) < Number(value.start_month)))) context.addIssue({ code: "custom", path: ["end_year"], message: "End date cannot precede the start date" });
  const items = parseHighlights(value.highlights || "");
  if (items.length > 20 || items.some((item) => item.lead.length > 80 || item.text.length > 500)) context.addIssue({ code: "custom", path: ["highlights"], message: "Use up to 20 highlights, each no longer than 500 characters" });
});

type ExperienceFormValues = z.infer<typeof experienceSchema>;

interface ExperienceFormProps {
  initialData?: {
    id?: string;
    role?: string | null;
    company?: string | null;
    logo_url?: string | null;
    location?: string | null;
    location_type?: string | null;
    employment_type?: string | null;
    start_month?: number | null;
    start_year?: number | null;
    end_month?: number | null;
    end_year?: number | null;
    is_current?: boolean | null;
    summary?: string | null;
    highlights?: { lead?: string; text?: string }[] | null;
    bullets?: string[] | string | null;
    display_order?: number | null;
    status?: string | null;
  };
}

function highlightsToText(initialData?: ExperienceFormProps["initialData"]): string {
  if (Array.isArray(initialData?.highlights) && initialData.highlights.length > 0) {
    return initialData.highlights
      .map((h) => (h.lead ? `${h.lead} ${h.text ?? ""}`.trim() : h.text ?? ""))
      .filter(Boolean)
      .join("\n");
  }
  if (Array.isArray(initialData?.bullets)) return initialData.bullets.join("\n");
  return typeof initialData?.bullets === "string" ? initialData.bullets : "";
}

/** "Bold lead: rest of sentence" per line → [{ lead, text }] */
function parseHighlights(raw: string): { lead: string; text: string }[] {
  return raw
    .split("\n")
    .map((line) => line.trim())
    .filter(Boolean)
    .map((line) => {
      const colon = line.indexOf(":");
      if (colon > 0 && colon < 60) {
        return {
          lead: line.slice(0, colon + 1),
          text: line.slice(colon + 1).trim(),
        };
      }
      return { lead: "", text: line };
    });
}

export function ExperienceForm({ initialData }: ExperienceFormProps) {
  const router = useRouter();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState("");
  const [confirmingLeave, setConfirmingLeave] = useState(false);
  const [pendingPublication, setPendingPublication] = useState<ExperienceFormValues | null>(null);
  const formSchema = experienceSchema.superRefine((value, context) => {
    if (value.logo_url !== initialData?.logo_url && (value.logo_url.length > 2048 || !validLogoUrl(value.logo_url))) {
      context.addIssue({ code: "custom", path: ["logo_url"], message: "Use an HTTPS URL or a site-relative image path under 2048 characters" });
    }
  });

  const {
    register,
    control,
    handleSubmit,
    watch,
    formState: { errors, isDirty },
  } = useForm<ExperienceFormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      role: initialData?.role ?? "",
      company: initialData?.company ?? "",
      logo_url: initialData?.logo_url ?? "",
      location: initialData?.location ?? "",
      location_type: (initialData?.location_type as ExperienceFormValues["location_type"]) ?? "",
      employment_type: (initialData?.employment_type as ExperienceFormValues["employment_type"]) ?? "",
      start_month: initialData?.start_month ? String(initialData.start_month) : "",
      start_year: initialData?.start_year ? String(initialData.start_year) : "",
      is_current: initialData?.is_current ?? false,
      end_month: initialData?.end_month ? String(initialData.end_month) : "",
      end_year: initialData?.end_year ? String(initialData.end_year) : "",
      summary: initialData?.summary ?? "",
      highlights: highlightsToText(initialData),
      display_order: initialData?.display_order ?? 0,
      status: (initialData?.status as ExperienceFormValues["status"]) ?? "published",
    },
  });

  const isCurrent = watch("is_current");

  useEffect(() => {
    if (!isDirty) return;
    const warn = (event: BeforeUnloadEvent) => { event.preventDefault(); event.returnValue = ""; };
    window.addEventListener("beforeunload", warn);
    return () => window.removeEventListener("beforeunload", warn);
  }, [isDirty]);

  const save = async (data: ExperienceFormValues) => {
    setIsSubmitting(true);
    setErrorMsg("");
    try {
      const payload = {
        role: data.role,
        company: data.company,
        ...((!validLogoUrl(data.logo_url) || data.logo_url.length > 2048) && data.logo_url === initialData?.logo_url ? {} : { logo_url: data.logo_url || null }),
        location: data.location || null,
        location_type: data.location_type || null,
        employment_type: data.employment_type || null,
        start_month: data.start_month ? parseInt(data.start_month) : null,
        start_year: data.start_year ? parseInt(data.start_year) : null,
        end_month: data.is_current || !data.end_month ? null : parseInt(data.end_month),
        end_year: data.is_current || !data.end_year ? null : parseInt(data.end_year),
        is_current: data.is_current,
        summary: data.summary || null,
        highlights: parseHighlights(data.highlights || ""),
        display_order: data.display_order,
        status: data.status,
      };
      const res = await fetch("/api/admin/experience", {
        method: initialData?.id ? "PUT" : "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(
          initialData?.id ? { id: initialData.id, ...payload } : payload,
        ),
      });

      const result = await readAdminResponse(res, "Experience");
      if (!res.ok) throw new Error(result.error || "Failed to save experience entry");

      router.push(result.warning ? "/admin/experience?notice=saved&cache=stale" : "/admin/experience?notice=saved");
      router.refresh();
    } catch (err) {
      setErrorMsg(err instanceof Error ? err.message : "Failed to save experience entry");
    } finally {
      setIsSubmitting(false);
    }
  };

  const onSubmit = (data: ExperienceFormValues) => {
    if (data.status !== initialData?.status && (data.status === "published" || initialData?.status === "published")) {
      setPendingPublication(data);
      return;
    }
    void save(data);
  };

  const inputCls =
    "min-h-11 w-full rounded-xl border border-border-hairline bg-surface-base px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-accent-signal";

  return (
    <><form onSubmit={handleSubmit(onSubmit)} className="min-w-0 space-y-8">
      {errorMsg && (
        <div role="alert" className="rounded-lg bg-red-50 p-4 text-sm text-red-700 dark:bg-red-950/30 dark:text-red-300">
          {errorMsg}
        </div>
      )}
      <fieldset disabled={isSubmitting} className="min-w-0 space-y-8 border-0 p-0 disabled:opacity-70">

      <div className="grid gap-6 md:grid-cols-2">
        <div className="space-y-2">
          <label htmlFor="experience-role" className="text-sm font-medium">Job title *</label>
          <input id="experience-role" {...register("role")} aria-invalid={Boolean(errors.role)} aria-describedby={errors.role ? "experience-role-error" : undefined} className={inputCls} placeholder="Full-Stack Engineer" />
          {errors.role && <p id="experience-role-error" role="alert" className="text-xs text-red-300">{errors.role.message}</p>}
        </div>

        <div className="space-y-2">
          <label htmlFor="experience-company" className="text-sm font-medium">Organization *</label>
          <input id="experience-company" {...register("company")} aria-invalid={Boolean(errors.company)} aria-describedby={errors.company ? "experience-company-error" : undefined} className={inputCls} placeholder="CodeAlpha" />
          {errors.company && <p id="experience-company-error" role="alert" className="text-xs text-red-300">{errors.company.message}</p>}
        </div>
      </div>

      <div className="space-y-2">
        <label htmlFor="experience-logo-url" className="text-sm font-medium">Organization logo URL (optional)</label>
        <input
          id="experience-logo-url"
          {...register("logo_url")}
          className={inputCls}
          placeholder="https://... or /images/logos/codealpha.png"
        />
        {errors.logo_url && <p role="alert" className="text-xs text-red-300">{errors.logo_url.message}</p>}
        <p className="text-xs text-ink-secondary">
          Square image works best; shown at 32×32 beside the organization name.
        </p>
      </div>

      <div className="grid gap-6 md:grid-cols-3">
        <div className="space-y-2">
          <label htmlFor="experience-location" className="text-sm font-medium">Location</label>
          <input id="experience-location" {...register("location")} className={inputCls} placeholder="Pakistan" />
        </div>

        <div className="space-y-2">
          <label htmlFor="experience-location-type" className="text-sm font-medium">Location type</label>
          <select id="experience-location-type" {...register("location_type")} className={inputCls}>
            <option value="">Please select (optional)</option>
            {LOCATION_TYPES.map((t) => (
              <option key={t} value={t}>
                {t}
              </option>
            ))}
          </select>
        </div>

        <div className="space-y-2">
          <label htmlFor="experience-employment-type" className="text-sm font-medium">Employment type</label>
          <select id="experience-employment-type" {...register("employment_type")} className={inputCls}>
            <option value="">Please select (optional)</option>
            {EMPLOYMENT_TYPES.map((t) => (
              <option key={t} value={t}>
                {t}
              </option>
            ))}
          </select>
        </div>
      </div>

      <div className="space-y-4">
        <label className="flex min-h-11 items-center gap-2 text-sm font-medium">
          <input
            type="checkbox"
            {...register("is_current")}
            className="h-4 w-4 rounded border-border-hairline accent-accent-signal"
          />
          I currently work here
        </label>

        <div className="grid gap-6 md:grid-cols-4">
          <div className="space-y-2">
            <label htmlFor="experience-start-month" className="text-sm font-medium">Start month</label>
            <select id="experience-start-month" {...register("start_month")} className={inputCls}>
              <option value="">Month</option>
              {MONTHS.map((m, i) => (
                <option key={m} value={i + 1}>
                  {m}
                </option>
              ))}
            </select>
          </div>

          <div className="space-y-2">
            <label htmlFor="experience-start-year" className="text-sm font-medium">Start year *</label>
            <input
              id="experience-start-year"
              {...register("start_year")}
              aria-invalid={Boolean(errors.start_year)}
              aria-describedby={errors.start_year ? "experience-start-year-error" : undefined}
              className={inputCls}
              placeholder="2026"
              inputMode="numeric"
            />
            {errors.start_year && (
              <p id="experience-start-year-error" role="alert" className="text-xs text-red-300">{errors.start_year.message}</p>
            )}
          </div>

          <div className="space-y-2">
            <label htmlFor="experience-end-month" className="text-sm font-medium">End month</label>
            <select id="experience-end-month" {...register("end_month")} className={inputCls} disabled={isCurrent}>
              <option value="">Month</option>
              {MONTHS.map((m, i) => (
                <option key={m} value={i + 1}>
                  {m}
                </option>
              ))}
            </select>
          </div>

          <div className="space-y-2">
            <label htmlFor="experience-end-year" className="text-sm font-medium">End year (optional)</label>
            <input
              id="experience-end-year"
              {...register("end_year")}
              aria-invalid={Boolean(errors.end_year)}
              aria-describedby={errors.end_year ? "experience-end-year-error" : undefined}
              className={inputCls}
              placeholder="2026"
              inputMode="numeric"
              disabled={isCurrent}
            />
            {errors.end_year && (
              <p id="experience-end-year-error" role="alert" className="text-xs text-red-300">{errors.end_year.message}</p>
            )}
          </div>
        </div>
        <p className="text-xs text-ink-secondary">
          Leave months empty to show years only (e.g. &quot;2024 — Present&quot;). With
          months set, the duration is computed automatically (e.g. &quot;Jun 2026 — Jul
          2026 · 2 mos&quot;).
        </p>
      </div>

      <div className="space-y-2">
        <label htmlFor="experience-summary" className="text-sm font-medium">Summary (optional)</label>
        <textarea
          id="experience-summary"
          {...register("summary")}
          rows={2}
          className={inputCls}
          placeholder="One or two lines describing the role, shown above the highlights."
        />
      </div>

      <div className="space-y-2">
        <label htmlFor="experience-highlights" className="text-sm font-medium">Highlights (one per line)</label>
        <textarea
          id="experience-highlights"
          {...register("highlights")}
          rows={6}
          className={inputCls}
          placeholder={
            "SIEM & Log Analysis: Used Wazuh SIEM to aggregate logs and correlate security events.\nNetwork Segmentation: Designed virtual network separation in Cisco Packet Tracer."
          }
        />
        <p className="text-xs text-ink-secondary">
          Text before the first &quot;:&quot; becomes the bold lead-in. Links are supported
          with [label](https://url) or [label](/projects/slug).
        </p>
        {errors.highlights && <p role="alert" className="text-xs text-red-300">{errors.highlights.message}</p>}
      </div>

      <div className="grid gap-6 md:grid-cols-2">
        <div className="space-y-2">
          <label htmlFor="experience-display-order" className="text-sm font-medium">Display Order</label>
          <input id="experience-display-order" type="number" {...register("display_order", { setValueAs: (value: string) => value === "" ? NaN : Number(value) })} aria-invalid={Boolean(errors.display_order)} aria-describedby={errors.display_order ? "experience-order-error" : undefined} className={inputCls} />
          {errors.display_order && (
            <p id="experience-order-error" role="alert" className="text-xs text-red-300">{errors.display_order.message}</p>
          )}
        </div>

        <div className="space-y-2">
          <Controller name="status" control={control} render={({ field }) => <BuildlogSelect id="experience-status" label="Visibility" value={field.value} onChange={field.onChange} options={visibilityOptions} />} />
        </div>
      </div>

      </fieldset>
      <div className="flex flex-wrap justify-end gap-3">
        <button
          type="button"
          onClick={() => isDirty ? setConfirmingLeave(true) : router.push("/admin/experience")}
          className="min-h-11 rounded-xl px-4 py-2 text-sm font-medium text-ink-secondary hover:bg-surface-base transition-colors"
        >
          Cancel
        </button>
        <button
          type="submit"
          disabled={isSubmitting}
          className="inline-flex min-h-11 items-center justify-center rounded-xl bg-accent-signal px-6 py-2 text-sm font-medium text-white shadow hover:bg-accent-signal/90 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-white disabled:opacity-50"
        >
          {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
          Save Experience
        </button>
      </div>
    </form>
    <AdminConfirmDialog open={confirmingLeave} title="Discard unsaved Experience changes?" description="Your role, dates, highlights and visibility edits will be lost." confirmLabel="Discard changes" destructive onClose={() => setConfirmingLeave(false)} onConfirm={() => { setConfirmingLeave(false); router.push("/admin/experience"); }} />
    <AdminConfirmDialog open={pendingPublication !== null} title={pendingPublication?.status === "published" ? "Publish experience entry?" : "Hide experience entry?"} description={pendingPublication?.status === "published" ? "This role will become visible on the public About timeline." : "This role will leave the public About timeline but remain editable in Admin."} confirmLabel={pendingPublication?.status === "published" ? "Publish entry" : "Hide entry"} pending={isSubmitting} onClose={() => setPendingPublication(null)} onConfirm={() => { if (pendingPublication) { const values = pendingPublication; setPendingPublication(null); void save(values); } }} />
    </>
  );
}
