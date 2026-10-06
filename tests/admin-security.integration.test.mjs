import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";

const baseUrl = process.env.ADMIN_BASE_URL || "http://localhost:3000";
const source = (path) => readFile(new URL(`../${path}`, import.meta.url), "utf8");

test("anonymous callers cannot read unlocked Admin API endpoints", async () => {
  for (const path of ["settings", "faqs", "media"]) {
    const response = await fetch(`${baseUrl}/api/admin/${path}`);
    assert.equal(response.status, 401, `/api/admin/${path} should fail closed`);
  }
});

test("Admin settings use the observed singleton schema with a strict write boundary", async () => {
  const [route, auth, settingsMigration, logsMigration] = await Promise.all([
    source("app/api/admin/settings/route.ts"),
    source("app/lib/admin-auth.ts"),
    source("migrations/2026_admin_content_rls_hardening.sql"),
    source("migrations/2026_admin_system_logs_resolved.sql"),
  ]);
  assert.match(auth, /auth\.getUser\(\)/);
  assert.match(auth, /ADMIN_EMAIL\?\.trim\(\)\.toLowerCase\(\)/);
  assert.match(route, /\.select\(SETTINGS_COLUMNS\)\.limit\(2\)/);
  assert.match(route, /\.update\(parsed\.data\)[\s\S]*?\.eq\("id", result\.row\.id\)/);
  assert.match(route, /\}\)\.strict\(\)/);
  assert.doesNotMatch(route, /\.select\(['"]key, value['"]\)|onConflict: ['"]key['"]/);
  assert.match(settingsMigration, /DROP POLICY IF EXISTS "Authenticated users manage faqs"/);
  assert.match(settingsMigration, /DROP POLICY IF EXISTS "Authenticated users update site settings"/);
  assert.match(logsMigration, /ADD COLUMN IF NOT EXISTS resolved boolean NOT NULL DEFAULT false/);
});

test("Admin top analytics links include only live published articles", async () => {
  const stats = await source("app/lib/stats/server-stats.ts");
  assert.match(stats, /\.eq\("status", "published"\)\s*\.lte\("published_at", new Date\(\)\.toISOString\(\)\)/);
  assert.match(stats, /viewsData\s*\?\.filter\(\(item\) => livePosts\.has\(item\.slug\)\)/);
  assert.match(stats, /Object\.entries\(reactionsPerArticle\)\s*\.filter\(\(\[slug\]\) => livePosts\.has\(slug\)\)/);
  assert.match(stats, /const totalViews\s*=/);
  assert.match(stats, /const totalReactions\s*=/);
});

test("Analytics reflects the public published collection and explains missing scores", async () => {
  const [page, stats, theme] = await Promise.all([
    source("app/admin/(dashboard)/analytics/page.tsx"),
    source("app/lib/stats/build-time-stats.ts"),
    source("app/admin/admin-theme.css"),
  ]);
  assert.match(stats, /fetchBlogIndexPosts\(\)/);
  assert.doesNotMatch(stats, /fetchAndSortBlogPosts/);
  assert.match(page, /target="_blank" rel="noopener noreferrer"/);
  assert.match(page, /data-admin-analytics/);
  assert.match(page, /PageSpeed scores are unavailable in the sandbox preview/);
  assert.match(page, /export const maxDuration = 60/);
  assert.match(page, /<Suspense fallback=/);
  assert.match(page, /<LighthouseHealth \/>/);
  assert.match(page, /score != null && <span className="text-xs font-normal text-ink-secondary"> \/ 100<\/span>/);
  assert.match(page, /role="img" aria-label=\{`\$\{share\}% of top five \$\{unit\}`\}/);
  assert.match(page, /ownerSignals\.map/);
  assert.match(page, /\.from\("messages"\).*?\.eq\("status", "pending"\)/);
  assert.match(page, /\.from\("faqs"\).*?\.eq\("is_visible", true\)/);
  assert.match(page, /\.from\("media"\).*?head: true/);
  assert.match(theme, /\[data-admin-analytics\] a\[href\^="\/blog\/"\]:focus-visible/);
  assert.match(page, /Owner signals/);
  assert.match(page, /share of the five articles listed/);
  assert.match(page, /categoryBreakdown\.slice\(0, 5\)/);
  assert.match(page, /categoryBreakdown\.slice\(5\)/);
  assert.match(page, /<details className="group">/);
  assert.match(page, /Show fewer categories/);
  for (const table of ["blog_posts", "projects", "messages", "faqs", "media"]) assert.match(page, new RegExp(`\\.from\\("${table}"\\)`));
});

test("Admin-only theme and collapsible navigation share the public design tokens", async () => {
  const [theme, layout, sidebar] = await Promise.all([
    source("app/admin/admin-theme.css"),
    source("app/admin/(dashboard)/layout.tsx"),
    source("app/components/admin/Sidebar.tsx"),
  ]);
  assert.match(theme, /\[data-admin-root\]/);
  assert.match(theme, /\[data-admin-root\]\.dark/);
  assert.match(theme, /--admin-canvas: #0d0d0f/);
  assert.match(theme, /--admin-ink: #fafafa/);
  assert.match(theme, /--admin-line: #34343b/);
  assert.match(theme, /\.admin-dashboard:has\(\.admin-sidebar\[data-admin-sidebar="collapsed"\]\) \.admin-content \{ padding-left: 5rem/);
  assert.match(layout, /admin-dashboard/);
  assert.match(layout, /admin-content/);
  assert.match(sidebar, /admin-sidebar-collapsed/);
  assert.match(sidebar, /aria-label="Collapse navigation"/);
  assert.match(sidebar, /aria-label="Expand navigation"/);
  assert.match(sidebar, /width: collapsed \? 80 : 256/);
});

test("Dashboard uses the site logo and the requested action/recent layout", async () => {
  const [dashboard, sidebar, theme] = await Promise.all([
    source("app/admin/(dashboard)/page.tsx"),
    source("app/components/admin/Sidebar.tsx"),
    source("app/admin/admin-theme.css"),
  ]);
  assert.equal((sidebar.match(/src="\/brand\/harisx404 white transparent\.png"/g) || []).length, 2);
  assert.doesNotMatch(sidebar, />\s*H\s*</);
  assert.match(sidebar, /admin-sidebar-scroll flex-1 overflow-y-auto/);
  assert.match(theme, /\.admin-sidebar-scroll::-webkit-scrollbar/);
  assert.match(theme, /scrollbar-width: none/);
  assert.match(dashboard, /data-admin-dashboard-actions[^>]*>[\s\S]*?className="grid grid-cols-1 gap-2 p-4 md:grid-cols-2 lg:grid-cols-3"/);
  assert.match(dashboard, /data-admin-dashboard-recent className="grid min-w-0 grid-cols-\[minmax\(0,1fr\)\] gap-6 xl:grid-cols-2"/);
  assert.doesNotMatch(dashboard, /xl:col-span-2/);
  assert.match(sidebar, /section: "Overview"/);
  assert.match(sidebar, /section: "Content"/);
  assert.match(sidebar, /section: "Operations"/);
  assert.match(dashboard, /data-admin-dashboard-actions/);
  assert.match(dashboard, /data-admin-dashboard-recent/);
  assert.match(dashboard, /admin-status--live/);
  assert.match(dashboard, /admin-status--pending/);
  assert.match(dashboard, /flex flex-col gap-2 px-6 py-3 sm:flex-row/);
  assert.match(theme, /html:has\(\[data-admin-root\]\)::-webkit-scrollbar-thumb/);
  assert.match(theme, /--admin-divider: #303036/);
  assert.match(theme, /\[data-admin-dashboard-overview\] a\.group:hover/);
  assert.match(theme, /\[data-admin-dashboard-actions\] a:focus-visible/);
  assert.match(theme, /\[data-admin-dashboard-recent\] a:hover/);
  assert.match(theme, /prefers-reduced-motion: reduce/);
  assert.match(dashboard, /inline-flex min-h-11 items-center gap-1 rounded-lg px-2/);
});

test("Admin editors and mobile lists keep labelled controls and reachable actions", async () => {
  const [project, theme, editor, media] = await Promise.all([
    source("app/components/admin/ProjectForm.tsx"),
    source("app/admin/admin-theme.css"),
    source("app/components/admin/TiptapEditor.tsx"),
    source("app/components/admin/MediaPickerModal.tsx"),
  ]);
  for (const field of ["title", "slug", "description", "tagline", "category", "tech-stack", "latest-update", "tags", "features", "status", "start-date", "end-date"]) {
    if (field === "status") {
      assert.match(project, /<BuildlogSelect id="project-status" label="Publication status"/);
    } else {
      assert.match(project, new RegExp(`htmlFor="project-${field}"`));
      assert.match(project, new RegExp(`id="project-${field}"`));
    }
  }
  assert.match(project, /<BuildlogSelect id="project-stage" label="Development stage"/);
  assert.match(editor, /"aria-label": label/);
  assert.match(theme, /\.ProseMirror:focus-visible/);
  assert.match(theme, /\.admin-action-table \{ min-width: 680px/);
  assert.match(media, /sm:min-h-80/);
  for (const path of ["blogs", "projects", "faqs", "experience", "certifications", "testimonials"]) {
    const page = await source(`app/admin/(dashboard)/${path}/page.tsx`);
    assert.match(page, /admin-action-table/);
    assert.match(page, /role="region"[^>]*tabIndex=\{0\}/);
  }
});

test("unlocked privileged reads and log actions check Admin identity before service access", async () => {
  for (const path of [
    "app/admin/(dashboard)/page.tsx",
    "app/admin/(dashboard)/blogs/page.tsx",
    "app/admin/(dashboard)/analytics/page.tsx",
    "app/admin/(dashboard)/projects/page.tsx",
    "app/admin/(dashboard)/logs/page.tsx",
    "app/api/admin/faqs/route.ts",
    "app/api/admin/media/route.ts",
    "app/api/admin/experience/route.ts",
  ]) {
    const text = await source(path);
    assert.match(text, /requireAdmin\(\)/, `${path} verifies Admin identity`);
    assert.ok(text.indexOf("requireAdmin()") < text.indexOf("createSupabaseAdminClient()") || !text.includes("createSupabaseAdminClient()"), `${path} verifies identity before creating service-role client`);
  }
  const actions = await source("app/admin/(dashboard)/logs/actions.ts");
  for (const name of ["resolveLog", "clearAllResolvedLogs", "testErrorLogger"]) {
    assert.match(actions, new RegExp(`function ${name}\\([^]*?const auth = await requireAdmin\\(\\);[^]*?if \\(auth\\.response\\) return`));
  }
  const faq = await source("app/api/admin/faqs/route.ts");
  assert.match(faq, /faqSchema = z\.object\([\s\S]*?\)\.strict\(\)/);
  const projectList = await source("app/admin/(dashboard)/projects/page.tsx");
  assert.match(projectList, /createSupabaseAdminClient\(\)/);
  assert.match(projectList, /Projects could not be loaded/);
  assert.match(projectList, /flex flex-wrap items-center justify-between gap-4/);
  assert.match(projectList, /<DeleteProjectButton id=\{project\.id\} name=\{project\.title\} slug=\{project\.slug\} updatedAt=\{project\.updated_at\} \/>/);
  const projectDelete = await source("app/components/admin/DeleteProjectButton.tsx");
  assert.match(projectDelete, /aria-label=\{`Delete \$\{name\}`\}/);
  assert.match(projectDelete, /inline-flex size-11 items-center justify-center/);
  const blogList = await source("app/admin/(dashboard)/blogs/page.tsx");
  const blogFilters = await source("app/components/admin/BlogFilters.tsx");
  const blogActions = await source("app/admin/(dashboard)/blogs/BlogArchiveAction.tsx");
  assert.match(blogList, /flex flex-wrap items-center justify-between gap-4/);
  assert.match(blogList, /<BlogFilters /);
  assert.match(blogFilters, /id="blog-search"[^\n]*className="min-h-11/);
  assert.match(blogActions, /aria-label=\{`\$\{archived \? "Restore" : "Archive"\} \$\{post\.title\}`\}/);
  assert.match(blogActions, /inline-flex size-11 items-center justify-center/);
});

test("Experience API verifies Admin identity before every read and service-role write", async () => {
  const route = await source("app/api/admin/experience/route.ts");
  assert.equal((route.match(/const auth = await requireAdmin\(\);/g) || []).length, 4);
  assert.equal((route.match(/if \(auth\.response\) return auth\.response;/g) || []).length, 4);
  assert.doesNotMatch(route, /auth\.getSession\(\)/);
  for (const handler of ["POST", "PUT", "DELETE"]) {
    const body = route.slice(route.indexOf(`export async function ${handler}(`));
    assert.ok(body.indexOf("if (auth.response) return auth.response;") < body.indexOf("createSupabaseAdminClient()"), `${handler} must authorize before service role`);
  }
  for (const method of ["GET", "POST", "PUT", "DELETE"]) {
    const response = await fetch(`${baseUrl}/api/admin/experience`, { method });
    assert.equal(response.status, 401, `${method} must deny anonymous callers before data or payload processing`);
  }
});

test("locked-scope Admin form labels and Edit links use the owner-approved accessible names", async () => {
  const [testimonialForm, experienceForm, testimonials, experience] = await Promise.all([
    source("app/components/admin/TestimonialForm.tsx"),
    source("app/components/admin/ExperienceForm.tsx"),
    source("app/admin/(dashboard)/testimonials/page.tsx"),
    source("app/admin/(dashboard)/experience/page.tsx"),
  ]);
  for (const field of ["headline", "quote", "name", "role", "avatar-url", "display-order", "status"]) {
    if (field === "status") {
      assert.match(testimonialForm, /<BuildlogSelect id="testimonial-status" label="Visibility"/);
    } else {
      assert.match(testimonialForm, new RegExp(`htmlFor="testimonial-${field}"`));
      assert.match(testimonialForm, new RegExp(`id="testimonial-${field}"`));
    }
  }
  for (const field of ["role", "company", "logo-url", "location", "location-type", "employment-type", "start-month", "start-year", "end-month", "end-year", "summary", "highlights", "display-order", "status"]) {
    if (["status", "location-type", "employment-type", "start-month", "end-month"].includes(field)) {
      assert.match(experienceForm, new RegExp(`<BuildlogSelect id="experience-${field}" label="`));
    } else {
      assert.match(experienceForm, new RegExp(`htmlFor="experience-${field}"`));
      assert.match(experienceForm, new RegExp(`id="experience-${field}"`));
    }
  }
  assert.equal((testimonials.match(/aria-label=\{`Edit testimonial from \$\{t\.name\}: \$\{t\.headline\}`\}/g) || []).length, 3);
  assert.match(experience, /aria-label=\{`Edit experience entry: \$\{entry\.role \|\| entry\.company \|\| "Untitled"\}`\}/);
});

test("Media library uses the connected row fields and keeps errors distinct from an empty library", async () => {
  const [mediaPage, mediaApi] = await Promise.all([
    source("app/admin/(dashboard)/media/page.tsx"),
    source("app/api/admin/media/route.ts"),
  ]);
  assert.doesNotMatch(mediaPage, /formatBytes\(item\.bytes\)|Edit description|Open image/);
  assert.match(mediaPage, /item\.original_filename \|\| item\.alt_text/);
  assert.match(mediaPage, /if \(!res\.ok \|\| !Array\.isArray\(result\.data\)/);
  assert.match(mediaPage, /loadFailed \? <div role="alert"/);
  assert.match(mediaPage, /aria-label=\{`Copy link for \$\{name\}`\}/);
  assert.match(mediaPage, /grid min-w-0 gap-4 sm:grid-cols-2 md:grid-cols-3 xl:grid-cols-4/);
  assert.doesNotMatch(mediaPage, /formatBytes\(item\.size\)/);
  assert.match(mediaApi, /const limit = Math\.min\(requestedLimit, 100\)/);
});

test("Media deletion checks protected references before Cloudinary and fails closed", async () => {
  const [route, guard, page] = await Promise.all([
    source("app/api/admin/media/route.ts"),
    source("app/lib/admin/delete-media.ts"),
    source("app/admin/(dashboard)/media/page.tsx"),
  ]);
  assert.match(route, /export async function DELETE\(request: Request\)/);
  assert.match(route, /const auth = await requireAdmin\(\);[\s\S]*?deleteManagedMedia\(await createSupabaseAdminClient\(\), id!, detachPostId\)/);
  for (const field of ["cover_image_id", "og_image_id", "media_id", "cover_image_url", "content"]) {
    assert.match(guard, new RegExp(field));
  }
  assert.ok(guard.indexOf('db.from("media").delete()') < guard.indexOf("cloudinary.uploader.destroy"));
  assert.match(guard, /db\.from\("media"\)\.insert\(item\)/);
  assert.match(page, /aria-label=\{`Delete \$\{name\}`\}/);
  assert.match(page, /Image deleted from the library and Cloudinary/);
  const anonymous = await fetch(`${baseUrl}/api/admin/media?id=00000000-0000-4000-8000-000000000001`, { method: "DELETE" });
  assert.equal(anonymous.status, 401);
});

test("Legacy Changelog Admin routes retire safely and Logs controls fit phones", async () => {
  const [legacy, sidebar, logs, redirects] = await Promise.all([
    source("app/admin/(dashboard)/changelogs/[[...slug]]/page.tsx"),
    source("app/components/admin/Sidebar.tsx"),
    source("app/admin/(dashboard)/logs/client.tsx"),
    source("next.config.mjs"),
  ]);
  assert.match(legacy, /redirect\("\/admin\/buildlog"\)/);
  assert.doesNotMatch(sidebar, /href: "\/admin\/changelogs"/);
  assert.match(redirects, /source: "\/changelog"[\s\S]*?destination: "\/buildlog"/);
  assert.match(logs, /flex min-w-0 flex-col gap-3 lg:flex-row/);
  assert.match(logs, /style=\{\{ overflowWrap: "anywhere" \}\}/);
  for (const path of ["changelogs", "changelogs/new", "changelogs/example-id"]) {
    const response = await fetch(`${baseUrl}/admin/${path}`, { redirect: "manual" });
    assert.equal(response.status, 307);
    assert.equal(new URL(response.headers.get("location"), baseUrl).pathname, "/admin/login");
  }
  for (const method of ["GET", "POST", "PUT", "DELETE"]) {
    const response = await fetch(`${baseUrl}/api/admin/changelogs`, { method });
    assert.equal(response.status, 404, `retired ${method} endpoint must not accept writes`);
  }
});

test("FAQ list does not claim a failed read means the table is missing or visibility is enabled", async () => {
  const page = await source("app/admin/(dashboard)/faqs/page.tsx");
  assert.match(page, /error: settingError/);
  assert.match(page, /\{\(settingError \|\| !setting\) \? \(/);
  assert.match(page, /\{faqsError \? \(/);
  assert.match(page, /aria-label=\{`Edit \$\{faq\.question\}`\}/);
  assert.doesNotMatch(page, /The <code className="font-mono">faqs<\/code> table doesn/);
});

test("Settings editor keeps labelled, usable controls in the Admin visual language", async () => {
  const page = await source("app/admin/(dashboard)/settings/page.tsx");
  for (const field of ["site_name", "seo_description", "seo_keywords", "github_url", "twitter_url", "linkedin_url", "email_address"]) {
    assert.match(page, new RegExp(`htmlFor="${field}"`));
    assert.match(page, new RegExp(`id="${field}"`));
  }
  assert.match(page, /rounded-2xl border border-border-primary bg-white p-6 dark:bg-white\/\[0\.03\]/);
  assert.match(page, /min-h-11 w-full rounded-xl border border-border-primary bg-bg-primary/);
  assert.match(page, /inline-flex min-h-11 items-center justify-center rounded-full bg-text-primary/);
});

test("Admin Buildlog uses contained mobile cards and keeps the desktop table", async () => {
  const [page, button, form] = await Promise.all([
    source("app/admin/(dashboard)/buildlog/page.tsx"),
    source("app/components/admin/DeleteBuildlogButton.tsx"),
    source("app/components/admin/BuildlogForm.tsx"),
  ]);
  assert.match(page, /grid min-w-0 gap-3 xl:hidden/);
  assert.match(page, /hidden overflow-hidden rounded-xl[^\n]*xl:block/);
  assert.match(page, /<article key=\{project\.id\} className="min-w-0/);
  assert.match(page, /<dl className=/);
  assert.match(page, /aria-label=\{`Edit \$\{project\.name\}`\} className="inline-flex size-11/);
  assert.match(button, /aria-label=\{`Delete \$\{name\}`\} className="inline-flex size-11/);
  assert.match(form, /grid gap-6 md:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-5/);
});

test("unlocked Admin presentation keeps narrow content contained and controls named", async () => {
  const [layout, dashboard, sidebar] = await Promise.all([
    source("app/admin/(dashboard)/layout.tsx"),
    source("app/admin/(dashboard)/page.tsx"),
    source("app/components/admin/Sidebar.tsx"),
  ]);
  assert.match(layout, /gridTemplateColumns: "minmax\(0, 1fr\)"/);
  assert.match(dashboard, /grid-cols-\[minmax\(0,1fr\)\]/);
  assert.match(dashboard, /md:grid-cols-2 xl:grid-cols-3/);
  assert.match(dashboard, /<p className="truncate text-sm font-medium text-text-primary">\{project\.title\}<\/p>/);
  assert.match(dashboard, /flex shrink-0 items-center gap-2 sm:ml-3/);
  assert.match(dashboard, /aria-label=\{`Edit \$\{project\.title\}`\}/);
  assert.match(sidebar, /aria-current=\{active \? "page" : undefined\}/);
  assert.match(sidebar, /min-h-11/);
  assert.doesNotMatch(sidebar, /href: "\/admin\/about"/);
});

test("Admin login is private and the unlocked routes retain their URLs", async () => {
  const login = await fetch(`${baseUrl}/admin/login`);
  assert.equal(login.status, 200);
  assert.match(await login.text(), /<meta name="robots" content="noindex, nofollow"/);
  for (const path of ["media", "settings", "blogs", "analytics"]) {
    const response = await fetch(`${baseUrl}/admin/${path}`, { redirect: "manual" });
    assert.equal(response.status, 307);
    assert.equal(new URL(response.headers.get("location"), baseUrl).pathname, "/admin/login");
  }
});

test("retired Admin About API is unavailable while public About remains", async () => {
  for (const method of ["GET", "PUT"]) {
    const response = await fetch(`${baseUrl}/api/admin/about`, { method });
    assert.equal(response.status, 404, `retired ${method} endpoint must not accept writes`);
  }
  const response = await fetch(`${baseUrl}/about`);
  assert.equal(response.status, 200);
});
