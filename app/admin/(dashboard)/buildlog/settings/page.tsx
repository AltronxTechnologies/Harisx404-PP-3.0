import { BuildlogSettingsForm } from "@/app/components/admin/BuildlogSettingsForm";
import { createSupabaseAdminClient } from "@/app/lib/supabase/server";
import type { BuildlogSettings } from "@/app/buildlog/types";

export default async function BuildlogSettingsPage() {
  const supabase = await createSupabaseAdminClient();
  const { data, error } = await supabase
    .from("buildlog_settings")
    .select("kicker, heading, heading_accent, description, archive_label, seo_title, seo_description")
    .eq("id", true)
    .single();
  if (error || !data) {
    throw new Error(`Unable to load Buildlog settings: ${error?.message || "No settings row"}`);
  }

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Buildlog page settings</h1>
        <p className="text-sm text-ink-secondary">
          Manage the public hero, description, and archive label.
        </p>
      </div>
      <div className="rounded-xl border border-border-hairline bg-surface-raised p-4 shadow-sm sm:p-6">
        <BuildlogSettingsForm initialData={data as BuildlogSettings} />
      </div>
    </div>
  );
}
