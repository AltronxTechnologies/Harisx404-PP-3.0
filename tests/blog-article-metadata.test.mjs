import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";

const baseUrl = process.env.BLOG_BASE_URL || "http://localhost:3000";

test("published article uses truthful dates, no invented author, and an absolute cover in JSON-LD", async () => {
  const response = await fetch(`${baseUrl}/blog/the-hard-part-isnt-writing-tests-anymore`);
  assert.equal(response.status, 200);
  const html = await response.text();
  const scripts = Array.from(html.matchAll(/<script type="application\/ld\+json"[^>]*>([^<]*)<\/script>/g));
  const article = scripts.map((match) => JSON.parse(match[1])).find((data) => data["@type"] === "BlogPosting");

  assert.ok(article, "BlogPosting JSON-LD should render");
  assert.ok(article.datePublished);
  assert.equal(Object.hasOwn(article, "author"), false);
  assert.match(html, /<span class="hidden sm:inline">Published <\/span><time dateTime="[^"]+">/);
  assert.ok(html.includes(`<time dateTime="${article.datePublished}"`));
  assert.doesNotMatch(html, /<meta property="article:author"/);
  assert.ok(html.includes(`<meta property="article:published_time" content="${article.datePublished}"`));
  assert.ok(article.image, "fixture article should have a cover");
  assert.match(article.image, /^https?:\/\/[^/]+\//);
  assert.ok(html.includes(`/_next/image?url=${encodeURIComponent(article.image)}`), "cover should still render");
  assert.match(html, /<link rel="canonical" href="https?:\/\/[^" ]+"/);
});

test("canonical values are constrained both at Admin input and on legacy article reads", async () => {
  const [route, page] = await Promise.all([
    readFile(new URL("../app/api/admin/blogs/route.ts", import.meta.url), "utf8"),
    readFile(new URL("../app/blog/[slug]/page.tsx", import.meta.url), "utf8"),
  ]);
  assert.match(route, /canonical_url: optionalCanonicalUrl/);
  assert.match(route, /\["http:", "https:"\]\.includes\(url\.protocol\)/);
  assert.match(route, /!url\.username && !url\.password/);
  assert.match(page, /canonical: safeCanonicalUrl\(post\.canonicalUrl, post\.slug\)/);
  assert.match(page, /return `\/blog\/\$\{slug\}`/);
  assert.match(page, /\.replace\(\/<\/g, "\\\\u003c"\)/);
});

test("Blog feed does not assign all imported posts to one author", async () => {
  const response = await fetch(`${baseUrl}/rss.xml`);
  assert.equal(response.status, 200);
  assert.doesNotMatch(await response.text(), /AI by Muhammad Haris/);
});
