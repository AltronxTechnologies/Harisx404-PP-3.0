import { BuildlogSettingsForm } from "@/app/components/admin/BuildlogSettingsForm";
import { createSupabaseAdminClient } from "@/app/lib/supabase/server";
import type { BuildlogSettings } from "@/app/buildlog/types";
import Link from "next/link";

export default async function BuildlogSettingsPage() {
  const supabase = await createSupabaseAdminClient();
  const { data, error } = await supabase
    .from("buildlog_settings")
    .select("kicker, heading, heading_accent, description, archive_label, seo_title, seo_description, updated_at")
    .eq("id", true)
    .single();
  if (error || !data) return <div role="alert" className="rounded-xl border border-red-500/30 bg-red-950/30 p-5 text-sm text-red-300">Buildlog settings could not be loaded. No changes were made. <Link prefetch={false} href={`/admin/buildlog/settings?retry=${Date.now()}`} className="font-medium underline underline-offset-2">Retry</Link>.</div>;

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Buildlog page settings</h1>
        <p className="text-sm text-ink-secondary">
          Manage the public hero, description, and archive label.
        </p>
      </div>
      <div className="rounded-xl border border-border-hairline bg-surface-raised p-4 shadow-sm sm:p-6">
        <BuildlogSettingsForm initialData={data as BuildlogSettings & { updated_at: string }} />
      </div>
    </div>
  );
}
