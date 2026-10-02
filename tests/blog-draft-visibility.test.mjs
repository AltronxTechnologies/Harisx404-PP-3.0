import assert from "node:assert/strict";
import { readdir, readFile } from "node:fs/promises";
import test from "node:test";

const baseUrl = process.env.BLOG_BASE_URL || "http://localhost:3000";

test("middleware draft preflight stays in sync with local article frontmatter", async () => {
  const directory = new URL("../content/blog/", import.meta.url);
  const files = (await readdir(directory)).filter((file) => file.endsWith(".mdx"));
  const drafts = [];
  for (const file of files) {
    const source = await readFile(new URL(file, directory), "utf8");
    const frontmatter = source.split(/^---\s*$/m)[1];
    if (/^draft:\s*true\s*$/m.test(frontmatter || "")) drafts.push(file.slice(0, -4));
  }

  const middleware = await readFile(new URL("../middleware.ts", import.meta.url), "utf8");
  const manifest = middleware.match(/const LOCAL_BLOG_DRAFTS = new Set\(\[([\s\S]*?)\]\)/)?.[1];
  assert.ok(manifest, "draft manifest must exist in middleware");
  const preflightDrafts = Array.from(manifest.matchAll(/"([^"]+)"/g), (match) => match[1]);
  assert.deepEqual(preflightDrafts.sort(), drafts.sort());

  const page = await readFile(new URL("../app/blog/[slug]/page.tsx", import.meta.url), "utf8");
  assert.match(page, /generateMetadata\([\s\S]*?if \(isLocalBlogDraft\(slug\)\) notFound\(\);[\s\S]*?getBlogPostBySlug\(slug\)/);
});

test("a locally marked draft returns a real 404 with no published metadata", async () => {
  const url = `${baseUrl}/blog/tailwind-2-is-live`;
  const [get, head] = await Promise.all([fetch(url), fetch(url, { method: "HEAD" })]);
  assert.equal(get.status, 404);
  assert.equal(head.status, 404);
  assert.match(get.headers.get("x-robots-tag") || "", /noindex/);
  const html = await get.text();
  assert.doesNotMatch(html, /id="blog-article"|<title>Tailwind 2\.0 is Live!/);
  assert.doesNotMatch(html, /<meta property="og:title" content="Tailwind 2\.0 is Live!"/);
});

test("a public article remains a 200 with article metadata", async () => {
  const response = await fetch(`${baseUrl}/blog/the-hard-part-isnt-writing-tests-anymore`);
  assert.equal(response.status, 200);
  const html = await response.text();
  assert.match(html, /id="blog-article"/);
  assert.match(html, /<meta property="og:type" content="article"/);
});
