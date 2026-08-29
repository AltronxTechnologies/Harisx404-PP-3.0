"use server";

import { revalidatePath } from "next/cache";
import createSupabaseServerClient from "@/app/lib/supabase/server";

const MAX_MESSAGE_LENGTH = 200;

/** Create a guestbook entry. Requires an authenticated user; includes a
 *  honeypot field and server-side length validation. */
export async function createGuestbookEntry(formData: FormData) {
  // Honeypot — real users never fill this hidden field.
  if ((formData.get("website") as string)?.trim()) return;

  const message = ((formData.get("message") as string) || "").trim();
  if (!message || message.length > MAX_MESSAGE_LENGTH) return;

  const supabase = await createSupabaseServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return;

  const newNote = {
    message,
    patternindex: Math.floor(Math.random() * 5),
    rotation: Math.floor(Math.random() * 11) - 5,
    user_id: user.id,
    creator_name: user.user_metadata.full_name || user.email?.split("@")[0] || "Anonymous",
    creator_avatar_url: user.user_metadata.avatar_url ?? null,
  };

  await supabase.from("messages").insert(newNote);
  revalidatePath("/community-wall");
}
