import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";

const source = (path) => readFile(new URL(`../${path}`, import.meta.url), "utf8");

test("Blog related selections are ordered, opt-in, and checked at both write boundaries", async () => {
  const [migration, schema, form, api, utils, page] = await Promise.all([
    source("migrations/2026_blog_related_selections.sql"),
    source("supabase_schema.sql"),
    source("app/components/admin/BlogForm.tsx"),
    source("app/api/admin/blogs/route.ts"),
    source("app/lib/utils.ts"),
    source("app/blog/[slug]/page.tsx"),
  ]);

  for (const sql of [migration, schema]) {
    assert.match(sql, /related_blog_post_ids uuid\[\] NOT NULL DEFAULT '\{\}'::uuid\[\]/i);
    assert.match(sql, /cardinality\(related_blog_post_ids\) <= 3/);
    assert.match(sql, /NOT \(id = ANY\(related_blog_post_ids\)\)/);
  }
  assert.match(migration, /WITH ORDINALITY AS item\(value, position\)/);
  assert.match(migration, /published_at <= now\(\)[\s\S]*?FOR SHARE/);
  assert.match(migration, /CREATE TRIGGER blog_posts_unlink_related_after_delete/);
  assert.match(form, /related_blog_post_ids: \[\]/);
  assert.match(form, /\[\.\.\.selectedRelatedIds, item\.id\]/);
  assert.match(form, /Date\.parse\(item\.published_at\) <= Date\.now\(\)/);
  assert.match(api, /z\.array\(z\.string\(\)\.uuid\(\)\)\.max\(3\)/);
  assert.match(api, /validateRelatedPosts\(data\.related_blog_post_ids, data\.id\)/);
  assert.match(api, /if \(!ids\.length\) return null/);
  assert.match(api, /referringBlogSlugs\(id\)/);
  assert.match(utils, /if \(!supabase \|\| !ids\.length\) return \[\]/);
  assert.match(utils, /return ids\.flatMap\(\(id\) =>/);
  assert.match(utils, /\.eq\('status', 'published'\)[\s\S]*?\.lte\('published_at', new Date\(\)\.toISOString\(\)\)/);
  const relatedRead = utils.slice(utils.indexOf("export async function getRelatedBlogPosts"), utils.indexOf("export async function fetchAndSortChangelogPosts"));
  assert.match(relatedRead, /catch \{[\s\S]*?return \[\];/);
  assert.doesNotMatch(relatedRead, /search_blog_posts|fetchAndSortBlogPosts/);
  assert.match(page, /\{similarPosts\.length > 0 && \(/);
  assert.match(page, /similarPosts\.map\(\(related\) =>/);
  assert.match(page, /SectionHeading kicker="Continue exploring"/);
  assert.match(page, /Browse all articles/);
});
