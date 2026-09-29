import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";

test("Admin Blog overview uses authorized columns and honest live counts", async () => {
  const source = await readFile(new URL("../app/admin/(dashboard)/page.tsx", import.meta.url), "utf8");
  assert.match(source, /const blogAdmin = await createSupabaseAdminClient\(\)/);
  assert.match(source, /blogAdmin\.from\("blog_posts"\)\.select\("id, title, slug, status, published_at"\)/);
  assert.match(source, /\.eq\("status", "published"\)\.lte\("published_at", now\.toISOString\(\)\)/);
  assert.match(source, /blogListStatus\(post\.status, post\.published_at, now\.getTime\(\)\)/);
  assert.match(source, /label: "Live Posts"/);
  assert.match(source, /recentPostsError \? \(/);
  assert.match(source, /Recent blog posts could not be loaded/);
  assert.doesNotMatch(source, /publishedAt/);
});
