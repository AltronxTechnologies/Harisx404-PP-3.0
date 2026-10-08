import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";

test("published slug aliases resolve only to live articles without redirect chains", async () => {
  const [middleware, page, migration, api] = await Promise.all([
    readFile(new URL("../middleware.ts", import.meta.url), "utf8"),
    readFile(new URL("../app/blog/[slug]/page.tsx", import.meta.url), "utf8"),
    readFile(new URL("../migrations/2026_blog_editor_delete_slug_history.sql", import.meta.url), "utf8"),
    readFile(new URL("../app/api/admin/blogs/route.ts", import.meta.url), "utf8"),
  ]);
  assert.match(middleware, /\.from\("blog_slug_history"\)/);
  assert.match(middleware, /status: 308/);
  assert.match(middleware, /status: 410/);
  assert.match(middleware, /\.eq\("id", history\.post_id\)[\s\S]*?\.eq\("status", "published"\)[\s\S]*?\.lte\("published_at"/);
  assert.match(page, /permanentRedirect\(`\/blog\/\$\{encodeURIComponent\(current\.slug\)\}`\)/);
  assert.match(migration, /CREATE TABLE IF NOT EXISTS public\.blog_slug_history/);
  assert.match(migration, /BLOG_SLUG_RESERVED/);
  assert.match(migration, /ON DELETE SET NULL/);
  assert.doesNotMatch(api.slice(api.indexOf("export async function DELETE")), /\.from\("blog_slug_history"\)\.delete\(/);
});
