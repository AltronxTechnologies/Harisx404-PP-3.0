import { NextResponse } from "next/server";
import createSupabaseServerClient from "@/app/lib/supabase/server";

export async function requireAdmin() {
  const client = await createSupabaseServerClient();
  const { data: { user }, error } = await client.auth.getUser();
  if (error || !user) {
    return { response: NextResponse.json({ error: "Unauthorized" }, { status: 401 }) };
  }

  const adminEmail = process.env.ADMIN_EMAIL?.trim().toLowerCase();
  if (!adminEmail) {
    return { response: NextResponse.json({ error: "Admin access is not configured" }, { status: 503 }) };
  }
  if (user.email?.trim().toLowerCase() !== adminEmail) {
    return { response: NextResponse.json({ error: "Forbidden" }, { status: 403 }) };
  }
  return { client };
}
