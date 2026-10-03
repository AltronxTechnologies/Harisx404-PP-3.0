"use server";

import { requireAdmin } from "@/app/lib/admin-auth";
import { createSupabaseAdminClient } from "@/app/lib/supabase/server";
import { revalidatePath } from "next/cache";

export async function resolveLog(id: string) {
  const auth = await requireAdmin();
  if (auth.response) return { success: false, error: "Unauthorized" };
  const db = await createSupabaseAdminClient();
  const { data, error } = await db
    .from("system_logs")
    .update({ resolved: true })
    .eq("id", id)
    .select("id");
    
  if (error) {
    console.error("Failed to resolve log:", error);
    return { success: false, error: error.message };
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
    console.error("Failed to clear resolved logs:", error);
    return { success: false, error: error.message };
  }
  
  revalidatePath("/admin/logs");
  return { success: true };
}

export async function testErrorLogger() {
  const auth = await requireAdmin();
  if (auth.response) return { success: false, error: "Unauthorized" };
  const db = await createSupabaseAdminClient();
  const { error } = await db.from("system_logs").insert({
    level: "error",
    message: "Manual test error generated from the Admin panel",
    context: { userAction: "Clicked Test Error" },
  });
  if (error) return { success: false, error: "Unable to create a test log" };
  revalidatePath("/admin/logs");
  return { success: true };
}
