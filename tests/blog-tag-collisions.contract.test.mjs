import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";

test("additive Blog tag migration preserves name identity and RPC security", async () => {
  const [migration, api, schema, databaseTest] = await Promise.all([
    readFile(new URL("../migrations/2026_blog_admin_tag_collisions.sql", import.meta.url), "utf8"),
    readFile(new URL("../app/api/admin/blogs/route.ts", import.meta.url), "utf8"),
    readFile(new URL("../supabase_schema.sql", import.meta.url), "utf8"),
    readFile(new URL("./blog-tag-collisions.database.test.sql", import.meta.url), "utf8"),
  ]);
  assert.match(schema, /name TEXT NOT NULL UNIQUE,\s*slug TEXT NOT NULL UNIQUE/);
  assert.match(migration, /BEGIN;[\s\S]*CREATE OR REPLACE FUNCTION public\.save_blog_post_with_tags\([\s\S]*COMMIT;/);
  assert.match(migration, /SECURITY DEFINER\s+SET search_path = pg_catalog, public/);
  assert.match(migration, /SELECT id INTO saved_tag_id FROM public\.tags WHERE name = tag_name/);
  assert.match(migration, /ON CONFLICT DO NOTHING RETURNING id INTO saved_tag_id/);
  assert.match(migration, /md5\(tag_name\) \|\| '-' \|\| tag_attempt::text/);
  assert.match(migration, /INSERT INTO public\.blog_post_tags[\s\S]*ON CONFLICT DO NOTHING/);
  assert.doesNotMatch(migration, /ON CONFLICT[^;]*DO UPDATE/i);
  assert.match(migration, /REVOKE ALL ON FUNCTION public\.save_blog_post_with_tags\(jsonb, jsonb, uuid, timestamptz\)\s+FROM PUBLIC, anon, authenticated/);
  assert.match(migration, /GRANT EXECUTE ON FUNCTION public\.save_blog_post_with_tags\(jsonb, jsonb, uuid, timestamptz\)\s+TO service_role/);
  assert.match(api, /if \(seen\.has\(tag\)\) return \[\];/);
  assert.match(api, /return \[\{ name: tag, slug: normalizeTagSlug\(tag\) \}\]/);
  assert.match(databaseTest, /ROLLBACK;/);
});
