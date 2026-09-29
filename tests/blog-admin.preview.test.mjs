import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";

const previewUrl = new URL("../app/admin/(dashboard)/blogs/[id]/preview/page.tsx", import.meta.url);
const layoutUrl = new URL("../app/admin/(dashboard)/layout.tsx", import.meta.url);

test("unauthenticated saved-post preview redirects without revealing content", async () => {
  const response = await fetch(
    `${process.env.BLOG_BASE_URL || "http://localhost:3000"}/admin/blogs/00000000-0000-4000-8000-000000000000/preview`,
    { redirect: "manual" },
  );
  assert.ok([307, 308].includes(response.status), `expected a redirect, got ${response.status}`);
  assert.equal(new URL(response.headers.get("location"), response.url).pathname, "/admin/login");
  assert.doesNotMatch(await response.text(), /blog-article-shell|MDXContent/);
});

test("preview is non-indexed, uncached, and authorizes before the service-role read", async () => {
  const [page, layout] = await Promise.all([
    readFile(previewUrl, "utf8"),
    readFile(layoutUrl, "utf8"),
  ]);
  assert.match(page, /robots:\s*\{\s*index: false, follow: false, nocache: true\s*\}/);
  assert.match(page, /export const dynamic = "force-dynamic"/);
  assert.match(page, /export const fetchCache = "force-no-store"/);
  assert.match(layout, /supabase\.auth\.getUser\(\)/);
  assert.match(page, /auth\.auth\.getUser\(\)/);
  assert.ok(page.indexOf("if (!user) redirect") < page.indexOf("createSupabaseAdminClient()"));
  assert.ok(page.indexOf("user.email?.toLowerCase() !== adminEmail") < page.indexOf("createSupabaseAdminClient()"));
  assert.match(page, /\.from\("blog_posts"\)[\s\S]*?\.eq\("id", id\)\s*\.single\(\)/);
  assert.match(page, /error \|\| !post \|\| post\.status === "archived"\) notFound\(\)/);
  assert.doesNotMatch(page, /getBlogPostBySlug|fetchBlogIndexPosts|unstable_cache|generateStaticParams|canonicalUrl|openGraph/);
  assert.doesNotMatch(page, /\.insert\(|\.update\(|\.upsert\(|\.delete\(|\.rpc\(/);
});

test("preview renders the saved body with public editorial styles without public side effects", async () => {
  const page = await readFile(previewUrl, "utf8");
  assert.match(page, /import \{ MDXContent \} from "@\/app\/components\/mdx"/);
  assert.match(page, /<MDXContent code=\{post\.content \|\| ""\} \/>/);
  assert.match(page, /blog-article-shell prose prose-neutral dark:prose-invert/);
  assert.match(page, /Unsaved editor changes will not appear here/);
  assert.match(page, /status === "draft"[\s\S]*?"Scheduled"[\s\S]*?"Live"/);
  assert.doesNotMatch(page, /ArticleReactionWrapper|CtaSection|RelatedPostCard/);
});
