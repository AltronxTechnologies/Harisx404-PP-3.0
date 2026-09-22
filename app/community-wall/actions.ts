"use server";

import { revalidatePath } from "next/cache";
import createSupabaseServerClient, {
  createSupabaseAdminClient,
} from "@/app/lib/supabase/server";

const MAX_MESSAGE_LENGTH = 200;

export type CommunityWallActionState = {
  status: "idle" | "success" | "error";
  message: string;
};

function safeGitHubAvatar(value: unknown) {
  if (typeof value !== "string") return null;
  try {
    const url = new URL(value);
    return url.protocol === "https:" && url.hostname === "avatars.githubusercontent.com"
      ? url.toString()
      : null;
  } catch {
    return null;
  }
}

export async function createGuestbookEntry(
  _previous: CommunityWallActionState,
  formData: FormData,
): Promise<CommunityWallActionState> {
  if (String(formData.get("website") || "").trim()) {
    return { status: "success", message: "Your note was submitted for review." };
  }

  const message = String(formData.get("message") || "").trim();
  if (!message || message.length > MAX_MESSAGE_LENGTH) {
    return { status: "error", message: "Enter a message between 1 and 200 characters." };
  }

  const auth = await createSupabaseServerClient();
  const { data: { user }, error: authError } = await auth.auth.getUser();
  if (authError || !user) {
    return { status: "error", message: "Sign in with GitHub before posting a note." };
  }

  const db = await createSupabaseAdminClient();
  const rawName = String(
    user.user_metadata?.full_name || user.user_metadata?.user_name || user.email?.split("@")[0] || "Visitor",
  ).trim();
  const creatorName = rawName.slice(0, 80) || "Visitor";
  const { error } = await db.rpc("submit_community_wall_message", {
    p_user_id: user.id,
    p_message: message,
    p_patternindex: Math.floor(Math.random() * 5),
    p_rotation: Math.floor(Math.random() * 7) - 3,
    p_creator_name: creatorName,
    p_creator_avatar_url: safeGitHubAvatar(user.user_metadata?.avatar_url),
  });
  if (error) {
    if (error.message === "daily_limit") {
      return { status: "error", message: "You can submit up to three notes per day." };
    }
    if (error.message === "cooldown") {
      return { status: "error", message: "Please wait a minute before submitting another note." };
    }
    console.error("Community Wall submission failed", error);
    return { status: "error", message: "The note could not be submitted. Try again." };
  }

  revalidatePath("/admin/community-wall");
  return { status: "success", message: "Your note was submitted for review." };
}
