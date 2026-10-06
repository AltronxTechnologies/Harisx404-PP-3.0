"use server";

import { requireAdmin } from "@/app/lib/admin-auth";
import { createSupabaseAdminClient } from "@/app/lib/supabase/server";
import { revalidatePath } from "next/cache";
import { z } from "zod";

const logsQuery = z.object({
  page: z.number().int().min(1).max(10000),
  level: z.enum(["all", "info", "warn", "error", "fatal"]),
  status: z.enum(["all", "unresolved", "resolved"]),
  search: z.string().trim().max(120),
}).strict();

export async function getLogsPage(input: { page: number; level: string; status: string; search: string }) {
  const auth = await requireAdmin();
  if (auth.response) return { success: false as const, error: "Unauthorized" };
  const parsed = logsQuery.safeParse(input);
  if (!parsed.success) return { success: false as const, error: "Invalid log filters." };
  const { page, level, status, search } = parsed.data;
  const db = await createSupabaseAdminClient();
  let query = db.from("system_logs")
    .select("id, level, message, context, resolved, created_at", { count: "exact" });
  if (level !== "all") query = query.eq("level", level);
  if (status !== "all") query = query.eq("resolved", status === "resolved");
  if (search) query = query.ilike("message", `%${search.replace(/[\\%_]/g, "\\$&")}%`);
  const { data, count, error } = await query.order("created_at", { ascending: false }).order("id", { ascending: false }).range((page - 1) * 50, page * 50 - 1);
  if (error || count === null || !Array.isArray(data)) return { success: false as const, error: "Logs could not be loaded. Try again." };
  return { success: true as const, logs: data, count };
}

export async function resolveLog(id: string) {
  const auth = await requireAdmin();
  if (auth.response) return { success: false, error: "Unauthorized" };
  if (!z.string().uuid().safeParse(id).success) return { success: false, error: "Invalid log ID." };
  const db = await createSupabaseAdminClient();
  const { data, error } = await db
    .from("system_logs")
    .update({ resolved: true })
    .eq("id", id)
    .eq("resolved", false)
    .select("id");
    
  if (error) {
    console.error("Failed to resolve log:", error.code || "unknown");
    return { success: false, error: "Unable to resolve log. Refresh and try again." };
  }
  if (!data?.length) return { success: false, error: "Log not found. Reload this page." };
  
  revalidatePath("/admin/logs");
  return { success: true };
}

export async function clearAllResolvedLogs() {
  const auth = await requireAdmin();
  if (auth.response) return { success: false, error: "Unauthorized" };
  const db = await createSupabaseAdminClient();
  const { error } = await db
    .from("system_logs")
    .delete()
    .eq("resolved", true);
    
  if (error) {
    console.error("Failed to clear resolved logs:", error.code || "unknown");
    return { success: false, error: "Unable to clear resolved logs. Refresh and try again." };
  }
  
  revalidatePath("/admin/logs");
  return { success: true };
}
