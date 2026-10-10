import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";

const base = process.env.SEO_BASE_URL || "http://localhost:3000";

test("major public entry pages expose matching canonical and social image metadata", async () => {
  for (const path of ["/", "/blog", "/projects"]) {
    const response = await fetch(`${base}${path}`);
    assert.equal(response.status, 200, `${path} responds successfully`);
    const html = await response.text();
    const canonical = html.match(/<link rel="canonical" href="([^"]+)"/);
    assert.equal(new URL(canonical?.[1] || "http://invalid.test").href, `https://harisx404.vercel.app${path === "/" ? "/" : path}`);
    assert.match(html, /<meta property="og:image" content="https:\/\/harisx404\.vercel\.app\/brand\/logo-wide\.png"/);
    assert.match(html, /<meta name="twitter:image" content="https:\/\/harisx404\.vercel\.app\/brand\/logo-wide\.png"/);
  }
  const image = await fetch(`${base}/brand/logo-wide.png`);
  assert.equal(image.status, 200);
  assert.match(image.headers.get("content-type") || "", /^image\/png/);
});

test("About shares its own factual title and description without losing social images", async () => {
  const response = await fetch(`${base}/about`);
  assert.equal(response.status, 200);
  const html = await response.text();
  const meta = (name, attribute) => html.match(new RegExp(`<meta ${attribute}="${name}" content="([^"]+)"`))?.[1];
  const description = meta("description", "name");
  assert.match(html, /<title>About \| harisx404<\/title>/);
  assert.match(description || "", /^Muhammad Haris/);
  assert.equal(meta("og:title", "property"), "About | harisx404");
  assert.equal(meta("twitter:title", "name"), "About | harisx404");
  assert.equal(meta("og:description", "property"), description);
  assert.equal(meta("twitter:description", "name"), description);
  assert.equal(meta("og:url", "property"), "https://harisx404.vercel.app/about");
  assert.match(html, /<link rel="canonical" href="https:\/\/harisx404\.vercel\.app\/about"/);
  assert.match(html, /<meta property="og:image" content="https:\/\/harisx404\.vercel\.app\/brand\/logo-wide\.png"/);
  assert.match(html, /<meta name="twitter:image" content="https:\/\/harisx404\.vercel\.app\/brand\/logo-wide\.png"/);
});

test("static sitemap entries do not claim a change on every regeneration", async () => {
  const response = await fetch(`${base}/sitemap.xml`);
  assert.equal(response.status, 200);
  const xml = await response.text();
  const entries = Array.from(xml.matchAll(/<url>([\s\S]*?)<\/url>/g), (match) => match[1]);
  for (const path of ["/", "/about", "/blog", "/projects", "/contact"]) {
    const url = `https://harisx404.vercel.app${path === "/" ? "" : path}`;
    const entry = entries.find((item) => item.includes(`<loc>${url}</loc>`));
    assert.ok(entry, `${path} is in the sitemap`);
    assert.doesNotMatch(entry, /<lastmod>/, `${path} has no invented update date`);
  }
  assert.ok(entries.some((item) => item.includes("/blog/") && /<lastmod>/.test(item)), "dated Blog articles retain modification dates");
});

test("optional llms.txt does not advertise unpublished Project case studies", async () => {
  const content = await readFile(new URL("../public/llms.txt", import.meta.url), "utf8");
  assert.doesNotMatch(content, /TaskFlow Workspace|NeuroDoc AI Assistant|VisionForge ML Studio/);
  assert.match(content, /TourMate Malakand/);
});

test("representative public structured data is parseable and describes its route", async () => {
  const feed = await fetch(`${base}/rss.xml`).then((response) => response.text());
  const slug = feed.match(/<link>[^<]*\/blog\/([^<]+)<\/link>/)?.[1];
  for (const [path, type] of [["/", "WebSite"], ["/projects", "ItemList"], ...(slug ? [[`/blog/${slug}`, "BlogPosting"]] : [])]) {
    const response = await fetch(`${base}${path}`);
    assert.equal(response.status, 200);
    const html = await response.text();
    const blocks = Array.from(html.matchAll(/<script type="application\/ld\+json"[^>]*>([\s\S]*?)<\/script>/g), (match) => JSON.parse(match[1]));
    assert.ok(blocks.some((block) => block["@type"] === type), `${path} has ${type} JSON-LD`);
  }
});
