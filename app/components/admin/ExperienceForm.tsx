"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { Loader2 } from "lucide-react";

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

// Only job title, organization, and start year are required — everything
// else is optional and the public page hides whatever is left blank.
const experienceSchema = z.object({
  role: z.string().min(1, "Job title is required"),
  company: z.string().min(1, "Organization is required"),
  logo_url: z.string().optional().or(z.literal("")),
  location: z.string().optional().or(z.literal("")),
  location_type: z.string(),
  employment_type: z.string(),
  start_month: z.string(),
  start_year: z.string().min(4, "Start year is required"),
  is_current: z.boolean(),
  end_month: z.string(),
  end_year: z.string(),
  summary: z.string().optional().or(z.literal("")),
  highlights: z.string().optional().or(z.literal("")),
  display_order: z.coerce.number().int(),
  status: z.enum(["draft", "published", "archived"]),
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

  const {
    register,
    handleSubmit,
    watch,
    formState: { errors },
  } = useForm<ExperienceFormValues>({
    resolver: zodResolver(experienceSchema),
    defaultValues: {
      role: initialData?.role ?? "",
      company: initialData?.company ?? "",
      logo_url: initialData?.logo_url ?? "",
      location: initialData?.location ?? "",
      location_type: initialData?.location_type ?? "",
      employment_type: initialData?.employment_type ?? "",
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

  const onSubmit = async (data: ExperienceFormValues) => {
    setIsSubmitting(true);
    setErrorMsg("");
    try {
      const payload = {
        role: data.role,
        company: data.company,
        logo_url: data.logo_url || null,
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

      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.error || "Failed to save experience entry");
      }

      router.push("/admin/experience");
      router.refresh();
    } catch (err: any) {
      setErrorMsg(err.message);
    } finally {
      setIsSubmitting(false);
    }
  };

  const inputCls =
    "w-full rounded-xl border border-border-hairline bg-surface-base px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-accent-signal";

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-8">
      {errorMsg && (
        <div className="rounded-lg bg-red-50 p-4 text-sm text-red-500 dark:bg-red-950/30">
          {errorMsg}
        </div>
      )}

      <div className="grid gap-6 md:grid-cols-2">
        <div className="space-y-2">
          <label className="text-sm font-medium">Job title *</label>
          <input {...register("role")} className={inputCls} placeholder="Full-Stack Engineer" />
          {errors.role && <p className="text-xs text-red-500">{errors.role.message}</p>}
        </div>

        <div className="space-y-2">
          <label className="text-sm font-medium">Organization *</label>
          <input {...register("company")} className={inputCls} placeholder="CodeAlpha" />
          {errors.company && <p className="text-xs text-red-500">{errors.company.message}</p>}
        </div>
      </div>

      <div className="space-y-2">
        <label className="text-sm font-medium">Organization logo URL (optional)</label>
        <input
          {...register("logo_url")}
          className={inputCls}
          placeholder="https://... or /images/logos/codealpha.png"
        />
        <p className="text-xs text-ink-secondary">
          Square image works best; shown at 32×32 beside the organization name.
        </p>
      </div>

      <div className="grid gap-6 md:grid-cols-3">
        <div className="space-y-2">
          <label className="text-sm font-medium">Location</label>
          <input {...register("location")} className={inputCls} placeholder="Pakistan" />
        </div>

        <div className="space-y-2">
          <label className="text-sm font-medium">Location type</label>
          <select {...register("location_type")} className={inputCls}>
            <option value="">Please select (optional)</option>
            {LOCATION_TYPES.map((t) => (
              <option key={t} value={t}>
                {t}
              </option>
            ))}
          </select>
        </div>

        <div className="space-y-2">
          <label className="text-sm font-medium">Employment type</label>
          <select {...register("employment_type")} className={inputCls}>
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
        <label className="flex items-center gap-2 text-sm font-medium">
          <input
            type="checkbox"
            {...register("is_current")}
            className="h-4 w-4 rounded border-border-hairline accent-accent-signal"
          />
          I currently work here
        </label>

        <div className="grid gap-6 md:grid-cols-4">
          <div className="space-y-2">
            <label className="text-sm font-medium">Start month</label>
            <select {...register("start_month")} className={inputCls}>
              <option value="">Month</option>
              {MONTHS.map((m, i) => (
                <option key={m} value={i + 1}>
                  {m}
                </option>
              ))}
            </select>
          </div>

          <div className="space-y-2">
            <label className="text-sm font-medium">Start year *</label>
            <input
              {...register("start_year")}
              className={inputCls}
              placeholder="2026"
              inputMode="numeric"
            />
            {errors.start_year && (
              <p className="text-xs text-red-500">{errors.start_year.message}</p>
            )}
          </div>

          <div className="space-y-2">
            <label className="text-sm font-medium">End month</label>
            <select {...register("end_month")} className={inputCls} disabled={isCurrent}>
              <option value="">Month</option>
              {MONTHS.map((m, i) => (
                <option key={m} value={i + 1}>
                  {m}
                </option>
              ))}
            </select>
          </div>

          <div className="space-y-2">
            <label className="text-sm font-medium">End year (optional)</label>
            <input
              {...register("end_year")}
              className={inputCls}
              placeholder="2026"
              inputMode="numeric"
              disabled={isCurrent}
            />
            {errors.end_year && (
              <p className="text-xs text-red-500">{errors.end_year.message}</p>
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
        <label className="text-sm font-medium">Summary (optional)</label>
        <textarea
          {...register("summary")}
          rows={2}
          className={inputCls}
          placeholder="One or two lines describing the role, shown above the highlights."
        />
      </div>

      <div className="space-y-2">
        <label className="text-sm font-medium">Highlights (one per line)</label>
        <textarea
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
      </div>

      <div className="grid gap-6 md:grid-cols-2">
        <div className="space-y-2">
          <label className="text-sm font-medium">Display Order</label>
          <input type="number" {...register("display_order")} className={inputCls} />
          {errors.display_order && (
            <p className="text-xs text-red-500">{errors.display_order.message}</p>
          )}
        </div>

        <div className="space-y-2">
          <label className="text-sm font-medium">Status</label>
          <select {...register("status")} className={inputCls}>
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
          Save Experience
        </button>
      </div>
    </form>
  );
}
