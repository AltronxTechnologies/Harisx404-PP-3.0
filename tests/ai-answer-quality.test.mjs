import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";

const route = readFileSync(new URL("../app/api/ai/chat/route.ts", import.meta.url), "utf8");
const knowledge = readFileSync(new URL("../app/lib/ai/public-knowledge.ts", import.meta.url), "utf8");

test("assistant context includes published CGPA, SOC internship, and public contact", () => {
  assert.match(knowledge, /CGPA 3\.5\/4\.0/);
  assert.match(knowledge, /siteMetadata\.email/);
  assert.match(route, /retrievePublicKnowledge/);
});

test("latest blog context comes from public, published, date-ordered summaries", () => {
  assert.match(knowledge, /\.from\("blog_posts"\)/);
  assert.match(knowledge, /\.eq\("status", "published"\)/);
  assert.match(knowledge, /\.lte\("published_at", now\)/);
  assert.match(knowledge, /\.order\("published_at", \{ ascending: false \}\)/);
  assert.match(route, /most recently published post/);
  assert.match(route, /supplied public article supports/);
  assert.doesNotMatch(route, /fetchAndSortBlogPosts/);
});
