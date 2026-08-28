import { getPublicSupabase } from "@/app/lib/supabase/safe";

// We use the raw supabase-js client here to avoid Next.js cookie/session requirements.
// This allows the logger to run anywhere (Client Components, Server Actions, Edge, etc.)
// Resolves to null when Supabase is not configured, in which case we log to console only.
const supabase = getPublicSupabase();

type LogLevel = "info" | "warn" | "error" | "fatal";

// Warn only once when the system_logs table doesn't exist yet (PGRST205),
// instead of spamming an error on every log call.
let warnedMissingTable = false;

async function log(level: LogLevel, message: string, context?: any) {
  // Always log to console for local debugging
  if (level === "error" || level === "fatal") {
    console.error(`[${level.toUpperCase()}] ${message}`, context);
  } else {
    console.log(`[${level.toUpperCase()}] ${message}`, context);
  }

  // Fire and forget to Supabase
  if (!supabase) return;
  try {
    const { error } = await supabase.from("system_logs").insert([
      {
        level,
        message,
        context: context ? JSON.parse(JSON.stringify(context, Object.getOwnPropertyNames(context))) : {},
      },
    ]);

    if (error) {
      if (error.code === "PGRST205") {
        if (!warnedMissingTable) {
          warnedMissingTable = true;
          console.warn(
            "system_logs table is missing (PGRST205); skipping remote logging. Run migrations/2026_redesign.sql to create it.",
          );
        }
      } else {
        console.error("Failed to write to system_logs:", error);
      }
    }
  } catch (e) {
    console.error("Exception writing to system_logs:", e);
  }
}

export const logger = {
  info: (message: string, context?: any) => log("info", message, context),
  warn: (message: string, context?: any) => log("warn", message, context),
  error: (message: string, context?: any) => log("error", message, context),
  fatal: (message: string, context?: any) => log("fatal", message, context),
};
