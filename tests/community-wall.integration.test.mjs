import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";

const baseUrl = process.env.COMMUNITY_WALL_BASE_URL || "http://localhost:3000";

test("Community Wall renders managed production states", async () => {
  const response = await fetch(`${baseUrl}/community-wall`);
  assert.equal(response.status, 200);
  const html = await response.text();
  assert.match(html, /The wall remembers/i);
  assert.match(html, /Community notes|Visitor notes/i);
  assert.match(html, /Write a message/i);
  assert.match(html, /Available for opportunities/i);
  assert.doesNotMatch(html, /Community Wall route error/i);
});

test("Community Wall moderation API is fail-closed and the per-page settings API is retired", async () => {
  for (const method of ["GET", "PATCH", "DELETE"]) {
    const response = await fetch(`${baseUrl}/api/admin/community-wall`, { method });
    assert.equal(response.status, 401, `${method} should require Admin authorization`);
  }
  for (const method of ["GET", "PUT"]) {
    const response = await fetch(`${baseUrl}/api/admin/community-wall/settings`, { method });
    assert.equal(response.status, 404, `${method} retired settings API should not exist`);
  }
});

test("Community Wall source enforces moderation, bounded reads, and static page copy", async () => {
  const [page, entry, avatar, scallop, data, action, migration, adminApi, adminPage, redirect, loading, error] = await Promise.all([
    readFile(new URL("../app/community-wall/page.tsx", import.meta.url), "utf8"),
    readFile(new URL("../app/components/guestbook/GuestbookEntryCard.tsx", import.meta.url), "utf8"),
    readFile(new URL("../app/components/guestbook/CommunityWallAvatar.tsx", import.meta.url), "utf8"),
    readFile(new URL("../app/components/guestbook/ScallopDivider.tsx", import.meta.url), "utf8"),
    readFile(new URL("../app/community-wall/data.ts", import.meta.url), "utf8"),
    readFile(new URL("../app/community-wall/actions.ts", import.meta.url), "utf8"),
    readFile(new URL("../migrations/2026_community_wall_messages.sql", import.meta.url), "utf8"),
    readFile(new URL("../app/api/admin/community-wall/route.ts", import.meta.url), "utf8"),
    readFile(new URL("../app/admin/(dashboard)/community-wall/page.tsx", import.meta.url), "utf8"),
    readFile(new URL("../app/admin/(dashboard)/community-wall/settings/page.tsx", import.meta.url), "utf8"),
    readFile(new URL("../app/community-wall/loading.tsx", import.meta.url), "utf8"),
    readFile(new URL("../app/community-wall/error.tsx", import.meta.url), "utf8"),
  ]);

  assert.doesNotMatch(page, /<h1[^>]*>\s*<p/);
  assert.match(page, /PaperHeroTexture/);
  assert.match(page, /GuestbookEntryCard/);
  assert.match(entry, /aria-labelledby={`entry-\$\{id\}-title`}/);
  assert.equal((entry.match(/radial-gradient/g) || []).length, 24);
  assert.match(avatar, /profiles/);
  assert.match(avatar, /onError/);
  assert.match(data, /lh3\.googleusercontent\.com/);
  assert.doesNotMatch(data, /user-images\.githubusercontent\.com/);
  assert.match(entry, /-mt-px/);
  assert.match(scallop, /className="hidden dark:block"/);
  assert.match(scallop, /strokeWidth="0\.75"/);
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
  assert.match(migration, /already_submitted/);
  assert.match(migration, /community_wall_one_note_per_user_idx/);
  assert.match(migration, /patternindex BETWEEN 0 AND 23/);
  assert.match(action, /Math\.random\(\) \* 24/);
  assert.match(adminApi, /auth\.getUser\(\)/);
  assert.match(adminApi, /ADMIN_EMAIL/);
  assert.match(adminApi, /Community Wall note not found/);
  assert.match(data, /export const communityWallPageSettings/);
  assert.doesNotMatch(data, /public_community_wall_settings|fetchCommunityWallSettings/);
  assert.match(adminPage, /Pending review/);
  assert.match(adminPage, /CommunityWallModerationActions/);
  assert.match(adminPage, /\.range\(/);
  assert.doesNotMatch(adminPage, /Page settings|\/admin\/community-wall\/settings/);
  assert.match(redirect, /redirect\("\/admin\/community-wall"\)/);
  assert.match(loading, /Loading Community Wall/);
  assert.match(error, /role="alert"/);

  for (const field of ["kicker", "heading", "heading_accent", "description", "collection_label", "sign_in_title", "sign_in_description", "composer_title", "composer_description", "empty_title", "empty_description", "seo_title", "seo_description"]) {
    const pattern = new RegExp(field);
    assert.match(migration, pattern);
    assert.match(data, pattern);
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
  const google = await readFile(new URL("../app/auth/google/route.ts", import.meta.url), "utf8");
  assert.match(google, /provider: "google"/);
});
