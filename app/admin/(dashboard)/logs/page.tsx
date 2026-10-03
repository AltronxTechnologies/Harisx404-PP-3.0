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
  
  // Fetch logs sorted by newest first
  const { data: logs, error } = await supabase
    .from("system_logs")
    .select("id, level, message, context, resolved, created_at")
    .order("created_at", { ascending: false })
    .limit(100);

  if (error) {
    console.error("Failed to fetch logs:", error);
  }

  return <LogsDashboardClient initialLogs={logs || []} loadError={error ? "Logs could not be loaded. Apply the Admin system logs migration if it is not installed, then retry." : ""} />;
}
