import assert from "node:assert/strict";
import test from "node:test";

const baseUrl = process.env.BLOG_BASE_URL || "http://localhost:3000";

async function responseText(path) {
  const response = await fetch(`${baseUrl}${path}`);
  assert.equal(response.status, 200, `${path} should return HTTP 200`);
  return response.text();
}

function rssSlugs(xml) {
  return Array.from(xml.matchAll(/<link>[^<]*\/blog\/([^<]+)<\/link>/g), (match) =>
    match[1].replace(/&amp;/g, "&"),
  );
}

function sitemapSlugs(xml) {
  return Array.from(xml.matchAll(/<loc>[^<]*\/blog\/([^<]+)<\/loc>/g), (match) =>
    match[1],
  );
}

test("Blog index and search states render", async () => {
  const [index, found, missing] = await Promise.all([
    responseText("/blog"),
    responseText("/blog?q=writing"),
    responseText("/blog?q=definitely-no-result"),
  ]);

  assert.match(index, /Learn the reasoning behind/);
  assert.match(found, /the-hard-part-isnt-writing-tests-anymore/i);
  assert.match(missing, /No matching articles/i);
  assert.match(missing, /Try something/);
});

test("RSS and sitemap expose the same non-empty Blog collection", async () => {
  const [rss, sitemap] = await Promise.all([
    responseText("/rss.xml"),
    responseText("/sitemap.xml"),
  ]);
  const feed = rssSlugs(rss);
  const mapped = sitemapSlugs(sitemap);

  assert.ok(feed.length > 0, "RSS should contain at least one published article");
  assert.equal(mapped.length, feed.length);
  assert.deepEqual(new Set(feed), new Set(mapped));
});

test("Every syndicated article route renders without the Blog error state", async () => {
  const rss = await responseText("/rss.xml");
  const slugs = rssSlugs(rss);
  const pages = await Promise.all(slugs.map((slug) => responseText(`/blog/${slug}`)));

  pages.forEach((html, index) => {
    assert.doesNotMatch(
      html,
      /The articles could not be loaded/i,
      `${slugs[index]} rendered the Blog error state`,
    );
  });
});
