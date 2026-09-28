import { createServerClient, type CookieOptions } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";
import { getSupabaseEnv } from "@/app/lib/supabase/safe";
import { fallbackProjects } from "@/app/data/fallback-home";

// URLs that should return 410 Gone (crawler errors, never existed)
const GONE_URLS = [
  "/blog/themeContext",
  "/blog/README.template.md",
  "/blog/greeting",
  "/blog/m",
  "/blog/hello-world!",
];

function projectStatusPage(status: 404 | 503, request: NextRequest) {
  return NextResponse.rewrite(new URL(status === 404 ? "/__missing_project" : "/project-data-unavailable", request.url), {
    status,
    headers: { "X-Robots-Tag": "noindex, nofollow", "Cache-Control": "no-store" },
  });
}

export async function middleware(request: NextRequest) {
  const pathname = request.nextUrl.pathname;
  const projectPath = /^\/projects\/([^/]+)\/?$/.exec(pathname);
  // Next strips RSC headers and _rsc before middleware. Browser RSC fetches
  // retain their Fetch Metadata headers and must reach the route boundary.
  const projectDocument = projectPath && (request.method === "GET" || request.method === "HEAD")
    && !(request.headers.get("sec-fetch-dest") === "empty" && request.headers.get("sec-fetch-mode") === "cors");
  let projectSlug = projectPath?.[1] ?? "";
  if (projectDocument) {
    try {
      projectSlug = decodeURIComponent(projectSlug);
    } catch {
      return projectStatusPage(404, request);
    }
  }

  // Return 410 Gone for URLs that never existed (tells Google to stop crawling)
  if (GONE_URLS.includes(pathname)) {
    return new NextResponse("Gone", { status: 410 });
  }

  // The legacy public PDF must obey the managed Resume's deletion state too.
  if (pathname === "/muhammad-haris-resume.pdf") {
    return NextResponse.redirect(new URL("/resume/file", request.url));
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
    if (projectDocument) {
      if (process.env.NODE_ENV === "production") return projectStatusPage(503, request);
      if (!fallbackProjects.some((project) => project.slug === projectSlug)) {
        return projectStatusPage(404, request);
      }
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
    
    // Fail closed unless the verified user matches the configured administrator.
    const adminEmail = process.env.ADMIN_EMAIL?.trim().toLowerCase();
    if (!adminEmail || user.email?.toLowerCase() !== adminEmail) {
      return NextResponse.redirect(new URL("/", request.url));
    }
  }

  // Redirect authenticated users away from login page
  if (pathname.startsWith("/admin/login") && user) {
    return NextResponse.redirect(new URL("/admin", request.url));
  }

  if (projectDocument) {
    // Public RLS permits published projects; do not use the service-role key here.
    try {
      const { data, error } = await supabase
        .from("projects")
        .select("slug")
        .eq("slug", projectSlug)
        .eq("status", "published")
        .maybeSingle();
      if (error) throw error;
      if (!data) return projectStatusPage(404, request);
    } catch (error) {
      console.error("Project preflight failed", error);
      return projectStatusPage(503, request);
    }
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
