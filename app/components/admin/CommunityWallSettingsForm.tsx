"use client";

import { useState } from "react";
import { zodResolver } from "@hookform/resolvers/zod";
import { Loader2 } from "lucide-react";
import { useForm } from "react-hook-form";
import * as z from "zod";
import type { CommunityWallSettings } from "@/app/community-wall/types";

const schema = z.object({
  kicker: z.string().trim().min(2).max(80), heading: z.string().trim().min(2).max(100), heading_accent: z.string().trim().min(1).max(60), description: z.string().trim().min(10).max(300), collection_label: z.string().trim().min(2).max(60), sign_in_title: z.string().trim().min(2).max(100), sign_in_description: z.string().trim().min(5).max(200), composer_title: z.string().trim().min(2).max(100), composer_description: z.string().trim().min(5).max(200), empty_title: z.string().trim().min(2).max(100), empty_description: z.string().trim().min(5).max(240), seo_title: z.string().trim().min(2).max(100), seo_description: z.string().trim().min(10).max(300),
});
const inputClass = "mt-2 w-full rounded-xl border border-border-hairline bg-surface-base px-3 py-2.5 text-sm text-ink-primary outline-none focus:border-accent-signal focus:ring-2 focus:ring-accent-signal/20";

export function CommunityWallSettingsForm({ initialData }: { initialData: CommunityWallSettings }) {
  const [busy, setBusy] = useState(false);
  const [notice, setNotice] = useState("");
  const { register, handleSubmit, formState: { errors } } = useForm<CommunityWallSettings>({ resolver: zodResolver(schema), defaultValues: initialData });
  const save = async (values: CommunityWallSettings) => {
    setBusy(true); setNotice("");
    try {
      const response = await fetch("/api/admin/community-wall/settings", { method: "PUT", headers: { "Content-Type": "application/json" }, body: JSON.stringify(values) });
      const result = await response.json();
      if (!response.ok) throw new Error(result.error || "Save failed.");
      setNotice("Community Wall settings saved.");
    } catch (error) { setNotice(error instanceof Error ? error.message : "Save failed."); }
    finally { setBusy(false); }
  };
  const field = (name: keyof CommunityWallSettings, label: string, multiline = false) => <label className="block text-sm font-medium">{label}{multiline ? <textarea {...register(name)} rows={3} className={`${inputClass} resize-y`} /> : <input {...register(name)} className={inputClass} />}{errors[name] && <span role="alert" className="mt-1.5 block text-xs text-red-500">{errors[name]?.message}</span>}</label>;
  return <form onSubmit={handleSubmit(save)} className="space-y-6">
    {notice && <p role="status" className="rounded-xl border border-border-hairline bg-surface-base p-3 text-sm text-ink-secondary">{notice}</p>}
    <div className="grid gap-6 md:grid-cols-2">{field("kicker", "Hero kicker")}{field("collection_label", "Collection label")}{field("heading", "Hero heading")}{field("heading_accent", "Hero accent")}</div>
    {field("description", "Hero description", true)}
    <div className="grid gap-6 border-t border-border-hairline pt-6 md:grid-cols-2">{field("sign_in_title", "Signed-out card title")}{field("sign_in_description", "Signed-out card description", true)}{field("composer_title", "Composer title")}{field("composer_description", "Composer description", true)}</div>
    <div className="grid gap-6 border-t border-border-hairline pt-6 md:grid-cols-2">{field("empty_title", "Empty-state title")}{field("empty_description", "Empty-state description", true)}{field("seo_title", "SEO title")}{field("seo_description", "SEO description", true)}</div>
    <div className="flex justify-end border-t border-border-hairline pt-6"><button type="submit" disabled={busy} className="inline-flex min-w-40 items-center justify-center rounded-xl bg-accent-signal px-6 py-2.5 text-sm font-medium text-white disabled:opacity-50">{busy && <Loader2 className="mr-2 size-4 animate-spin" />}Save settings</button></div>
  </form>;
}
