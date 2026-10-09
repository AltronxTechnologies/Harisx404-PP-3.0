import { cookies } from "next/headers";
import { NextResponse } from "next/server";
import { type CookieOptions, createServerClient } from "@supabase/ssr";
import { getSupabaseEnv } from "@/app/lib/supabase/safe";

export async function GET(request: Request) {
  const { searchParams, origin } = new URL(request.url);
  const code = searchParams.get("code");
  const next = searchParams.get("next") ?? "/community-wall";
  const destination = next.startsWith("/") && !next.startsWith("//") && !next.includes("\\")
    ? new URL(next, origin)
    : new URL("/community-wall", origin);

  const env = getSupabaseEnv();
  if (code && env) {
    const cookieStore = await cookies();
    const supabase = createServerClient(
      env.url,
      env.anonKey,
      {
        cookies: {
          get(name: string) {
            return cookieStore.get(name)?.value ?? "";
          },
          set(name: string, value: string, options: CookieOptions) {
            cookieStore.set({ name, value, ...options });
          },
          remove(name: string, options: CookieOptions) {
            cookieStore.delete({ name, ...options });
          },
        },
      },
    );
    const { error } = await supabase.auth.exchangeCodeForSession(code);
    if (!error) {
      return NextResponse.redirect(destination.origin === origin ? destination : new URL("/community-wall", origin));
    }
  }

  // return the user to an error page with instructions
  return NextResponse.redirect(
    `${origin}/community-wall?auth=error`,
  );
}
