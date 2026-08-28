"use server";

import createSupabaseServerClient from "@/app/lib/supabase/server";
import { revalidatePath } from "next/cache";

export async function resolveLog(id: string) {
  const supabase = await createSupabaseServerClient();
  const { error } = await supabase
    .from("system_logs")
    .update({ resolved: true })
    .eq("id", id);
    
  if (error) {
    console.error("Failed to resolve log:", error);
    return { success: false, error: error.message };
  }
  
  revalidatePath("/admin/logs");
  return { success: true };
}

export async function clearAllResolvedLogs() {
  const supabase = await createSupabaseServerClient();
  const { error } = await supabase
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
  const { logger } = await import("@/app/lib/logger");
  await logger.error("This is a manual test error generated from the Admin panel", {
    userAction: "Clicked Test Error",
    timestamp: new Date().toISOString(),
  });
  revalidatePath("/admin/logs");
  return { success: true };
}
