import { createClient, type SupabaseClient } from "@supabase/supabase-js";

/**
 * Environment-safe Supabase access.
 *
 * The app must never crash at import time because Supabase credentials are
 * missing or placeholders (local dev, CI, preview sandboxes). Consumers get
 * `null` when no usable configuration exists and are expected to fall back
 * to static/empty content.
 */

const PLACEHOLDER_FRAGMENTS = ["your_supabase", "placeholder", "example.com"];

export function getSupabaseEnv(): { url: string; anonKey: string } | null {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  if (!url || !anonKey) return null;
  if (PLACEHOLDER_FRAGMENTS.some((fragment) => url.includes(fragment))) return null;

  try {
    // Throws for malformed URLs (e.g. leftover placeholder text).
    new URL(url);
  } catch {
    return null;
  }

  return { url, anonKey };
}

let cachedPublicClient: SupabaseClient | null | undefined;

/**
 * Lazily created anonymous client for public reads (no cookies/session).
 * Returns `null` when Supabase is not configured.
 */
export function getPublicSupabase(): SupabaseClient | null {
  if (cachedPublicClient !== undefined) return cachedPublicClient;

  const env = getSupabaseEnv();
  cachedPublicClient = env ? createClient(env.url, env.anonKey) : null;
  return cachedPublicClient;
}
