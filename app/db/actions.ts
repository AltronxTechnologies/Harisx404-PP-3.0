"use server";

import { createSupabaseAdminClient } from "../lib/supabase/server";
import { revalidatePath, revalidateTag } from "next/cache";
import { cookies } from "next/headers";
import { headers } from "next/headers";
import { createHash } from "crypto";
import { v4 as uuidv4 } from "uuid";
import { type CurrentlyPlaying, getCurrentlyPlaying as getSpotifyCurrentlyPlaying } from "./spotify";

type ReactionType = "like" | "heart" | "celebrate" | "insightful";
const VALID_REACTIONS: ReactionType[] = [
  "like",
  "heart",
  "celebrate",
  "insightful",
];

// Warn only once when article_views is missing (PGRST205) instead of
// logging on every page view.
let warnedMissingViewsTable = false;

export async function incrementViewCount(slug: string) {
  try {
    const supabase = await createSupabaseAdminClient();

    const { data: existingArticle, error: selectError } = await supabase
      .from("article_views")
      .select("*")
      .eq("slug", slug)
      .maybeSingle();

    if (selectError) throw selectError;

    if (existingArticle) {
      const { error } = await supabase
        .from("article_views")
        .update({
          view_count: existingArticle.view_count + 1,
          last_viewed_at: new Date().toISOString(),
        })
        .eq("slug", slug);

      if (error) throw error;

      return existingArticle.view_count + 1;
    } else {
      const { error } = await supabase
        .from("article_views")
        .insert({ slug, view_count: 1 });

      if (error) throw error;

      return 1;
    }
  } catch (error: any) {
    if (error?.code === "PGRST205") {
      if (!warnedMissingViewsTable) {
        warnedMissingViewsTable = true;
        console.warn(
          "article_views table is missing (PGRST205); view counts disabled. Run migrations/2026_redesign.sql to create it.",
        );
      }
    } else {
      console.warn("Error incrementing view count:", error);
    }
    return 0;
  }
}

// Get all reaction counts for an article
export async function getArticleReactions(slug: string) {
  const reactionCounts: Record<string, number> = Object.fromEntries(
    VALID_REACTIONS.map((type) => [type, 0]),
  );
  if (!process.env.SUPABASE_SERVICE_ROLE_KEY) return null;

  try {
    const supabase = await createSupabaseAdminClient();
    const { data, error } = await supabase
      .from("article_reactions")
      .select("reaction_type, count")
      .eq("article_slug", slug);
    if (error) throw error;

    data?.forEach((row) => {
      reactionCounts[row.reaction_type] = row.count;
    });
    return reactionCounts;
  } catch (error) {
    console.error("Error fetching optional article reactions:", error);
    return null;
  }
}

// The marker, not the legacy presentation cookie, is the authoritative choice.
export async function getUserReactions(slug: string) {
  const cookieStore = await cookies();
  const visitorId = cookieStore.get("visitor_id")?.value;
  if (!visitorId || !/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(visitorId)) return [];
  if (!process.env.SUPABASE_SERVICE_ROLE_KEY) throw new Error("Reactions unavailable");
  const supabase = await createSupabaseAdminClient();
  const { data, error } = await supabase
    .from("article_reaction_visitors")
    .select("reaction_type")
    .eq("article_slug", slug)
    .eq("visitor_id", visitorId)
    .maybeSingle();
  if (error) throw new Error("Unable to load visitor reaction");
  return data ? [data.reaction_type] : [];
}

// Toggle the selected reaction, or switch to a different one.
export async function toggleReaction(slug: string, reactionType: ReactionType) {
  const cookieStore = await cookies();
  
  try {
    if (!VALID_REACTIONS.includes(reactionType) || !slug || slug.length > 200) {
      return { success: false, message: "Invalid reaction request." };
    }
    if (!process.env.SUPABASE_SERVICE_ROLE_KEY) {
      return {
        success: false,
        message: "Reactions are temporarily unavailable. Please try again later.",
      };
    }
    const supabase = await createSupabaseAdminClient();
    let visitorId = cookieStore.get("visitor_id")?.value;
    if (!visitorId || !/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(visitorId)) {
      visitorId = uuidv4();
      cookieStore.set("visitor_id", visitorId, {
        expires: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000), // 1 year
        path: "/",
        httpOnly: true,
        sameSite: "strict",
      });
    }

    const headerStore = await headers();
    const requestSignal =
      headerStore.get("cf-connecting-ip") ||
      headerStore.get("x-vercel-forwarded-for")?.split(",")[0]?.trim() ||
      headerStore.get("x-forwarded-for")?.split(",")[0]?.trim() ||
      headerStore.get("x-real-ip") ||
      "unavailable";
    const scopedSignal = requestSignal === "unavailable"
      ? `visitor:${visitorId}`
      : requestSignal;
    const signalHash = createHash("sha256")
      .update(`${process.env.SUPABASE_SERVICE_ROLE_KEY}:${scopedSignal}`)
      .digest("hex");
    
    const { data, error: reactionError } = await supabase.rpc(
      "toggle_article_reaction",
      {
        target_slug: slug,
        target_type: reactionType,
        target_visitor: visitorId,
        target_signal_hash: signalHash,
      },
    );
    if (reactionError) throw reactionError;
    const result = data as {
      reaction: ReactionType | null;
      counts: Record<ReactionType, number>;
    } | null;
    if (
      !result || !result.counts ||
      !VALID_REACTIONS.every((type) =>
        Number.isInteger(result.counts[type]) && result.counts[type] >= 0,
      ) ||
      (result.reaction !== null && !VALID_REACTIONS.includes(result.reaction))
    ) {
      throw new Error("Invalid reaction response");
    }
    
    try {
      revalidateTag("blog-reactions");
    } catch {
      console.warn("Reaction saved, but card summaries may refresh later.");
    }
    try {
      cookieStore.set(
        `article_reactions_${slug}`,
        JSON.stringify(result.reaction ? [result.reaction] : []),
        {
          expires: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
          path: "/",
          httpOnly: true,
          sameSite: "lax",
        },
      );
    } catch {
      console.warn("Reaction saved, but local cookie could not be refreshed.");
    }
    try {
      revalidatePath(`/blog/${slug}`);
      revalidatePath("/blog");
    } catch {
      console.warn("Reaction saved, but local state could not be refreshed.");
    }
    
    return { success: true, reaction: result.reaction, counts: result.counts };
  } catch (error) {
    console.error("Error toggling reaction.");
    const errorMessage =
      error && typeof error === "object" && "message" in error
        ? String(error.message)
        : "";
    const isRateLimited = errorMessage.includes("Reaction rate limit exceeded");
    return { 
      success: false, 
      message: isRateLimited
        ? "You're reacting too quickly. Please wait a few minutes and try again."
        : "We couldn't save your reaction. Please try again.",
    };
  }
}

export async function getCurrentlyPlaying(): Promise<CurrentlyPlaying | null> {
  try {
    const result = await getSpotifyCurrentlyPlaying();
    return result || null;
  } catch (error) {
    console.error("Error fetching Spotify data:", error);
    return null;
  }
} 
