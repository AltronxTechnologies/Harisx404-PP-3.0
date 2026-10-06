import { redirect } from "next/navigation";
import { requireAdmin } from "@/app/lib/admin-auth";
import { createSupabaseAdminClient } from "@/app/lib/supabase/server";
import LogsDashboardClient from "./client";

export const metadata = {
  title: "System Logs | Admin",
  description: "Monitor live errors and system events",
};

export default async function LogsPage() {
  const auth = await requireAdmin();
  if (auth.response) redirect("/admin/login");
  const supabase = await createSupabaseAdminClient();
  
  const [{ data: logs, count, error }, { count: unresolvedCount, error: countError }] = await Promise.all([
    supabase.from("system_logs").select("id, level, message, context, resolved, created_at", { count: "exact" }).order("created_at", { ascending: false }).order("id", { ascending: false }).range(0, 49),
    supabase.from("system_logs").select("id", { count: "exact", head: true }).eq("resolved", false),
  ]);

  if (error || countError) {
    console.error("Failed to fetch log status:", error?.code || countError?.code || "unknown");
  }

  return <LogsDashboardClient initialLogs={logs || []} totalCount={count ?? 0} unresolvedCount={unresolvedCount ?? 0} loadError={error || countError || count === null || unresolvedCount === null ? "Logs or counts could not be loaded. Reload to retry before acting." : ""} />;
}
