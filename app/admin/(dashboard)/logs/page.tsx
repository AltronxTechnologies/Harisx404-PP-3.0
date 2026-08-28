import createSupabaseServerClient from "@/app/lib/supabase/server";
import LogsDashboardClient from "./client";

export const metadata = {
  title: "System Logs | Admin",
  description: "Monitor live errors and system events",
};

export default async function LogsPage() {
  const supabase = await createSupabaseServerClient();
  
  // Fetch logs sorted by newest first
  const { data: logs, error } = await supabase
    .from("system_logs")
    .select("*")
    .order("created_at", { ascending: false })
    .limit(100);

  if (error) {
    console.error("Failed to fetch logs:", error);
    // Even if it fails, render the client with empty logs so they can at least see the UI
  }

  return <LogsDashboardClient initialLogs={logs || []} />;
}
