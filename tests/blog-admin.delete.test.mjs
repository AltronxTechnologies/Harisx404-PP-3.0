import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";

const baseUrl = process.env.BLOG_BASE_URL || "http://localhost:3000";

test("permanent delete authenticates before parsing or changing a post", async () => {
  for (const body of ["not json", JSON.stringify({
    id: "00000000-0000-4000-8000-000000000000",
    updated_at: "2026-01-01T00:00:00Z",
    confirm_slug: "example",
  })]) {
    const response = await fetch(`${baseUrl}/api/admin/blogs`, {
      method: "DELETE",
      headers: { "Content-Type": "application/json" },
      body,
    });
    assert.equal(response.status, 401);
  }
});

test("archived delete requires exact slug and a guarded service-role transaction", async () => {
  const [api, action, sql] = await Promise.all([
    readFile(new URL("../app/api/admin/blogs/route.ts", import.meta.url), "utf8"),
    readFile(new URL("../app/admin/(dashboard)/blogs/BlogArchiveAction.tsx", import.meta.url), "utf8"),
    readFile(new URL("../migrations/2026_blog_editor_delete_slug_history.sql", import.meta.url), "utf8"),
  ]);
  const deletion = api.slice(api.indexOf("export async function DELETE"));
  assert.ok(deletion.indexOf("await authorizeAdmin()") < deletion.indexOf("request.json()"));
  assert.match(deletion, /confirm_slug !== post\.slug/);
  assert.match(deletion, /admin\.rpc\("delete_archived_blog_post"/);
  assert.match(deletion, /blogImageUrls\(post\.content/);
  assert.match(deletion, /\.from\("blog_post_media"\)/);
  assert.match(deletion, /cover_image_id, og_image_id, cover_image_url/);
  assert.ok(deletion.indexOf('admin.rpc("delete_archived_blog_post"') < deletion.indexOf("deleteManagedMedia(admin, mediaId)"));
  assert.match(deletion, /cleanup_warning: \{ failed_count: failedCount/);
  assert.match(action, /confirmText=\{dialog === "delete" \? post\.slug : undefined\}/);
  assert.doesNotMatch(action, /window\.prompt\(/);
  assert.match(action, /confirmation !== post\.slug/);
  assert.match(action, /method: "DELETE"/);
  assert.match(action, /\{archived && \(/);
  assert.match(sql, /target\.status <> 'archived'/);
  assert.match(sql, /target\.updated_at IS DISTINCT FROM p_expected_updated_at/);
  assert.match(sql, /DELETE FROM public\.article_views/);
  assert.match(sql, /ON DELETE SET NULL/);
  assert.doesNotMatch(sql, /DELETE FROM public\.(?:tags|media)\b/);
});
