import { createServerClient, type CookieOptions } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";
import { getSupabaseEnv } from "@/app/lib/supabase/safe";

// URLs that should return 410 Gone (crawler errors, never existed)
const GONE_URLS = [
  "/blog/themeContext",
  "/blog/README.template.md",
  "/blog/greeting",
  "/blog/m",
  "/blog/hello-world!",
];

export async function middleware(request: NextRequest) {
  const pathname = request.nextUrl.pathname;

  // Return 410 Gone for URLs that never existed (tells Google to stop crawling)
  if (GONE_URLS.includes(pathname)) {
    return new NextResponse("Gone", { status: 410 });
  }

  let response = NextResponse.next({
    request: {
      headers: request.headers,
    },
  });

  const supabaseEnv = getSupabaseEnv();

  // When Supabase is not configured (local sandbox/CI), skip auth entirely.
  // Public pages render with fallback content; admin pages stay behind login.
  if (!supabaseEnv) {
    if (pathname.startsWith("/admin") && !pathname.startsWith("/admin/login")) {
      return NextResponse.redirect(new URL("/admin/login", request.url));
    }
    return response;
  }

  const supabase = createServerClient(
    supabaseEnv.url,
    supabaseEnv.anonKey,
    {
      cookies: {
        get(name: string) {
          return request.cookies.get(name)?.value;
        },
        set(name: string, value: string, options: CookieOptions) {
          request.cookies.set({
            name,
            value,
            ...options,
          });
          response = NextResponse.next({
            request: {
              headers: request.headers,
            },
          });
          response.cookies.set({
            name,
            value,
            ...options,
          });
        },
        remove(name: string, options: CookieOptions) {
          request.cookies.set({
            name,
            value: "",
            ...options,
          });
          response = NextResponse.next({
            request: {
              headers: request.headers,
            },
          });
          response.cookies.set({
            name,
            value: "",
            ...options,
          });
        },
      },
    },
  );

  const { data: { user } } = await supabase.auth.getUser();

  // Admin route protection
  if (pathname.startsWith("/admin") && !pathname.startsWith("/admin/login")) {
    if (!user) {
      return NextResponse.redirect(new URL("/admin/login", request.url));
    }
    
    // Check if ADMIN_EMAIL is set and matches
    const adminEmail = process.env.ADMIN_EMAIL;
    if (adminEmail && user.email !== adminEmail) {
      return NextResponse.redirect(new URL("/", request.url));
    }
  }

  // Redirect authenticated users away from login page
  if (pathname.startsWith("/admin/login") && user) {
    return NextResponse.redirect(new URL("/admin", request.url));
  }

  return response;
}

export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     * Feel free to modify this pattern to include more paths.
     */
    "/((?!_next/static|_next/image|favicon.ico).*)",
  ],
};
