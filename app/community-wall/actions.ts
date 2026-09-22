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

function safeProviderAvatar(value: unknown) {
  if (typeof value !== "string") return null;
  try {
    const url = new URL(value);
    return url.protocol === "https:" && ["avatars.githubusercontent.com", "lh3.googleusercontent.com"].includes(url.hostname)
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
    return { status: "success", message: "Your note is now live on the wall." };
  }

  const message = String(formData.get("message") || "").trim();
  if (!message || message.length > MAX_MESSAGE_LENGTH) {
    return { status: "error", message: "Enter a message between 1 and 200 characters." };
  }

  const auth = await createSupabaseServerClient();
  const { data: { user }, error: authError } = await auth.auth.getUser();
  if (authError || !user) {
    return { status: "error", message: "Sign in with GitHub or Google before posting a note." };
  }

  const db = await createSupabaseAdminClient();
  const rawName = String(
    user.user_metadata?.full_name || user.user_metadata?.user_name || user.email?.split("@")[0] || "Visitor",
  ).trim();
  const creatorName = rawName.slice(0, 80) || "Visitor";
  const { error } = await db.rpc("submit_community_wall_message", {
    p_user_id: user.id,
    p_message: message,
    p_patternindex: Math.floor(Math.random() * 24),
    p_rotation: Math.floor(Math.random() * 7) - 3,
    p_creator_name: creatorName,
    p_creator_avatar_url: safeProviderAvatar(user.user_metadata?.avatar_url || user.user_metadata?.picture),
  });
  if (error) {
    if (error.message === "already_submitted" || error.code === "23505") {
      return { status: "error", message: "This account has already added its one note." };
    }
    console.error("Community Wall submission failed", error);
    return { status: "error", message: "The note could not be submitted. Try again." };
  }

  revalidatePath("/admin/community-wall");
  revalidatePath("/community-wall");
  return { status: "success", message: "Your note is now live on the wall." };
}
