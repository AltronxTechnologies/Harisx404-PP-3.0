import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { createRequire } from "node:module";
import { runInNewContext } from "node:vm";
import test from "node:test";
import ts from "typescript";

const require = createRequire(import.meta.url);
const helperSource = readFileSync(new URL("../app/lib/admin/featured-blog.ts", import.meta.url), "utf8");
const sql = readFileSync(new URL("../migrations/2026_blog_featured_selection.sql", import.meta.url), "utf8");
const home = readFileSync(new URL("../app/page.tsx", import.meta.url), "utf8");
const action = readFileSync(new URL("../app/admin/(dashboard)/blogs/actions.ts", import.meta.url), "utf8");
const routeSource = readFileSync(new URL("../app/api/admin/blogs/featured/route.ts", import.meta.url), "utf8");
const control = readFileSync(new URL("../app/admin/(dashboard)/blogs/BlogFeaturedAction.tsx", import.meta.url), "utf8");

test("both Blog featured entry points authorize before the same transactional RPC", () => {
  assert.ok(action.indexOf("await requireAdmin()") < action.indexOf("changeFeaturedBlogPost(id, featured)"));
  assert.match(action, /return changeFeaturedBlogPost\(id, featured\)/);
  assert.match(control, /throw new Error\(result\.error\)/);
  assert.ok(routeSource.indexOf("await requireAdmin()") < routeSource.indexOf("changeFeaturedBlogPost(payload.data.id"));
  assert.doesNotMatch(action + routeSource, /\.update\(\{ featured:/);
  assert.match(helperSource, /db\.rpc\("set_featured_blog_post"/);
  assert.match(sql, /LOCK TABLE public\.blog_posts IN SHARE ROW EXCLUSIVE MODE/);
  assert.match(sql, /CREATE UNIQUE INDEX blog_posts_one_featured_idx/);
  assert.match(sql, /selected\.status IS DISTINCT FROM 'published' OR selected\.published_at IS NULL/);
  assert.match(sql, /GRANT EXECUTE ON FUNCTION public\.set_featured_blog_post\(uuid, boolean\)\s+TO service_role/);
  assert.match(home, /dbPosts\.find\(\(post\) => post\.featured\) \|\| dbPosts\.reduce/);
  assert.match(control, /disabled=\{isPending \|\| !post\.canFeature\}/);
});

test("successful selection revalidates Home and Blog; missing RPC never reports success", async () => {
  const compiled = ts.transpileModule(helperSource, { compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022 } }).outputText;
  const published = "11111111-1111-4111-8111-111111111111";
  const calls = [];
  let rpcResult = { data: { post: { id: published, title: "Published", slug: "published", featured: true }, previous_slugs: ["previous"] }, error: null };
  const module = { exports: {} };
  runInNewContext(compiled, {
    exports: module.exports,
    require(name) {
      if (name === "server-only") return {};
      if (name === "next/cache") return { revalidatePath: (path) => calls.push(["path", path]), revalidateTag: (tag) => calls.push(["tag", tag]) };
      if (name === "@/app/lib/supabase/server") return { createSupabaseAdminClient: async () => ({
        rpc: async (method, params) => { calls.push(["rpc", method, params]); return rpcResult; },
        from() { throw new Error("Selection must not use multiple writes"); },
      }) };
      return require(name);
    },
    Set,
    Array,
  });
  const { changeFeaturedBlogPost } = module.exports;
  const saved = await changeFeaturedBlogPost(published, true);
  assert.equal(saved.success, true);
  assert.equal(calls.filter(([kind]) => kind === "rpc").length, 1);
  assert.ok(calls.some(([kind, value]) => kind === "tag" && value === "blog-index"));
  assert.ok(calls.some(([kind, value]) => kind === "path" && value === "/"));
  assert.ok(calls.some(([kind, value]) => kind === "path" && value === "/blog/previous"));

  calls.length = 0;
  rpcResult = { data: null, error: { code: "PGRST202", message: "function missing" } };
  const missing = await changeFeaturedBlogPost(published, true);
  assert.equal(missing.success, false);
  assert.equal(missing.status, 503);
  assert.equal(calls.length, 1);

  rpcResult = { data: null, error: { code: "P0001", message: "BLOG_FEATURED_INVALID" } };
  const invalid = await changeFeaturedBlogPost(published, true);
  assert.equal(invalid.success, false);
  assert.equal(invalid.status, 400);
});

test("anonymous callers cannot change Blog featured selection", async () => {
  const response = await fetch(`${process.env.BLOG_BASE_URL || "http://localhost:3000"}/api/admin/blogs/featured`, {
    method: "POST", headers: { "Content-Type": "application/json" }, body: "{}",
  });
  assert.equal(response.status, 401);
});
