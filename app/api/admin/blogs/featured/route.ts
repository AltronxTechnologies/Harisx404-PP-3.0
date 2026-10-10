import { NextResponse } from "next/server";
import { z } from "zod";
import { requireAdmin } from "@/app/lib/admin-auth";
import { changeFeaturedBlogPost } from "@/app/lib/admin/featured-blog";

const payloadSchema = z.object({ id: z.string().uuid(), featured: z.boolean().default(true) }).strict();

export async function POST(request: Request) {
  const auth = await requireAdmin();
  if (auth.response) return auth.response;
  let payload;
  try {
    payload = payloadSchema.safeParse(await request.json());
  } catch {
    return NextResponse.json({ error: "Invalid featured-article request." }, { status: 400 });
  }
  if (!payload.success) return NextResponse.json({ error: "Choose a valid Blog post." }, { status: 400 });

  try {
    const result = await changeFeaturedBlogPost(payload.data.id, payload.data.featured);
    if (!result.success) return NextResponse.json({ error: result.error }, { status: result.status });
    return NextResponse.json(result);
  } catch {
    return NextResponse.json({ error: "Featured selection could not be confirmed. Refresh before retrying." }, { status: 503 });
  }
}
