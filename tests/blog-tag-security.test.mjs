import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";

test("Blog tag join migration gates public reads by post visibility and denies public writes", async () => {
  const [migration, base] = await Promise.all([
    readFile(new URL("../migrations/2026_blog_tag_join_rls.sql", import.meta.url), "utf8"),
    readFile(new URL("../supabase_schema.sql", import.meta.url), "utf8"),
  ]);
  for (const sql of [migration, base]) {
    assert.match(sql, /ALTER TABLE (?:public\.)?blog_post_tags ENABLE ROW LEVEL SECURITY/);
    assert.match(sql, /ON (?:public\.)?blog_post_tags FOR SELECT TO anon, authenticated/);
    assert.match(sql, /blog_posts\.status = 'published'/);
    assert.match(sql, /blog_posts\.published_at <= NOW\(\)/);
  }
  assert.match(migration, /REVOKE INSERT, UPDATE, DELETE ON public\.blog_post_tags FROM anon, authenticated/);
  assert.match(migration, /GRANT SELECT ON public\.blog_post_tags TO anon, authenticated/);
  assert.doesNotMatch(migration, /FOR (?:INSERT|UPDATE|DELETE) TO (?:anon|authenticated)/);
});
