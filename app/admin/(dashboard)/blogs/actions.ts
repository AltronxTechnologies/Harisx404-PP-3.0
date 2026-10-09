"use server";

import { z } from "zod";
import { requireAdmin } from "@/app/lib/admin-auth";
import { changeFeaturedBlogPost } from "@/app/lib/admin/featured-blog";

export async function setFeaturedBlogPost(id: string, featured = true) {
  const auth = await requireAdmin();
  if (auth.response) return { success: false as const, error: auth.response.status === 401 ? "Your Admin session expired. Sign in again." : "Admin access is required." };
  if (!z.string().uuid().safeParse(id).success || typeof featured !== "boolean") {
    return { success: false as const, error: "Choose a valid Blog post." };
  }
  return changeFeaturedBlogPost(id, featured);
}
