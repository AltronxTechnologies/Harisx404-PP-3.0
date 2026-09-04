"use server";

import { createSupabaseAdminClient } from "../lib/supabase/server";
import { revalidatePath, revalidateTag } from "next/cache";
import { cookies } from "next/headers";
import { v4 as uuidv4 } from "uuid";
import { type CurrentlyPlaying, getCurrentlyPlaying as getSpotifyCurrentlyPlaying } from "./spotify";

type ReactionType = "like" | "heart" | "celebrate" | "insightful";
const VALID_REACTIONS: ReactionType[] = [
  "like",
  "heart",
  "celebrate",
  "insightful",
];

type CreateContactResponse = {
  success: boolean;
  error?: string;
};

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
  const supabase = await createSupabaseAdminClient();
  
  try {
    const { data } = await supabase
      .from('article_reactions')
      .select('reaction_type, count')
      .eq('article_slug', slug);
    
    // Transform into a more usable format
    const reactionCounts: Record<string, number> = {};
    
    // Initialize with all reaction types at 0
    VALID_REACTIONS.forEach(type => {
      reactionCounts[type] = 0;
    });
    
    // Update with actual counts
    data?.forEach(row => {
      reactionCounts[row.reaction_type] = row.count;
    });
    
    return reactionCounts;
  } catch (error) {
    console.error('Error fetching article reactions:', error);
    return {};
  }
}

// Get user's reactions for an article from cookie
export async function getUserReactions(slug: string) {
  const cookieStore = await cookies();
  const reactionsJson = cookieStore.get(`article_reactions_${slug}`)?.value;
  let legacyReactions: string[] = [];
  if (reactionsJson) {
    try {
      legacyReactions = (JSON.parse(reactionsJson) as string[]).filter(
        (reaction) => VALID_REACTIONS.includes(reaction as ReactionType),
      );
    } catch {
      legacyReactions = [];
    }
  }

  const visitorId = cookieStore.get("visitor_id")?.value;
  if (visitorId) {
    try {
      const supabase = await createSupabaseAdminClient();
      const { data, error } = await supabase
        .from("article_reaction_visitors")
        .select("reaction_type")
        .eq("article_slug", slug)
        .eq("visitor_id", visitorId);
      if (!error) {
        const storedReactions = data?.map((row) => row.reaction_type) || [];
        return storedReactions;
      }
    } catch {
      // Fall through to the legacy cookie until the migration is applied.
    }
  }

  return legacyReactions;
}

// Toggle reaction (add or remove)
export async function toggleReaction(slug: string, reactionType: ReactionType) {
  const supabase = await createSupabaseAdminClient();
  const cookieStore = await cookies();
  
  try {
    let visitorId = cookieStore.get('visitor_id')?.value;
    if (!visitorId) {
      visitorId = uuidv4();
      cookieStore.set('visitor_id', visitorId, { 
        expires: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000), // 1 year
        path: '/',
        httpOnly: true,
        sameSite: 'strict'
      });
    }
    
    // Get user's current reactions for this article
    const cookieKey = `article_reactions_${slug}`;
    const existingReactionsJson = cookieStore.get(cookieKey)?.value;
    let userReactions: string[] = [];
    
    if (existingReactionsJson) {
      try {
        userReactions = JSON.parse(existingReactionsJson);
      } catch {
        userReactions = [];
      }
    }

    const { data: existingVisitorReaction, error: visitorReactionError } =
      await supabase
        .from("article_reaction_visitors")
        .select("reaction_type")
        .eq("article_slug", slug)
        .eq("reaction_type", reactionType)
        .eq("visitor_id", visitorId)
        .maybeSingle();
    if (visitorReactionError) throw visitorReactionError;
    const hasReacted = Boolean(existingVisitorReaction);
    
    const { data: adjustedCount, error: reactionError } = await supabase.rpc(
      "adjust_article_reaction",
      {
        target_slug: slug,
        target_type: reactionType,
        target_visitor: visitorId,
        should_add: !hasReacted,
      },
    );
    if (reactionError) throw reactionError;

    const { data: storedReactions, error: storedReactionsError } = await supabase
      .from("article_reaction_visitors")
      .select("reaction_type")
      .eq("article_slug", slug)
      .eq("visitor_id", visitorId);
    userReactions = storedReactionsError
      ? hasReacted
        ? userReactions.filter((reaction) => reaction !== reactionType)
        : Array.from(new Set([...userReactions, reactionType]))
      : storedReactions?.map((row) => row.reaction_type) || [];
    
    // Update cookie with new reactions
    try {
      revalidateTag("blog-reactions");
    } catch (cacheError) {
      console.warn("Reaction saved, but card summaries may refresh later.", cacheError);
    }
    try {
      cookieStore.set(cookieKey, JSON.stringify(userReactions), {
        expires: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
        path: "/",
        httpOnly: true,
        sameSite: "lax",
      });
      revalidatePath(`/blog/${slug}`);
      revalidatePath("/blog");
    } catch (postCommitError) {
      console.warn("Reaction saved, but local state could not be refreshed.", postCommitError);
    }
    
    return { 
      success: true, 
      added: !hasReacted, 
      removed: hasReacted,
      userReactions,
      count: Number(adjustedCount) || 0,
    };
  } catch (error) {
    console.error('Error toggling reaction:', error);
    return { 
      success: false, 
      message: 'Error processing reaction' 
    };
  }
}

export async function createContact(
  email: string,
  honeypot?: string
): Promise<CreateContactResponse> {
  // If honeypot field is filled, it's likely a bot - silently reject
  // Return success to fool the bot, but don't actually create the contact
  if (honeypot) {
    return { success: true };
  }

  try {
    const response = await fetch(
      "https://app.loops.so/api/v1/contacts/create",
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${process.env.LOOPS_API_KEY}`,
        },
        body: JSON.stringify({ email, userGroup: "Blogfolio" }),
      },
    );

    if (!response.ok) {
      throw new Error("Failed to create contact");
    }

    return { success: true };
  } catch (error) {
    return { success: false, error: "Failed to create contact" };
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
