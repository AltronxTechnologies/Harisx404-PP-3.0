import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";

const route = readFileSync(new URL("../app/api/ai/chat/route.ts", import.meta.url), "utf8");

test("assistant context includes published CGPA, SOC internship, and public contact", () => {
  assert.match(route, /CGPA: 3\.5\/4\.0/);
  assert.match(route, /SOC Analyst Intern at Tech Hierarchy/);
  assert.match(route, /itsharis\.tech@gmail\.com/);
  assert.match(route, /No public phone number is listed/);
  assert.match(route, /Available for opportunities/);
});

test("latest blog context comes from public, published, date-ordered summaries", () => {
  assert.match(route, /\.from\('blog_posts'\)/);
  assert.match(route, /\.select\('title, slug, summary, published_at'\)/);
  assert.match(route, /\.eq\('status', 'published'\)/);
  assert.match(route, /\.lte\('published_at', new Date\(\)\.toISOString\(\)\)/);
  assert.match(route, /\.order\('published_at', \{ ascending: false \}\)/);
  assert.match(route, /MOST RECENT:/);
  assert.match(route, /Summarize only what its supplied summary supports/);
  assert.doesNotMatch(route, /fetchAndSortBlogPosts/);
});
