import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";

const baseUrl = process.env.PREVIEW_BASE_URL || "http://localhost:3000";

const canonicalPages = [
  "/",
  "/about",
  "/blog",
  "/buildlog",
  "/community-wall",
  "/contact",
  "/credentials",
  "/legal/privacy",
  "/legal/terms",
  "/links",
  "/projects",
  "/resume",
];

const discoveryRoutes = ["/rss.xml", "/sitemap.xml"];

test("Search and Footer expose every canonical public page", async () => {
  const [searchModal, footer] = await Promise.all([
    readFile(new URL("../app/components/navbar/SearchModal.tsx", import.meta.url), "utf8"),
    readFile(new URL("../app/components/Footer.tsx", import.meta.url), "utf8"),
  ]);

  for (const route of [...canonicalPages, ...discoveryRoutes]) {
    assert.ok(searchModal.includes(`link: "${route}"`), `Search is missing ${route}`);
    assert.ok(footer.includes(`href: "${route}"`), `Footer is missing ${route}`);
  }
});

test("every canonical Search and Footer destination resolves", async () => {
  const responses = await Promise.all(
    [...canonicalPages, ...discoveryRoutes].map(async (route) => [
      route,
      await fetch(`${baseUrl}${route}`, { redirect: "manual" }),
    ]),
  );

  for (const [route, response] of responses) {
    assert.equal(response.status, 200, `${route} returned ${response.status}`);
  }
});

test("dynamic Search follows the public content visibility contract", async () => {
  const source = await readFile(
    new URL("../app/api/ai/search/route.ts", import.meta.url),
    "utf8",
  );

  assert.match(source, /\.lte\("published_at", now\)/);
  assert.match(source, /!isLocalBlogDraft\(post\.slug\)/);
  assert.equal((source.match(/\.ilike\("slug", pattern\)/g) || []).length, 2);
});

test("sitemap includes every canonical public page", async () => {
  const response = await fetch(`${baseUrl}/sitemap.xml`);
  assert.equal(response.status, 200);
  const xml = await response.text();

  for (const route of canonicalPages.filter((route) => route !== "/")) {
    assert.match(xml, new RegExp(`<loc>[^<]+${route.replaceAll("/", "\\/")}</loc>`));
  }
});
