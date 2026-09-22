import { CommunityWallSettingsForm } from "@/app/components/admin/CommunityWallSettingsForm";
import { createSupabaseAdminClient } from "@/app/lib/supabase/server";
import type { CommunityWallSettings } from "@/app/community-wall/types";

export default async function CommunityWallSettingsPage() {
  const db = await createSupabaseAdminClient();
  const { data, error } = await db.from("community_wall_settings").select("kicker, heading, heading_accent, description, collection_label, sign_in_title, sign_in_description, composer_title, composer_description, empty_title, empty_description, seo_title, seo_description").eq("id", true).single();
  if (error || !data) throw new Error(`Unable to load Community Wall settings: ${error?.message || "No settings row"}`);
  return <div className="flex flex-col gap-6"><div><h1 className="text-2xl font-bold tracking-tight">Community Wall settings</h1><p className="text-sm text-ink-secondary">Manage public page copy, empty states, and metadata.</p></div><div className="rounded-xl border border-border-hairline bg-surface-raised p-4 shadow-sm sm:p-6"><CommunityWallSettingsForm initialData={data as CommunityWallSettings} /></div></div>;
}
