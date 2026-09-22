import "server-only";

import { getPublicSupabase } from "@/app/lib/supabase/safe";
import type { CommunityWallMessage, CommunityWallSettings } from "./types";

export const COMMUNITY_WALL_PAGE_SIZE = 24;

export const fallbackCommunityWallSettings: CommunityWallSettings = {
  kicker: "The wall remembers",
  heading: "Words that echo",
  heading_accent: "always.",
  description:
    "A moderated collection of notes, hellos, and thoughtful messages left by visitors.",
  collection_label: "Visitor notes",
  sign_in_title: "Join the wall",
  sign_in_description: "Sign in with GitHub to leave a note for review.",
  composer_title: "Leave your mark",
  composer_description:
    "Share a thoughtful note. Submissions are reviewed before they appear.",
  empty_title: "The first note is waiting",
  empty_description: "Approved visitor messages will appear here after moderation.",
  seo_title: "Community Wall | Leave Your Mark",
  seo_description:
    "Read moderated notes from visitors and leave a thoughtful message on Muhammad Haris's community wall.",
};

export function safeCommunityAvatar(value: unknown) {
  if (typeof value !== "string") return null;
  try {
    const url = new URL(value);
    return url.protocol === "https:" && [
      "avatars.githubusercontent.com",
      "github.com",
      "user-images.githubusercontent.com",
    ].includes(url.hostname)
      ? url.toString()
      : null;
  } catch {
    return null;
  }
}

export async function fetchCommunityWall(page: number) {
  const supabase = getPublicSupabase();
  if (!supabase) {
    if (process.env.NODE_ENV === "production") {
      throw new Error("Community Wall database configuration is unavailable.");
    }
    return { messages: [] as CommunityWallMessage[], count: 0, page: 1 };
  }

  const countResult = await supabase
    .from("public_community_wall_messages")
    .select("id", { count: "exact", head: true });
  if (countResult.error && /relation|schema cache|not find/i.test(countResult.error.message)) {
    if (process.env.NODE_ENV === "production") throw new Error("Community Wall database schema is unavailable.");
    return { messages: [] as CommunityWallMessage[], count: 0, page: 1 };
  }
  if (countResult.error) throw new Error("Unable to load Community Wall messages.");
  const count = countResult.count ?? 0;
  const totalPages = Math.max(1, Math.ceil(count / COMMUNITY_WALL_PAGE_SIZE));
  const safePage = Math.min(Math.max(page, 1), totalPages);
  const start = (safePage - 1) * COMMUNITY_WALL_PAGE_SIZE;
  const end = start + COMMUNITY_WALL_PAGE_SIZE - 1;
  const { data, error } = await supabase
    .from("public_community_wall_messages")
    .select("id, message, patternindex, creator_name, creator_avatar_url, created_at")
    .order("created_at", { ascending: false })
    .range(start, end);

  if (error && /relation|schema cache|not find/i.test(error.message)) {
    if (process.env.NODE_ENV === "production") {
      throw new Error("Community Wall database schema is unavailable.");
    }
    return { messages: [] as CommunityWallMessage[], count: 0, page: 1 };
  }
  if (error) throw new Error("Unable to load Community Wall messages.");

  return {
    count,
    page: safePage,
    messages: (data ?? []).map((message) => ({
      ...message,
      message: String(message.message),
      creator_name: String(message.creator_name || "Visitor"),
      creator_avatar_url: safeCommunityAvatar(message.creator_avatar_url),
      patternindex: Number.isInteger(message.patternindex) ? message.patternindex : 0,
    })) as CommunityWallMessage[],
  };
}

export async function fetchCommunityWallSettings() {
  const supabase = getPublicSupabase();
  if (!supabase) {
    if (process.env.NODE_ENV === "production") {
      throw new Error("Community Wall settings configuration is unavailable.");
    }
    return fallbackCommunityWallSettings;
  }

  const { data, error } = await supabase
    .from("public_community_wall_settings")
    .select("kicker, heading, heading_accent, description, collection_label, sign_in_title, sign_in_description, composer_title, composer_description, empty_title, empty_description, seo_title, seo_description")
    .single();
  if (error && /relation|schema cache|not find|no rows/i.test(error.message)) {
    if (process.env.NODE_ENV === "production") {
      throw new Error("Community Wall settings schema is unavailable.");
    }
    return fallbackCommunityWallSettings;
  }
  if (error || !data) throw new Error("Unable to load Community Wall settings.");
  return data as CommunityWallSettings;
}
