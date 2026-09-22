import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";

const baseUrl = process.env.COMMUNITY_WALL_BASE_URL || "http://localhost:3000";

test("Community Wall renders managed production states", async () => {
  const response = await fetch(`${baseUrl}/community-wall`);
  assert.equal(response.status, 200);
  const html = await response.text();
  assert.match(html, /The wall remembers/i);
  assert.match(html, /Visitor notes/i);
  assert.match(html, /Write a message/i);
  assert.match(html, /Available for opportunities/i);
  assert.doesNotMatch(html, /Community Wall route error/i);
});

test("Community Wall moderation and settings APIs are fail-closed", async () => {
  for (const method of ["GET", "PATCH", "DELETE"]) {
    const response = await fetch(`${baseUrl}/api/admin/community-wall`, { method });
    assert.equal(response.status, 401, `${method} should require Admin authorization`);
  }
  for (const method of ["GET", "PUT"]) {
    const response = await fetch(`${baseUrl}/api/admin/community-wall/settings`, { method });
    assert.equal(response.status, 401, `${method} settings should require Admin authorization`);
  }
});

test("Community Wall source enforces moderation, bounded reads, and managed copy", async () => {
  const [page, data, action, migration, adminApi, settingsApi, adminPage, form, loading, error] = await Promise.all([
    readFile(new URL("../app/community-wall/page.tsx", import.meta.url), "utf8"),
    readFile(new URL("../app/community-wall/data.ts", import.meta.url), "utf8"),
    readFile(new URL("../app/community-wall/actions.ts", import.meta.url), "utf8"),
    readFile(new URL("../migrations/2026_community_wall_messages.sql", import.meta.url), "utf8"),
    readFile(new URL("../app/api/admin/community-wall/route.ts", import.meta.url), "utf8"),
    readFile(new URL("../app/api/admin/community-wall/settings/route.ts", import.meta.url), "utf8"),
    readFile(new URL("../app/admin/(dashboard)/community-wall/page.tsx", import.meta.url), "utf8"),
    readFile(new URL("../app/components/admin/CommunityWallSettingsForm.tsx", import.meta.url), "utf8"),
    readFile(new URL("../app/community-wall/loading.tsx", import.meta.url), "utf8"),
    readFile(new URL("../app/community-wall/error.tsx", import.meta.url), "utf8"),
  ]);

  assert.doesNotMatch(page, /<h1[^>]*>\s*<p/);
  assert.match(page, /PaperHeroTexture/);
  assert.match(page, /COMMUNITY_WALL_PAGE_SIZE/);
  assert.match(data, /public_community_wall_messages/);
  assert.match(data, /\.range\(start, end\)/);
  assert.match(action, /submit_community_wall_message/);
  assert.match(action, /createSupabaseAdminClient/);
  assert.match(migration, /REVOKE ALL ON TABLE public\.messages FROM anon, authenticated/);
  assert.match(migration, /WHERE status = 'published'/);
  assert.match(migration, /community_wall_message_length/);
  assert.match(migration, /community_wall_user_rate_idx/);
  assert.match(migration, /pg_advisory_xact_lock/);
  assert.match(migration, /recent_count >= 3/);
  assert.match(migration, /interval '60 seconds'/);
  assert.match(adminApi, /auth\.getUser\(\)/);
  assert.match(adminApi, /ADMIN_EMAIL/);
  assert.match(adminApi, /Community Wall note not found/);
  assert.match(settingsApi, /community_wall_settings/);
  assert.match(adminPage, /Pending review/);
  assert.match(adminPage, /CommunityWallModerationActions/);
  assert.match(adminPage, /\.range\(/);
  assert.match(loading, /Loading Community Wall/);
  assert.match(error, /role="alert"/);

  for (const field of ["kicker", "heading", "heading_accent", "description", "collection_label", "sign_in_title", "sign_in_description", "composer_title", "composer_description", "empty_title", "empty_description", "seo_title", "seo_description"]) {
    const pattern = new RegExp(field);
    assert.match(migration, pattern);
    assert.match(data, pattern);
    assert.match(settingsApi, pattern);
    assert.match(form, pattern);
  }
});

test("disconnected legacy Community Wall implementation is removed", async () => {
  const sidebar = await readFile(new URL("../app/components/admin/Sidebar.tsx", import.meta.url), "utf8");
  const callback = await readFile(new URL("../app/auth/callback/route.ts", import.meta.url), "utf8");
  assert.match(sidebar, /\/admin\/community-wall/);
  assert.match(callback, /\/community-wall\?auth=error/);
  assert.doesNotMatch(callback, /\/login\?message/);
  const github = await readFile(new URL("../app/auth/github/route.ts", import.meta.url), "utf8");
  assert.match(github, /signInWithOAuth/);
  assert.match(github, /provider: "github"/);
});
