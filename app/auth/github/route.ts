import { NextResponse } from "next/server";
import createSupabaseServerClient from "@/app/lib/supabase/server";

export async function GET(request: Request) {
  const origin = new URL(request.url).origin;
  const supabase = await createSupabaseServerClient();
  const { data, error } = await supabase.auth.signInWithOAuth({
    provider: "github",
    options: {
      redirectTo: `${origin}/auth/callback?next=/community-wall`,
    },
  });
  if (error || !data.url) {
    return NextResponse.redirect(`${origin}/community-wall?auth=error`);
  }
  return NextResponse.redirect(data.url);
}
