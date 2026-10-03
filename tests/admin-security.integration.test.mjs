import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";

const baseUrl = process.env.ADMIN_BASE_URL || "http://localhost:3000";
const source = (path) => readFile(new URL(`../${path}`, import.meta.url), "utf8");

test("anonymous callers cannot read unlocked Admin API endpoints", async () => {
  for (const path of ["settings", "about", "faqs", "changelogs", "media"]) {
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

test("unlocked privileged reads and log actions check Admin identity before service access", async () => {
  for (const path of [
    "app/admin/(dashboard)/page.tsx",
    "app/admin/(dashboard)/projects/page.tsx",
    "app/admin/(dashboard)/logs/page.tsx",
    "app/api/admin/faqs/route.ts",
    "app/api/admin/about/route.ts",
    "app/api/admin/media/route.ts",
    "app/api/admin/changelogs/route.ts",
  ]) {
    const text = await source(path);
    assert.match(text, /requireAdmin\(\)/, `${path} verifies Admin identity`);
  }
  const actions = await source("app/admin/(dashboard)/logs/actions.ts");
  for (const name of ["resolveLog", "clearAllResolvedLogs", "testErrorLogger"]) {
    assert.match(actions, new RegExp(`function ${name}\\([^]*?const auth = await requireAdmin\\(\\);[^]*?if \\(auth\\.response\\) return`));
  }
  const faq = await source("app/api/admin/faqs/route.ts");
  assert.match(faq, /faqSchema = z\.object\([\s\S]*?\)\.strict\(\)/);
  const about = await source("app/api/admin/about/route.ts");
  assert.match(about, /aboutSchema = z\.object\([\s\S]*?\)\.partial\(\)\.strict\(\)/);
  const projectList = await source("app/admin/(dashboard)/projects/page.tsx");
  assert.match(projectList, /createSupabaseAdminClient\(\)/);
  assert.match(projectList, /Projects could not be loaded/);
});

test("Media library uses the connected row fields and keeps errors distinct from an empty library", async () => {
  const [mediaPage, mediaApi] = await Promise.all([
    source("app/admin/(dashboard)/media/page.tsx"),
    source("app/api/admin/media/route.ts"),
  ]);
  assert.match(mediaPage, /formatBytes\(item\.bytes\)/);
  assert.match(mediaPage, /item\.alt_text \|\| item\.public_id/);
  assert.match(mediaPage, /if \(!res\.ok\) throw new Error\("Media could not be loaded"\)/);
  assert.match(mediaPage, /\) : loadFailed \? \(/);
  assert.match(mediaPage, /aria-label=\{`Copy URL for/);
  assert.doesNotMatch(mediaPage, /item\.filename|formatBytes\(item\.size\)/);
  assert.match(mediaApi, /const limit = Math\.min\(requestedLimit, 100\)/);
});

test("unlocked Admin presentation keeps narrow content contained and controls named", async () => {
  const [layout, dashboard, sidebar, about, changelog] = await Promise.all([
    source("app/admin/(dashboard)/layout.tsx"),
    source("app/admin/(dashboard)/page.tsx"),
    source("app/components/admin/Sidebar.tsx"),
    source("app/admin/(dashboard)/about/page.tsx"),
    source("app/admin/(dashboard)/changelogs/page.tsx"),
  ]);
  assert.match(layout, /gridTemplateColumns: "minmax\(0, 1fr\)"/);
  assert.match(dashboard, /grid-cols-\[minmax\(0,1fr\)\]/);
  assert.match(dashboard, /md:grid-cols-2 xl:grid-cols-3/);
  assert.match(dashboard, /<p className="truncate text-sm font-medium text-text-primary">\{project\.title\}<\/p>/);
  assert.match(dashboard, /ml-3 flex shrink-0 items-center gap-2/);
  assert.match(dashboard, /aria-label=\{`Edit \$\{project\.title\}`\}/);
  assert.match(sidebar, /aria-current=\{active \? "page" : undefined\}/);
  assert.match(sidebar, /min-h-11/);
  assert.match(about, /htmlFor=\{`about-section-\$\{num\}-image`\}/);
  assert.match(changelog, /flex flex-wrap items-center justify-between gap-4/);
});

test("Admin login is private and the unlocked routes retain their URLs", async () => {
  const login = await fetch(`${baseUrl}/admin/login`);
  assert.equal(login.status, 200);
  assert.match(await login.text(), /<meta name="robots" content="noindex, nofollow"/);
  for (const path of ["about", "media", "settings"]) {
    const response = await fetch(`${baseUrl}/admin/${path}`, { redirect: "manual" });
    assert.equal(response.status, 307);
    assert.equal(new URL(response.headers.get("location"), baseUrl).pathname, "/admin/login");
  }
});
